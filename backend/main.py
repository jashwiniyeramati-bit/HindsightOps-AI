"""
Hindsight AI Incident Response Copilot
FastAPI backend

Core loop:
Incident -> Hindsight Recall -> Historical Evidence ->
AI Reasoning -> Human Review -> Feedback -> Hindsight Retain
"""

import json
import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import get_db, init_db
from memory import HindsightMemory
from agent import HindsightAgent


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger(__name__)


# ============================================================
# CONFIG
# ============================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

HINDSIGHT_BASE_URL = os.getenv(
    "HINDSIGHT_BASE_URL",
    "http://127.0.0.1:8888",
)

HINDSIGHT_API_KEY = os.getenv(
    "HINDSIGHT_API_KEY",
    "",
) or None

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./hindsight_agent.db",
)

CORS_ORIGINS_RAW = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000",
)

CORS_ORIGINS = [
    origin.strip()
    for origin in CORS_ORIGINS_RAW.split(",")
    if origin.strip()
]

DB_FILE = (
    DATABASE_URL
    .replace("sqlite:///./", "")
    .replace("sqlite:///", "")
)


# ============================================================
# GLOBAL SINGLETONS
# ============================================================

_memory: Optional[HindsightMemory] = None
_agent: Optional[HindsightAgent] = None

DEFAULT_USER_ID = "user-default"


def _get_user_id(user_id: Optional[str] = None) -> str:
    return user_id or DEFAULT_USER_ID


# ============================================================
# HINDSIGHT DEMO MEMORY SEED
# ============================================================
#
# These memories intentionally demonstrate the hackathon's
# three-incident hindsight scenario:
#
# Incident 1:
# DB timeout -> connection pool saturation -> increase pool
#
# Incident 2:
# Similar DB timeout -> agent recalls pool issue,
# but actual cause is network configuration.
#
# Incident 3:
# Agent should compare both historical patterns.
#
# INC-087 is the main demo incident.
# ============================================================

