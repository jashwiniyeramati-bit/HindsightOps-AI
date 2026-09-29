def _memory_text(memory):
    if isinstance(memory, dict):
        return str(memory.get("text", ""))
    return str(getattr(memory, "text", memory))


def analyze_possible_causes(current_incident, historical_memories):
    possible_root_causes = []

    for memory in historical_memories:
        text = _memory_text(memory).lower()

        if "pool" in text:
            possible_root_causes.append(
                "Database connection pool saturation"
            )

        if "network" in text:
            possible_root_causes.append(
                "Network configuration issue"
            )

        if "mongo" in text or "mongodb" in text:
            possible_root_causes.append(
                "MongoDB connectivity issue"
            )

    possible_root_causes = list(dict.fromkeys(possible_root_causes))

    if not possible_root_causes:
        possible_root_causes.append(
            "Insufficient historical evidence"
        )

    return possible_root_causes


def build_reasoning(
    current_incident,
    historical_memories,
    possible_root_causes
):
    historical_count = len(historical_memories)

    reasoning = (
        "The current incident was compared with "
        f"{historical_count} historical incident(s). "
        "The historical evidence suggests the following "
        "possible causes: "
        + ", ".join(possible_root_causes)
        + ". These are hypotheses, not confirmed root causes."
    )

    return reasoning