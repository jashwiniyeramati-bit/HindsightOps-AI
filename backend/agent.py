import json
import logging
import os
from typing import Optional

import google.generativeai as genai

from memory import HindsightMemory
from ai_reasoning.evidence import separate_evidence
from ai_reasoning.reasoning import analyze_possible_causes, build_reasoning
from ai_reasoning.recommendation import generate_recommendation

logger = logging.getLogger(__name__)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

_SYSTEM_PROMPT = """You are Hindsight AI Agent — an expert incident response copilot for software engineers.

Your capabilities:
- Analyse active production incidents with precision
- Recall similar historical incidents from Hindsight memory
- Synthesise patterns and recommend resolution steps
- Learn from engineer feedback to improve future recommendations

When answering:
1. Reference recalled historical memories explicitly
2. Provide concrete, actionable recommendations
3. Include confidence level when making recommendations
4. Stay focused on the current incident context
5. Treat historical incidents as evidence, not proof
6. Keep humans in control of production actions

You have access to Hindsight's persistent memory, which stores patterns from resolved incidents.
"""


class HindsightAgent:
    def __init__(self, memory: HindsightMemory, gemini_api_key: str) -> None:
        self._memory = memory
        genai.configure(api_key=gemini_api_key)
        self._model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            system_instruction=_SYSTEM_PROMPT,
        )

    def chat(
        self,
        user_id: str,
        user_message: str,
        incident_context: Optional[dict] = None,
        conversation_history: Optional[list[dict]] = None,
    ) -> dict:
        query = self._build_recall_query(user_message, incident_context)
        memories = self._memory.recall(user_id=user_id, query=query)

        reflect_insight = ""
        if incident_context and memories:
            reflect_insight = self._memory.reflect(
                user_id=user_id,
                query=query,
            )

        prompt = self._build_prompt(
            user_message=user_message,
            incident_context=incident_context,
            memories=memories,
            reflect_insight=reflect_insight,
            conversation_history=conversation_history or [],
        )

        try:
            gemini_response = self._model.generate_content(prompt)
            ai_text = gemini_response.text
        except Exception as exc:
            logger.error("Gemini call failed: %s", exc)
            ai_text = (
                "I encountered an error generating a response. "
                "Please check the logs and retry."
            )

        retain_content = self._build_retain_content(
            user_message=user_message,
            ai_response=ai_text,
            incident_context=incident_context,
        )

        self._memory.retain(
            user_id=user_id,
            content=retain_content,
        )

        return {
            "response": ai_text,
            "memories_used": memories,
            "reflect_insight": reflect_insight,
            "retained": True,
        }

    @staticmethod
    def _build_recall_query(
        message: str,
        incident_context: Optional[dict],
    ) -> str:
        if incident_context:
            service = incident_context.get("service", "")
            error = incident_context.get("error", "")
            return f"{service} {error} {message}".strip()
        return message

    @staticmethod
    def _build_prompt(
        user_message: str,
        incident_context: Optional[dict],
        memories: list[dict],
        reflect_insight: str,
        conversation_history: list[dict],
    ) -> str:
        parts = []

        if incident_context:
            parts.append("=== CURRENT INCIDENT ===")
            parts.append(f"ID: {incident_context.get('id', 'N/A')}")
            parts.append(f"Service: {incident_context.get('service', 'N/A')}")
            parts.append(f"Error: {incident_context.get('error', 'N/A')}")
            parts.append(f"Severity: {incident_context.get('severity', 'N/A')}")

            if incident_context.get("description"):
                parts.append(
                    f"Description: {incident_context['description']}"
                )

            parts.append("")

        if memories:
            parts.append("=== HINDSIGHT RECALLED MEMORIES ===")

            for i, mem in enumerate(memories, 1):
                parts.append(
                    f"[Memory {i}] {mem.get('text', '')}"
                )

            parts.append("")

        if reflect_insight:
            parts.append("=== HINDSIGHT REFLECTION ===")
            parts.append(reflect_insight)
            parts.append("")

        if conversation_history:
            parts.append("=== CONVERSATION HISTORY ===")

            for msg in conversation_history[-6:]:
                role = (
                    "Engineer"
                    if msg["role"] == "user"
                    else "Assistant"
                )
                parts.append(f"{role}: {msg['content']}")

            parts.append("")

        parts.append("=== ENGINEER MESSAGE ===")
        parts.append(user_message)

        return "\n".join(parts)

    @staticmethod
    def _build_retain_content(
        user_message: str,
        ai_response: str,
        incident_context: Optional[dict],
    ) -> str:
        lines = []

        if incident_context:
            lines.append(
                f"Incident {incident_context.get('id', '')} — "
                f"{incident_context.get('service', '')} — "
                f"{incident_context.get('error', '')}"
            )

        lines.append(f"Question: {user_message[:300]}")
        lines.append(f"Answer: {ai_response[:500]}")

        return " | ".join(lines)

    def analyse_incident(
        self,
        user_id: str,
        incident: dict,
    ) -> dict:

        class IncidentAdapter:
            def __init__(self, data: dict):
                self.incident_id = data.get("id")
                self.incident = data.get("title", "")
                self.symptoms = data.get("description", "")
                self.service = data.get("service", "")
                self.error = data.get("error", "")
                self.logs = data.get("logs", "")
                self.investigation = data.get("investigation", "")
                self.hypothesis = data.get("hypothesis", "")
                self.action = data.get("action", "")
                self.resolution = data.get("resolution", "")
                self.outcome = data.get("outcome", "")

        adapted_incident = IncidentAdapter(incident)

        query = (
            f"{adapted_incident.service} "
            f"{adapted_incident.error} "
            f"{adapted_incident.symptoms}"
        ).strip()

        memories = self._memory.recall(
            user_id=user_id,
            query=query,
            top_k=5,
        )

        evidence = separate_evidence(
            adapted_incident,
            memories,
        )

        possible_root_causes = analyze_possible_causes(
            adapted_incident,
            memories,
        )

        reasoning = build_reasoning(
            adapted_incident,
            memories,
            possible_root_causes,
        )

        recommendations = generate_recommendation(
            adapted_incident,
            possible_root_causes,
        )

        reflect_insight = self._memory.reflect(
            user_id=user_id,
            query=query,
        )

        prompt = f"""Analyse this production incident using the supplied evidence.

CURRENT INCIDENT:
- ID: {incident.get('id')}
- Service: {incident.get('service')}
- Error: {incident.get('error')}
- Severity: {incident.get('severity')}
- Description: {incident.get('description', '')}

CURRENT EVIDENCE:
{json.dumps(evidence["current_evidence"], indent=2)}

HISTORICAL EVIDENCE:
{json.dumps(evidence["historical_evidence"], indent=2)}

POSSIBLE ROOT CAUSES:
{json.dumps(possible_root_causes, indent=2)}

RULE-BASED REASONING:
{reasoning}

HINDSIGHT REFLECTION:
{reflect_insight or "No reflection available."}

RULE-BASED RECOMMENDATIONS:
{json.dumps(recommendations, indent=2)}

Important:
- Historical incidents are evidence, not proof.
- Do not claim a root cause is confirmed unless the evidence confirms it.
- Recommendations must be diagnostic and human-reviewed.
- Do not suggest automatic production changes.

Respond with valid JSON only:

{{
  "root_cause": "...",
  "recommendations": [
    {{
      "action": "...",
      "reason": "...",
      "confidence": 0
    }}
  ],
  "overall_confidence": 0,
  "pattern_summary": "...",
  "reasoning": "..."
}}
"""

        try:
            response = self._model.generate_content(prompt)
            raw = response.text.strip()

            if raw.startswith("```"):
                raw = raw.split("```")[1]

                if raw.startswith("json"):
                    raw = raw[4:]

                raw = raw.strip()

            analysis = json.loads(raw)

        except Exception as exc:
            logger.warning(
                "Analysis JSON parse failed: %s",
                exc,
            )

            analysis = {
                "root_cause": (
                    possible_root_causes[0]
                    if possible_root_causes
                    else "Insufficient historical evidence"
                ),
                "recommendations": [
                    {
                        "action": recommendation,
                        "reason": (
                            "Generated from historical evidence "
                            "and rule-based incident reasoning."
                        ),
                        "confidence": 50,
                    }
                    for recommendation in recommendations
                ],
                "overall_confidence": 50,
                "pattern_summary": (
                    f"{len(memories)} historical incident(s) "
                    "were recalled."
                ),
                "reasoning": reasoning,
            }

        return {
            "incident_id": incident.get("id"),
            "memories_recalled": memories,
            "reflect_insight": reflect_insight,
            "current_evidence": evidence["current_evidence"],
            "historical_evidence": evidence["historical_evidence"],
            "possible_root_causes": possible_root_causes,
            "rule_based_recommendations": recommendations,
            "reasoning": reasoning,
            "analysis": analysis,
        }