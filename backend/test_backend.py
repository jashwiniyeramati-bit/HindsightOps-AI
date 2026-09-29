"""
test_backend.py — Backend tests for Hindsight AI Agent.

Run with:  pytest backend/test_backend.py -v

Tests cover:
  - Health endpoint
  - Incident listing and detail
  - Feedback submission → DB
  - Memories endpoint
  - Learning timeline
  - Memory module (retain/recall/reflect stubs)
"""

import json
import os
import sys
import tempfile
import pytest

# Ensure the backend package is importable
sys.path.insert(0, os.path.dirname(__file__))

# ── Patch env before importing app ────────────────────────────────────────────
os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("HINDSIGHT_BASE_URL", "http://localhost:8888")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")


# ── Patch the Gemini & Hindsight clients before app import ───────────────────

class _FakeGeminiContent:
    text = "This is a mock AI response."


class _FakeGeminiModel:
    def generate_content(self, *args, **kwargs):
        return _FakeGeminiContent()


class _FakeMemory:
    available = False

    def retain(self, user_id, content):
        return {"status": "skipped"}

    def recall(self, user_id, query, top_k=5):
        return []

    def reflect(self, user_id, query):
        return ""

    def list_memories(self, user_id):
        return []


# Patch google.generativeai
import types
genai_mock = types.ModuleType("google.generativeai")
genai_mock.configure = lambda api_key: None
genai_mock.GenerativeModel = lambda model_name, system_instruction=None: _FakeGeminiModel()
sys.modules["google.generativeai"] = genai_mock
sys.modules["google"] = types.ModuleType("google")

# Patch hindsight_client
hs_mock = types.ModuleType("hindsight_client")
sys.modules["hindsight_client"] = hs_mock

from database import init_db, get_db  # noqa: E402


@pytest.fixture(scope="module")
def tmp_db(tmp_path_factory):
    """Create a temp SQLite database for all tests."""
    db_file = str(tmp_path_factory.mktemp("data") / "test.db")
    init_db(db_file)
    return db_file


@pytest.fixture(scope="module")
def client(tmp_db):
    """TestClient with the app configured for the temp database."""
    # Override database path
    import database as db_module
    db_module._DB_PATH = tmp_db
    db_module._local = __import__("threading").local()

    # Patch memory & agent on the app
    import main as app_module
    fake_mem = _FakeMemory()
    app_module._memory = fake_mem
    app_module.DB_FILE = tmp_db

    class _FakeAgent:
        def chat(self, user_id, user_message, incident_context=None, conversation_history=None):
            return {
                "response": "This is a mock AI response referencing historical incident resolution.",
                "memories_used": [{"text": "Historical incident match INC-087"}],
                "reflect_insight": "Configuration rollback is the proven recovery pattern.",
                "retained": True,
            }

        def analyse_incident(self, user_id, incident):
            return {
                "incident_id": incident.get("id"),
                "memories_recalled": [{"text": "INC-087: Database timeout resolved by rollback"}],
                "reflect_insight": "Infrastructure rollbacks resolve database timeouts.",
                "analysis": {
                    "root_cause": "Network configuration error",
                    "recommendations": [
                        {"action": "Roll back recent configuration", "reason": "Matches historical resolution", "confidence": 92}
                    ],
                    "overall_confidence": 92,
                    "pattern_summary": "High similarity with INC-087",
                    "reasoning": "Previous incident resolved with rollback."
                }
            }

    app_module._agent = _FakeAgent()

    # Re-init so tables exist
    init_db(tmp_db)

    from fastapi.testclient import TestClient
    with TestClient(app_module.app) as test_client:
        yield test_client


# ─────────────────────────────────────────────────────────────────────────────
# Health
# ─────────────────────────────────────────────────────────────────────────────

def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "hindsight_available" in data
    assert "gemini_configured" in data


# ─────────────────────────────────────────────────────────────────────────────
# Incidents
# ─────────────────────────────────────────────────────────────────────────────

def test_list_incidents(client):
    resp = client.get("/incidents")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_get_incident_ok(client):
    resp = client.get("/incidents/INC-104")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "INC-104"
    assert data["service"] == "Payment API"


def test_get_incident_not_found(client):
    resp = client.get("/incidents/INC-XXXX")
    assert resp.status_code == 404


def test_incident_has_required_fields(client):
    resp = client.get("/incidents/INC-103")
    assert resp.status_code == 200
    data = resp.json()
    for field in ["id", "service", "title", "error", "severity", "status"]:
        assert field in data, f"Missing field: {field}"


# ─────────────────────────────────────────────────────────────────────────────
# AI Analysis
# ─────────────────────────────────────────────────────────────────────────────

def test_ai_analysis(client):
    resp = client.get("/incidents/INC-104/analysis")
    assert resp.status_code == 200
    data = resp.json()
    assert "incident_id" in data
    assert "recommendation" in data
    assert "confidence" in data
    assert "memories" in data


def test_ai_analysis_not_found(client):
    resp = client.get("/incidents/INC-9999/analysis")
    assert resp.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# Memories
# ─────────────────────────────────────────────────────────────────────────────