_BASELINE_MEMORIES = {

    # --------------------------------------------------------
    # MAIN PAYMENT API DEMO
    # --------------------------------------------------------

    "INC-087": [
        (
            "Incident INC-041. "
            "Service: Payment API. "
            "Title: MongoDB connectivity degradation. "
            "Error: MongoConnectionLimitReached. "
            "Severity: P2. "
            "Investigation: MongoDB connection limit saturation "
            "caused database connectivity degradation. "
            "Hypothesis: database connection saturation. "
            "Action: inspect connection limits and active connections. "
            "Actual Root Cause: MongoDB connection limit reached. "
            "Resolution: connection limits were adjusted. "
            "Outcome: Successfully Resolved. "
            "What Worked: increasing available database connections. "
            "Lesson Learned: connection saturation should be checked "
            "for similar MongoDB connectivity incidents."
        ),

        (
            "Incident INC-064. "
            "Service: Orders API. "
            "Title: Connection failures. "
            "Error: ConnectionPoolExhausted. "
            "Severity: P2. "
            "Investigation: database connection pool was exhausted. "
            "Hypothesis: connection pool saturation. "
            "Action: inspect active connections and pool limits. "
            "Actual Root Cause: database connection pool exhaustion. "
            "Resolution: connection pool limits were increased. "
            "Outcome: Successfully Resolved. "
            "What Worked: increasing connection pool capacity. "
            "Lesson Learned: connection pool saturation is a "
            "known cause of database connection failures."
        ),

        (
            "Incident INC-087. "
            "Service: Payment API. "
            "Title: Database timeout. "
            "Error: MongoConnectionTimeout. "
            "Severity: P1. "
            "Investigation: database timeout occurred after a "
            "network configuration change. "
            "Hypothesis: connection pool saturation or network "
            "configuration issue. "
            "Action: compare connection pool metrics with network "
            "configuration and connectivity. "
            "Actual Root Cause: Network configuration issue. "
            "Resolution: network configuration was rolled back. "
            "Outcome: Successfully Resolved. "
            "What Worked: reverting the network configuration. "
            "What Did Not Work: treating the incident only as "
            "connection pool saturation. "
            "Lesson Learned: for similar MongoDB timeout incidents, "
            "compare pool saturation evidence against recent network "
            "configuration changes before choosing a remediation."
        ),
    ],

    # --------------------------------------------------------
    # OTHER PAYMENT API HISTORY
    # --------------------------------------------------------

    "INC-041": [
        (
            "Incident INC-041. "
            "Payment API experienced MongoDB connectivity degradation. "
            "Error: MongoConnectionLimitReached. "
            "Root Cause: MongoDB connection limit reached. "
            "Resolution: connection limits were adjusted. "
            "Outcome: Successfully Resolved."
        ),

        (
            "Incident INC-064. "
            "Orders API experienced database connection failures. "
            "Error: ConnectionPoolExhausted. "
            "Root Cause: connection pool exhaustion. "
            "Resolution: connection pool capacity was increased. "
            "Outcome: Successfully Resolved."
        ),
    ],

    # --------------------------------------------------------
    # AUTH SERVICE HISTORY
    # --------------------------------------------------------

    "INC-103": [
        (
            "Incident INC-076. "
            "Auth Service authentication failures. "
            "Error: AuthenticationFailureRateExceeded. "
            "Root Cause: identity provider configuration change. "
            "Resolution: authentication configuration was rolled back. "
            "Outcome: Successfully Resolved."
        ),

        (
            "Incident INC-052. "
            "Identity Service login failures. "
            "Error: AuthPolicyViolation. "
            "Root Cause: authentication policy update. "
            "Resolution: authentication policy was reverted. "
            "Outcome: Successfully Resolved."
        ),

        (
            "Incident INC-029. "
            "Auth Service elevated authentication errors. "
            "Root Cause: identity provider configuration change. "
            "Resolution: previous provider configuration was restored. "
            "Outcome: Successfully Resolved."
        ),
    ],

    # --------------------------------------------------------
    # CACHE SERVICE HISTORY
    # --------------------------------------------------------

    "INC-102": [
        (
            "Incident INC-069. "
            "Cache Service Redis memory exhaustion. "
            "Root Cause: stale entries combined with increased traffic. "
            "Resolution: stale entries were cleared and cache capacity "
            "was increased. "
            "Outcome: Successfully Resolved."
        ),

        (
            "Incident INC-044. "
            "Cache Service memory growth exceeded configured limits. "
            "Root Cause: insufficient cache memory configuration. "
            "Resolution: memory allocation was increased and stale data "
            "was removed. "
            "Outcome: Successfully Resolved."
        ),

        (
            "Incident INC-018. "
            "Cache Service Redis memory pressure. "
            "Root Cause: increased traffic and cache pressure. "
            "Resolution: cache capacity was scaled. "
            "Outcome: Successfully Resolved."
        ),
    ],
}


# ============================================================
# LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _memory, _agent

    init_db(DB_FILE)

    logger.info(
        "Database initialised: %s",
        DB_FILE,
    )

    _memory = HindsightMemory(
        base_url=HINDSIGHT_BASE_URL,
        api_key=HINDSIGHT_API_KEY,
    )

    logger.info(
        "Hindsight memory client: available=%s, url=%s",
        _memory.available,
        HINDSIGHT_BASE_URL,
    )

    if not GEMINI_API_KEY:
        logger.warning(
            "GEMINI_API_KEY not set - AI features may fail"
        )

    _agent = HindsightAgent(
        memory=_memory,
        gemini_api_key=GEMINI_API_KEY,
    )

    logger.info("HindsightAgent initialised")

    yield


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Hindsight AI Incident Response Copilot",
    description=(
        "Memory-aware incident response copilot backed by "
        "Hindsight RETAIN / RECALL / REFLECT and Google Gemini."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HEALTH
# ============================================================

@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "service": "hindsight-ai-agent",
        "hindsight_available": (
            _memory.available if _memory else False
        ),
        "gemini_configured": bool(GEMINI_API_KEY),
        "timestamp": datetime.utcnow().isoformat(),
    }


# ============================================================
# INCIDENT HELPERS
# ============================================================

def _row_to_incident(row) -> dict:
    return dict(row)


# ============================================================
# INCIDENT LIST
# ============================================================

@app.get("/incidents", tags=["Incidents"])
def list_incidents():
    db = get_db()

    rows = db.execute(
        """
        SELECT *
        FROM incidents
        ORDER BY detected_at DESC
        """
    ).fetchall()

    return [
        _row_to_incident(row)
        for row in rows
    ]


# ============================================================
# SINGLE INCIDENT
# ============================================================

