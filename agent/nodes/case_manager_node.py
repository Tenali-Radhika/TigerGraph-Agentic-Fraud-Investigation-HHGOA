"""
Case Manager Node (HHGOA Hackathon)
Creates or updates the FraudCase vertex in TigerGraph and manages case progression.
"""

from datetime import datetime
from typing import Dict, Any
from agent.state import FraudInvestigationState
from tigergraph.tigergraph_client import tg_client

def case_manager_node(state: FraudInvestigationState) -> Dict[str, Any]:
    case_id = state.get("case_id")
    tx_id = state.get("transaction_id")
    status = state.get("status", "INVESTIGATING")
    opened_at = state.get("opened_at", datetime.utcnow().isoformat())

    # Upsert FraudCase vertex in TigerGraph
    tg_client.upsert_vertex("FraudCase", case_id, {
        "status": status,
        "riskLevel": "HIGH" if state.get("initial_risk_score", 0.0) >= 0.75 else "MEDIUM",
        "confidence": state.get("confidence_score", 0.5),
        "openedAt": opened_at,
        "findings": f"Case opened for transaction {tx_id}",
        "assignedAnalyst": "AutonomousAgent"
    })

    # Link FraudCase to Transaction
    tg_client.upsert_edge("Transaction", tx_id, "INVESTIGATED_IN", "FraudCase", case_id)

    record_entry = {
        "step": "CASE_PROGRESSION",
        "timestamp": datetime.utcnow().isoformat(),
        "details": f"FraudCase {case_id} recorded in TigerGraph with status {status}"
    }

    records = state.get("investigation_record", [])
    records.append(record_entry)

    return {
        "investigation_record": records
    }
