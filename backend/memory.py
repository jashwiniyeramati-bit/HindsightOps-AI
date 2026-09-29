import logging
import sqlite3
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

try:
    from hindsight_client import Hindsight as _HindsightSDK
    _SDK_AVAILABLE = True
except ImportError:
    _HindsightSDK = None
    _SDK_AVAILABLE = False


class HindsightMemory:
    def __init__(self, base_url: str, api_key: Optional[str] = None) -> None:
        self._base_url = base_url
        self._api_key = api_key
        self._client: Optional[Any] = None
        self._available = False
        self._db_path = Path(__file__).resolve().parent / "hindsight_agent.db"

        if not _SDK_AVAILABLE:
            return

        try:
            kwargs = {"base_url": base_url}
            if api_key:
                kwargs["api_key"] = api_key

            self._client = _HindsightSDK(**kwargs)

            import urllib.request
            try:
                urllib.request.urlopen(
                    f"{base_url.rstrip('/')}/health",
                    timeout=1.5
                )
                self._available = True
                logger.info("Hindsight server is live at %s", base_url)
            except Exception:
                self._available = False
                logger.info(
                    "Hindsight unavailable. Using local SQLite memory fallback."
                )
        except Exception as exc:
            logger.warning("Could not initialise Hindsight client: %s", exc)

    def check_connection(self) -> bool:
        import urllib.request

        try:
            urllib.request.urlopen(
                f"{self._base_url.rstrip('/')}/health",
                timeout=1.5
            )
            self._available = True
            return True
        except Exception:
            self._available = False
            return False

    @staticmethod
    def _bank_id(user_id: str) -> str:
        return f"hindsight-{user_id}"

    @property
    def available(self) -> bool:
        return self._available

    def _local_recall(self, query: str, top_k: int = 5) -> list[dict]:
        if not self._db_path.exists():
            return []

        try:
            connection = sqlite3.connect(self._db_path)
            connection.row_factory = sqlite3.Row

            rows = connection.execute(
                """
                SELECT id, service, title, error, severity,
                       status, description, deployment
                FROM incidents
                WHERE status = 'resolved'
                ORDER BY created_at DESC
                """
            ).fetchall()

            connection.close()

            query_words = set(query.lower().split())
            scored = []

            for row in rows:
                text = (
                    f"Incident {row['id']}. "
                    f"Service: {row['service']}. "
                    f"Title: {row['title']}. "
                    f"Error: {row['error']}. "
                    f"Severity: {row['severity']}. "
                    f"Description: {row['description']}. "
                    f"Deployment: {row['deployment']}."
                )

                text_words = set(text.lower().split())
                score = len(query_words.intersection(text_words))

                if score > 0:
                    scored.append((score, text))

            scored.sort(key=lambda item: item[0], reverse=True)

            return [
                {"text": text}
                for _, text in scored[:top_k]
            ]

        except Exception as exc:
            logger.warning("Local recall failed: %s", exc)
            return []

    def retain(self, user_id: str, content: str) -> dict:
        if not content.strip():
            return {
                "status": "skipped",
                "reason": "empty content"
            }

        if not self._available:
            return {
                "status": "local_only",
                "reason": "Hindsight unavailable; local incident database remains available"
            }

        try:
            result = self._client.retain(
                bank_id=self._bank_id(user_id),
                content=content,
            )
            return {
                "status": "ok",
                "result": str(result)
            }
        except Exception as exc:
            logger.warning("RETAIN failed: %s", exc)
            return {
                "status": "error",
                "error": str(exc)
            }

    def recall(
        self,
        user_id: str,
        query: str,
        top_k: int = 5
    ) -> list[dict]:

        if not self._available:
            logger.info("Using local SQLite incident history for recall.")
            return self._local_recall(query, top_k)

        try:
            response = self._client.recall(
                bank_id=self._bank_id(user_id),
                query=query,
            )

            results = []

            for r in (response.results or [])[:top_k]:
                results.append({
                    "text": getattr(r, "text", str(r))
                })

            return results

        except Exception as exc:
            logger.warning("RECALL failed: %s", exc)
            return self._local_recall(query, top_k)

    def reflect(self, user_id: str, query: str) -> str:
        if not self._available:
            return ""

        try:
            response = self._client.reflect(
                bank_id=self._bank_id(user_id),
                query=query
            )
            return getattr(response, "text", "") or ""

        except Exception as exc:
            logger.warning("REFLECT failed: %s", exc)
            return ""

    def list_memories(self, user_id: str) -> list[dict]:
        if not self._available:
            return []

        try:
            import asyncio

            docs = asyncio.run(
                self._client.documents.list_documents(
                    self._bank_id(user_id)
                )
            )

            return [
                {
                    "id": getattr(d, "id", ""),
                    "content": getattr(d, "content", ""),
                    "created_at": str(
                        getattr(d, "created_at", "")
                    ),
                }
                for d in (docs.documents or [])
            ]

        except Exception as exc:
            logger.warning("list_memories failed: %s", exc)
            return []