def test_get_memories(client):
    resp = client.get("/memories")
    assert resp.status_code == 200
    data = resp.json()
    assert "memories" in data
    assert "total" in data
    assert isinstance(data["memories"], list)


def test_get_memories_search(client):
    resp = client.get("/memories?search=Payment")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data["memories"], list)


# ─────────────────────────────────────────────────────────────────────────────
# Learning timeline
# ─────────────────────────────────────────────────────────────────────────────

def test_learning_timeline(client):
    resp = client.get("/learning")
    assert resp.status_code == 200
    data = resp.json()
    assert "events" in data
    assert "stats" in data
    assert "total_memories" in data["stats"]


# ─────────────────────────────────────────────────────────────────────────────
# Feedback
# ─────────────────────────────────────────────────────────────────────────────

def test_submit_feedback(client):
    payload = {
        "incident_id": "INC-104",
        "decision": "accepted",
        "outcome": "resolved",
        "comment": "Rolled back network config — worked perfectly.",
        "recommendation": "Roll back the recent network configuration",
        "service": "Payment API",
    }
    resp = client.post("/feedback", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data
    assert data["incident_id"] == "INC-104"
    assert "message" in data


def test_submit_feedback_partial(client):
    payload = {
        "incident_id": "INC-103",
        "decision": "modified",
        "outcome": "partial",
        "service": "Auth Service",
    }
    resp = client.post("/feedback", json=payload)
    assert resp.status_code == 201


def test_feedback_stored_in_db(client, tmp_db):
    """Verify feedback appears in the learning timeline after submission."""
    payload = {
        "incident_id": "INC-102",
        "decision": "rejected",
        "outcome": "failed",
        "comment": "Did not work",
        "service": "Cache Service",
        "recommendation": "Scale cache",
    }
    client.post("/feedback", json=payload)

    resp = client.get("/learning")
    assert resp.status_code == 200
    events = resp.json()["events"]
    assert len(events) >= 1


# ─────────────────────────────────────────────────────────────────────────────
# Chat
# ─────────────────────────────────────────────────────────────────────────────

def test_chat(client):
    payload = {
        "message": "What is causing the Payment API failure?",
        "incident_id": "INC-104",
    }
    resp = client.post("/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "response" in data
    assert "conversation_id" in data
    assert len(data["response"]) > 0


def test_chat_continues_conversation(client):
    """Second message in same conversation should work."""
    payload1 = {
        "message": "Tell me about auth failures",
        "incident_id": "INC-103",
    }
    resp1 = client.post("/chat", json=payload1)
    assert resp1.status_code == 200
    conv_id = resp1.json()["conversation_id"]

    payload2 = {
        "message": "What are the historical patterns?",
        "incident_id": "INC-103",
        "conversation_id": conv_id,
    }
    resp2 = client.post("/chat", json=payload2)
    assert resp2.status_code == 200
    assert resp2.json()["conversation_id"] == conv_id


# ─────────────────────────────────────────────────────────────────────────────
# Memory module unit tests
# ─────────────────────────────────────────────────────────────────────────────

def test_memory_unavailable_retain():
    """When hindsight is not available, retain returns 'skipped'."""
    mem = _FakeMemory()
    result = mem.retain("user-1", "test content")
    assert result["status"] == "skipped"


def test_memory_unavailable_recall():
    mem = _FakeMemory()
    result = mem.recall("user-1", "test query")
    assert result == []


def test_memory_unavailable_reflect():
    mem = _FakeMemory()
    result = mem.reflect("user-1", "test query")
    assert result == ""


# ─────────────────────────────────────────────────────────────────────────────
# Demo flow: memory persists across new conversation
# ─────────────────────────────────────────────────────────────────────────────

def test_memory_demo_flow(client):
    """
    Demo flow:
    1. Engineer submits feedback for INC-104 (memory should be retained)
    2. Start a NEW conversation about INC-104
    3. The AI response should reference historical context
    """
    # Step 1: Submit feedback
    fb_payload = {
        "incident_id": "INC-104",
        "decision": "accepted",
        "outcome": "resolved",
        "comment": "Network config rollback took exactly 14 minutes",
        "recommendation": "Roll back the recent network configuration",
        "service": "Payment API",
    }
    fb_resp = client.post("/feedback", json=fb_payload)
    assert fb_resp.status_code == 201
    assert "id" in fb_resp.json()

    # Step 2: New conversation — no conversation_id
    chat_payload = {
        "message": "What should I do about this MongoDB connection failure?",
        "incident_id": "INC-104",
    }
    chat_resp = client.post("/chat", json=chat_payload)
    assert chat_resp.status_code == 200
    chat_data = chat_resp.json()

    # Step 3: Verify we got a response (memory system produces output)
    assert len(chat_data["response"]) > 10
    assert chat_data["conversation_id"] is not None

    # Step 4: Learning timeline includes the feedback
    learning_resp = client.get("/learning")
    assert learning_resp.status_code == 200
    events = learning_resp.json()["events"]
    incident_ids_in_timeline = [e.get("incident_id") for e in events]
    assert "INC-104" in incident_ids_in_timeline