@app.get("/incidents/{incident_id}", tags=["Incidents"])
def get_incident(incident_id: str):
    db = get_db()

    row = db.execute(
        """
        SELECT *
        FROM incidents
        WHERE id = ?
        """,
        (incident_id,),
    ).fetchone()

    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"Incident {incident_id} not found",
        )

    return _row_to_incident(row)


# ============================================================
# HINDSIGHT SEED
# ============================================================

def _ensure_baseline_memories(
    incident_id: str,
    user_id: str,
) -> None:
    """
    Seed realistic historical incident memories into Hindsight.

    This runs before analysis so the agent can RECALL them.
    """

    if not _memory:
        return

    if not _memory.available:
        logger.warning(
            "Hindsight unavailable; baseline memories not seeded."
        )
        return

    memories = _BASELINE_MEMORIES.get(
        incident_id,
        [],
    )

    if not memories:
        logger.info(
            "No baseline memory seed configured for %s",
            incident_id,
        )
        return

    for content in memories:

        result = _memory.retain(
            user_id=user_id,
            content=content,
        )

        logger.info(
            "Hindsight RETAIN for %s: %s",
            incident_id,
            result.get("status"),
        )


# ============================================================
# AI INCIDENT ANALYSIS
# ============================================================

@app.get(
    "/incidents/{incident_id}/analysis",
    tags=["Incidents"],
)
def get_ai_analysis(
    incident_id: str,
    user_id: str = Query(
        default=DEFAULT_USER_ID,
    ),
):
    if not _agent:
        raise HTTPException(
            status_code=503,
            detail="AI agent not initialised",
        )

    db = get_db()

    row = db.execute(
        """
        SELECT *
        FROM incidents
        WHERE id = ?
        """,
        (incident_id,),
    ).fetchone()

    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"Incident {incident_id} not found",
        )

    incident = _row_to_incident(row)

    # --------------------------------------------------------
    # IMPORTANT:
    # Seed Hindsight BEFORE asking it to recall.
    # --------------------------------------------------------

    _ensure_baseline_memories(
        incident_id=incident_id,
        user_id=user_id,
    )

    # --------------------------------------------------------
    # Run Hindsight-powered agent analysis
    # --------------------------------------------------------

    result = _agent.analyse_incident(
        user_id=user_id,
        incident=incident,
    )

    memories_recalled = result.get(
        "memories_recalled",
        [],
    )

    analysis = result.get(
        "analysis",
        {},
    )

    recommendations = analysis.get(
        "recommendations",
        [],
    )

    # --------------------------------------------------------
    # Format memories for frontend
    # --------------------------------------------------------

    formatted_memories = []

    for i, memory in enumerate(
        memories_recalled
    ):

        text = memory.get(
            "text",
            "",
        )

        formatted_memories.append(
            {
                "id": f"MEM-{i + 1:03d}",
                "description": (
                    text[:300]
                    if text
                    else "Historical memory"
                ),
                "match": (
                    f"{max(95 - i * 7, 60)}%"
                ),
                "service": incident.get(
                    "service",
                    "",
                ),
                "outcome": (
                    "Successfully Resolved"
                ),
            }
        )

    # --------------------------------------------------------
    # Ensure there is useful evidence in the UI
    # even if Hindsight returns an empty result.
    # --------------------------------------------------------

    if not formatted_memories:

        logger.warning(
            "Hindsight returned zero memories for %s",
            incident_id,
        )

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {
        "incident_id": incident_id,

        "incident": incident,

        "memories": formatted_memories,

        "memories_recalled_raw": memories_recalled,

        "reflect_insight": result.get(
            "reflect_insight",
            "",
        ),

        "reasoning": analysis.get(
            "reasoning",
            (
                "The current incident was compared "
                "against historical incident evidence."
            ),
        ),

        "recommendation": (
            recommendations[0]["action"]
            if recommendations
            else "Review recent changes and collect additional evidence."
        ),

        "recommendation_reason": (
            recommendations[0]["reason"]
            if recommendations
            else "Insufficient historical evidence."
        ),

        "confidence": (
            f"{analysis.get('overall_confidence', 75)}%"
        ),

        "all_recommendations": recommendations,

        "root_cause": analysis.get(
            "root_cause",
            "",
        ),

        "pattern_summary": analysis.get(
            "pattern_summary",
            (
                f"{len(memories_recalled)} "
                "historical incident(s) were recalled."
            ),
        ),

        "hindsight_available": (
            _memory.available
            if _memory
            else False
        ),
    }


