"""
TigerGraph Agentic Fraud Investigation Agent (HHGOA Hackathon)
Built on LangGraph StateGraph, combining TigerGraph GSQL graph traversal,
GraphRAG grounding, uncertainty reasoning, and human-in-the-loop policy gates.
"""

import uuid
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from langgraph.graph import StateGraph, END
from agent.state import FraudInvestigationState
from agent.nodes.trigger_node import trigger_node
from agent.nodes.case_manager_node import case_manager_node
from agent.nodes.evidence_gatherer import evidence_gatherer_node
from agent.nodes.pattern_detector import pattern_detector_node
from agent.nodes.uncertainty_assessor import uncertainty_assessor_node
from agent.nodes.action_recommender import action_recommender_node
from agent.nodes.human_approval_gate import human_approval_gate_node
from agent.nodes.memory_updater import memory_updater_node
from agent.graph_rag import graph_rag

logger = logging.getLogger("FraudAgent")

def controlled_evidence_gathering_node(state: FraudInvestigationState) -> Dict[str, Any]:
    """
    Simulates / triggers policy-approved controlled evidence gathering:
    - Asks account owner to validate transaction (Push / SMS challenge)
    - Checks device biometric verification token
    - Inspects external threat intelligence
    """
    case_title = state.get("case_title", "")
    requested = state.get("additional_evidence_requested", [])
    records = list(state.get("investigation_record", []))

    # Determine simulated customer / system response
    if "VIP" in case_title or "False Alarm" in case_title or "Legitimate" in case_title or "Payroll" in case_title or "Recurring" in case_title:
        ev_received = {
            "source": "Customer_Mobile_App_Validation",
            "status": "VALIDATED",
            "is_cleared": True,
            "summary": "Customer explicitly validated transaction intent via biometric FaceID prompt in mobile banking app.",
            "timestamp": datetime.utcnow().isoformat()
        }
    else:
        ev_received = {
            "source": "Step_Up_MFA_Challenge",
            "status": "FAILED_NO_RESPONSE",
            "is_cleared": False,
            "summary": "Customer SMS OTP challenge expired without confirmation. Originating IP geolocation confirmed blacklisted residential proxy.",
            "timestamp": datetime.utcnow().isoformat()
        }

    records.append({
        "step": "CONTROLLED_EVIDENCE_GATHERING",
        "timestamp": datetime.utcnow().isoformat(),
        "details": f"Dispatched controlled inquiries ({', '.join(requested)}). Received response: {ev_received['summary']}"
    })

    return {
        "additional_evidence_received": ev_received,
        "investigation_record": records
    }

def route_after_uncertainty(state: FraudInvestigationState) -> str:
    """Conditional edge router based on confidence and evidence gaps."""
    if state.get("status") == "UNCERTAIN_AWAITING_EVIDENCE":
        return "controlled_evidence_gathering"
    return "action_recommender"

def build_fraud_investigation_graph():
    """Builds and compiles the LangGraph StateGraph."""
    workflow = StateGraph(FraudInvestigationState)

    # 1. Add Nodes
    workflow.add_node("trigger", trigger_node)
    workflow.add_node("case_manager", case_manager_node)
    workflow.add_node("evidence_gatherer", evidence_gatherer_node)
    workflow.add_node("pattern_detector", pattern_detector_node)
    workflow.add_node("uncertainty_assessor", uncertainty_assessor_node)
    workflow.add_node("controlled_evidence_gathering", controlled_evidence_gathering_node)
    workflow.add_node("action_recommender", action_recommender_node)
    workflow.add_node("human_approval_gate", human_approval_gate_node)
    workflow.add_node("memory_updater", memory_updater_node)

    # 2. Add Edges
    workflow.set_entry_point("trigger")
    workflow.add_edge("trigger", "case_manager")
    workflow.add_edge("case_manager", "evidence_gatherer")
    workflow.add_edge("evidence_gatherer", "pattern_detector")
    workflow.add_edge("pattern_detector", "uncertainty_assessor")

    # Conditional Routing
    workflow.add_conditional_edges(
        "uncertainty_assessor",
        route_after_uncertainty,
        {
            "controlled_evidence_gathering": "controlled_evidence_gathering",
            "action_recommender": "action_recommender"
        }
    )

    workflow.add_edge("controlled_evidence_gathering", "action_recommender")
    workflow.add_edge("action_recommender", "human_approval_gate")
    workflow.add_edge("human_approval_gate", "memory_updater")
    workflow.add_edge("memory_updater", END)

    return workflow.compile()

# Compile the singleton app
fraud_agent_app = build_fraud_investigation_graph()

def run_investigation(case_input: Dict[str, Any]) -> FraudInvestigationState:
    """
    Main entry point to execute an investigation on a transaction or case.
    """
    initial_state: FraudInvestigationState = {
        "case_id": case_input.get("case_id", f"CASE_{uuid.uuid4().hex[:6].upper()}"),
        "case_title": case_input.get("case_title", "Automated Fraud Triage"),
        "transaction_id": case_input.get("transaction_id", "TX_UNKNOWN"),
        "trigger_type": case_input.get("trigger_type", "risk_score"),
        "initial_risk_score": case_input.get("initial_risk_score", 0.5),
        "opened_at": datetime.utcnow().isoformat(),
        "status": "TRIGGERED",
        "transaction_details": case_input.get("transaction_details", {}),
        "subgraph": {},
        "evidence_trail": [],
        "graph_ring_size": 0,
        "connected_accounts": [],
        "velocity_metrics": {},
        "device_signals": {},
        "similar_cases": [],
        "policy_citations": [],
        "graph_rag_context": "",
        "fraud_probability": 0.5,
        "confidence_score": 0.5,
        "confidence_level": "LOW",
        "evidence_gaps": [],
        "pattern_matches": [],
        "likely_fraud_type": "Pending Investigation",
        "pre_evidence_action": None,
        "additional_evidence_requested": [],
        "additional_evidence_received": None,
        "post_evidence_action": None,
        "final_action": None,
        "requires_human_approval": False,
        "approval_role_required": "NONE",
        "approval_status": "PENDING",
        "sar_required": False,
        "sar_report": None,
        "investigation_record": [],
        "final_explanation": "",
        "cycle_count": 0
    }

    # Execute LangGraph workflow
    final_output = fraud_agent_app.invoke(initial_state)
    return final_output

if __name__ == "__main__":
    import sys
    from data.dataset_loader import initialize_graph_database
    initialize_graph_database()

    sample_case = {
        "case_id": "CASE_TEST_01",
        "case_title": "Synthetic Identity Ring Across 4 Connected Accounts",
        "transaction_id": "TX_3031048",
        "trigger_type": "risk_score",
        "initial_risk_score": 0.94,
        "transaction_details": {
            "amount": 8900.00,
            "currency": "USD",
            "account_id": "ACC_99014",
            "card_id": "CARD_773102",
            "device_id": "DEV_FINGERPRINT_RING_02",
            "ip_address": "203.0.113.88"
        }
    }
    result = run_investigation(sample_case)
    print("\n--- INVESTIGATION COMPLETED ---")
    print(f"Case ID: {result['case_id']}")
    print(f"Likely Fraud Type: {result['likely_fraud_type']}")
    print(f"Pre-Evidence Action: {result['pre_evidence_action']}")
    print(f"Post-Evidence Action: {result['post_evidence_action']}")
    print(f"SAR Required: {result['sar_required']}")
    print(f"Final Narrative: {result['final_explanation']}")
