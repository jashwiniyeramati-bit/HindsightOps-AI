def generate_recommendation(
    current_incident,
    possible_root_causes
):

    recommendations = []

    if "Database connection pool saturation" in possible_root_causes:
        recommendations.append(
            "Check database connection pool usage, "
            "active connections, and pool limits."
        )

    if "Network configuration issue" in possible_root_causes:
        recommendations.append(
            "Check network configuration, "
            "connectivity, firewall rules, "
            "timeouts, and routing."
        )

    if not recommendations:
        recommendations.append(
            "Collect additional logs and metrics "
            "before taking corrective action."
        )

    return recommendations