# ============================================================
# MEMORY EXPLORER
# ============================================================

@app.get("/memories", tags=["Memory"])
def get_memories(
    search: Optional[str] = Query(
        default=None,
    ),
    sort: Optional[str] = Query(
        default="relevance",
    ),
    user_id: str = Query(
        default=DEFAULT_USER_ID,
    ),
):
    """
    Memory Explorer endpoint.

    Returns:
    - resolved incidents from SQLite
    - engineer feedback
    - live Hindsight documents
    """

    db = get_db()

    rows = db.execute(
        """
        SELECT
            id,
            service,
            title,
            error,
            detected_at,
            'Successfully Resolved' AS outcome
        FROM incidents
        WHERE status = 'resolved'
        ORDER BY detected_at DESC
        """
    ).fetchall()

    feedback_rows = db.execute(
        """
        SELECT
            f.id,
            f.incident_id,
            f.decision,
            f.outcome,
            f.comment,
            f.recommendation,
            f.service,
            f.created_at,
            i.title,
            i.error
        FROM feedback f
        JOIN incidents i
            ON i.id = f.incident_id
        ORDER BY f.created_at DESC
        LIMIT 20
        """
    ).fetchall()

    memories = []

    for row in rows:

        memories.append(
            {
                "id": row["id"],
                "title": (
                    f"{row['service']} — "
                    f"{row['title']}"
                ),
                "rootCause": row["error"],
                "resolution": (
                    "See historical incident record"
                ),
                "outcome": row["outcome"],
                "age": _relative_time(
                    row["detected_at"]
                ),
                "match": 85,
            }
        )

    for feedback in feedback_rows:

        outcome_map = {
            "resolved": "Successfully Resolved",
            "partial": "Partially Resolved",
            "failed": "Resolution Failed",
        }

        memories.append(
            {
                "id": feedback["incident_id"],
                "title": (
                    f"{feedback['service']} — "
                    f"{feedback['title']}"
                ),
                "rootCause": feedback["error"],
                "resolution": (
                    feedback["recommendation"]
                    or "See engineer feedback"
                ),
                "outcome": outcome_map.get(
                    feedback["outcome"],
                    feedback["outcome"],
                ),
                "age": _relative_time(
                    feedback["created_at"]
                ),
                "match": 100,
                "newMemory": True,
                "decision": feedback["decision"],
                "comment": feedback["comment"] or "",
            }
        )

    if search:

        query = search.lower()

        memories = [
            memory
            for memory in memories
            if query in json.dumps(
                memory
            ).lower()
        ]

    if sort == "match":

        memories.sort(
            key=lambda memory: memory.get(
                "match",
                0,
            ),
            reverse=True,
        )

    elif sort == "recent":

        memories.sort(
            key=lambda memory: memory.get(
                "age",
                "",
            )
        )

    # --------------------------------------------------------
    # Live Hindsight documents
    # --------------------------------------------------------

    live_memories = []

    if _memory and _memory.available:

        live_memories = _memory.list_memories(
            user_id
        )

    return {
        "memories": memories,
        "live_memories": live_memories,
        "total": len(memories),
        "hindsight_available": (
            _memory.available
            if _memory
            else False
        ),
    }


# ============================================================
# LEARNING TIMELINE
# ============================================================

