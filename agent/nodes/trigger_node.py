"""
Trigger Node (HHGOA Hackathon)
Ingests initial fraud triggers (risk score spike, customer fraud report, or analyst triage)
and initializes the investigation state.
"""

from datetime import datetime
from typing import Dict, Any
from agent.state import FraudInvestigationState

def trigger_node(state: FraudInvestigationState) -> Dict[str, Any]:
    tx_id = state.get("transaction_id", "UNKNOWN")
    trigger_type = state.get("trigger_type", "risk_score")
    risk_score = state.get("initial_risk_score", 0.5)

    timestamp = datetime.utcnow().isoformat()
    record_entry = {
        "step": "TRIGGER",
        "timestamp": timestamp,
        "details": f"Investigation triggered for {tx_id} via {trigger_type} with initial risk score {risk_score:.2f}"
    }

    current_records = state.get("investigation_record", [])
    current_records.append(record_entry)

    return {
        "status": "INVESTIGATING",
        "opened_at": state.get("opened_at") or timestamp,
        "investigation_record": current_records,
        "cycle_count": state.get("cycle_count", 0) + 1
    }
