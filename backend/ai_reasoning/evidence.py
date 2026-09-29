def _memory_text(memory):
    if isinstance(memory, dict):
        return str(memory.get("text", ""))
    return str(getattr(memory, "text", memory))


def separate_evidence(current_incident, historical_memories):
    current_evidence = {
        "incident": current_incident.incident,
        "symptoms": current_incident.symptoms,
        "service": current_incident.service,
        "error": current_incident.error,
        "logs": current_incident.logs
    }

    historical_evidence = []

    for memory in historical_memories:
        historical_evidence.append(_memory_text(memory))

    return {
        "current_evidence": current_evidence,
        "historical_evidence": historical_evidence
    }