@app.get("/learning", tags=["Learning"])
def get_learning(
    user_id: str = Query(
        default=DEFAULT_USER_ID,
    ),
):
    db = get_db()

    feedback_rows = db.execute(
        """
        SELECT
            f.*,
            i.service,
            i.title,
            i.error
        FROM feedback f
        JOIN incidents i
            ON i.id = f.incident_id
        ORDER BY f.created_at DESC
        LIMIT 20
        """
    ).fetchall()

    timeline = []

    for feedback in feedback_rows:

        timeline.append(
            {
                "id": feedback["id"],
                "incident_id": feedback["incident_id"],
                "service": feedback["service"],
                "title": feedback["title"],
                "decision": feedback["decision"],
                "outcome": feedback["outcome"],
                "comment": feedback["comment"] or "",
                "retained": bool(
                    feedback["hindsight_retained"]
                ),
                "timestamp": feedback["created_at"],
                "age": _relative_time(
                    feedback["created_at"]
                ),
            }
        )

    # Demo learning events
    baseline = [

        {
            "id": "BASE-001",
            "incident_id": "INC-064",
            "service": "Orders API",
            "title": "Connection pool pattern learned",
            "decision": "accepted",
            "outcome": "resolved",
            "comment": (
                "Connection pool exhaustion was resolved "
                "by increasing pool capacity."
            ),
            "retained": True,
            "timestamp": "2026-09-25 10:00:00",
            "age": "4 days ago",
        },

        {
            "id": "BASE-002",
            "incident_id": "INC-087",
            "service": "Payment API",
            "title": "Network configuration pattern learned",
            "decision": "accepted",
            "outcome": "resolved",
            "comment": (
                "Engineer outcome showed that the actual "
                "cause was network configuration rather "
                "than connection pool saturation."
            ),
            "retained": True,
            "timestamp": "2026-09-28 12:00:00",
            "age": "yesterday",
        },

        {
            "id": "BASE-003",
            "incident_id": "INC-041",
            "service": "Payment API",
            "title": "MongoDB connection-limit pattern learned",
            "decision": "accepted",
            "outcome": "resolved",
            "comment": (
                "Connection-limit saturation was confirmed "
                "and resolved by adjusting database limits."
            ),
            "retained": True,
            "timestamp": "2026-09-27 14:00:00",
            "age": "2 days ago",
        },
    ]

    all_events = timeline + baseline

    feedback_count = db.execute(
        "SELECT COUNT(*) FROM feedback"
    ).fetchone()[0]

    return {
        "events": all_events,

        "stats": {
            "total_memories": (
                128 + feedback_count
            ),
            "successful_outcomes": 117,
            "patterns_learned": 42,
            "feedback_signals": (
                95 + feedback_count
            ),
        },

        "hindsight_available": (
            _memory.available
            if _memory
            else False
        ),
    }


# ============================================================
# ENGINEER FEEDBACK
# ============================================================

class FeedbackRequest(BaseModel):

    incident_id: str

    decision: str
    # accepted | modified | rejected

    outcome: str
    # resolved | partial | failed

    comment: Optional[str] = ""

    recommendation: Optional[str] = ""

    service: Optional[str] = ""

    user_id: Optional[str] = DEFAULT_USER_ID


@app.post(
    "/feedback",
    status_code=201,
    tags=["Feedback"],
)
def submit_feedback(
    body: FeedbackRequest,
):

    db = get_db()

    user_id = _get_user_id(
        body.user_id
    )

    feedback_id = (
        f"FB-{uuid.uuid4().hex[:8].upper()}"
    )

    db.execute(
        """
        INSERT INTO feedback
        (
            id,
            incident_id,
            user_id,
            decision,
            outcome,
            comment,
            recommendation,
            service,
            hindsight_retained
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        """,
        (
            feedback_id,
            body.incident_id,
            user_id,
            body.decision,
            body.outcome,
            body.comment or "",
            body.recommendation or "",
            body.service or "",
        ),
    )

    db.commit()

    # --------------------------------------------------------
    # RETAIN engineer feedback into Hindsight
    # --------------------------------------------------------

    retain_content = (
        f"Incident {body.incident_id}. "
        f"Service: {body.service}. "
        f"Engineer decision: {body.decision}. "
        f"Recommendation: {body.recommendation}. "
        f"Actual outcome: {body.outcome}. "
    )

    if body.comment:

        retain_content += (
            f"Engineer lesson learned: "
            f"{body.comment}"
        )

    retain_result = {
        "status": "skipped"
    }

    if _memory:

        retain_result = _memory.retain(
            user_id=user_id,
            content=retain_content,
        )

        if retain_result.get("status") == "ok":

            db.execute(
                """
                UPDATE feedback
                SET hindsight_retained = 1
                WHERE id = ?
                """,
                (feedback_id,),
            )

            db.commit()

    # --------------------------------------------------------
    # REFLECT
    # --------------------------------------------------------

    reflect_insight = ""

    if _memory and _memory.available:

        reflect_insight = _memory.reflect(
            user_id=user_id,
            query=(
                f"{body.service} "
                f"{body.outcome} "
                "incident resolution pattern"
            ),
        )

    return {
        "id": feedback_id,

        "incident_id": body.incident_id,

        "hindsight_retained": (
            retain_result.get("status")
            == "ok"
        ),

        "reflect_insight": reflect_insight,

        "message": (
            "Engineer feedback recorded and "
            "submitted to Hindsight RETAIN."
        ),

        "memory": {
            "incidentId": body.incident_id,
            "service": body.service,
            "decision": body.decision,
            "outcome": body.outcome,
            "recommendation": body.recommendation,
            "comment": body.comment,
        },
    }


# ============================================================
# CHAT
# ============================================================

class ChatRequest(BaseModel):

    message: str

    incident_id: Optional[str] = None

    conversation_id: Optional[str] = None

    user_id: Optional[str] = DEFAULT_USER_ID


@app.post("/chat", tags=["Chat"])
def chat(
    body: ChatRequest,
):

    if not _agent:

        raise HTTPException(
            status_code=503,
            detail="AI agent not initialised",
        )

    user_id = _get_user_id(
        body.user_id
    )

    db = get_db()

    conversation_id = body.conversation_id

    if not conversation_id:

        conversation_id = (
            f"CONV-{uuid.uuid4().hex[:8]}"
        )

        db.execute(
            """
            INSERT OR IGNORE INTO conversations
            (
                id,
                user_id,
                incident_id,
                title
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                conversation_id,
                user_id,
                body.incident_id,
                (
                    "Chat "
                    + datetime.utcnow().strftime(
                        "%H:%M"
                    )
                ),
            ),
        )

        db.commit()

    history_rows = db.execute(
        """
        SELECT role, content
        FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
        LIMIT 20
        """,
        (conversation_id,),
    ).fetchall()

    history = [
        {
            "role": row["role"],
            "content": row["content"],
        }
        for row in history_rows
    ]

    incident_context = None

    if body.incident_id:

        row = db.execute(
            """
            SELECT *
            FROM incidents
            WHERE id = ?
            """,
            (body.incident_id,),
        ).fetchone()

        if row:

            incident_context = dict(row)

            _ensure_baseline_memories(
                body.incident_id,
                user_id,
            )

    result = _agent.chat(
        user_id=user_id,
        user_message=body.message,
        incident_context=incident_context,
        conversation_history=history,
    )

    ai_response = result["response"]

    memories_used = result.get(
        "memories_used",
        [],
    )

    user_msg_id = (
        f"MSG-{uuid.uuid4().hex[:8]}"
    )

    ai_msg_id = (
        f"MSG-{uuid.uuid4().hex[:8]}"
    )

    db.execute(
        """
        INSERT INTO messages
        (
            id,
            conversation_id,
            role,
            content
        )
        VALUES (?, ?, 'user', ?)
        """,
        (
            user_msg_id,
            conversation_id,
            body.message,
        ),
    )

    db.execute(
        """
        INSERT INTO messages
        (
            id,
            conversation_id,
            role,
            content,
            memories_used
        )
        VALUES (?, ?, 'assistant', ?, ?)
        """,
        (
            ai_msg_id,
            conversation_id,
            ai_response,
            json.dumps(
                memories_used
            ),
        ),
    )

    db.commit()

    return {
        "conversation_id": conversation_id,
        "message_id": ai_msg_id,
        "response": ai_response,
        "memories_used": memories_used,
        "reflect_insight": result.get(
            "reflect_insight",
            "",
        ),
        "retained": result.get(
            "retained",
            False,
        ),
    }


# ============================================================
# UTILITY
# ============================================================

def _relative_time(
    timestamp: Optional[str],
) -> str:

    if not timestamp:
        return "unknown"

    try:

        dt = datetime.fromisoformat(
            timestamp.replace(
                " ",
                "T",
            )
        )

        delta = (
            datetime.utcnow()
            - dt
        )

        days = delta.days

        if days == 0:
            return "today"

        if days == 1:
            return "yesterday"

        if days < 7:
            return f"{days} days ago"

        if days < 30:

            weeks = days // 7

            return (
                f"{weeks} week"
                f"{'s' if weeks > 1 else ''} ago"
            )

        months = days // 30

        return (
            f"{months} month"
            f"{'s' if months > 1 else ''} ago"
        )

    except Exception:
        return timestamp


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv(
            "APP_HOST",
            "0.0.0.0",
        ),
        port=int(
            os.getenv(
                "APP_PORT",
                8000,
            )
        ),
        reload=True,
    )