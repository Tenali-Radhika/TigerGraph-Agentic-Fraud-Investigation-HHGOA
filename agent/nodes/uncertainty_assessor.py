"""
Uncertainty Assessor Node (HHGOA Hackathon)
Measures uncertainty, calculates confidence levels, flags specific evidence gaps,
and determines if controlled additional evidence gathering is required.
"""

from datetime import datetime
from typing import Dict, Any, List
from agent.state import FraudInvestigationState

def uncertainty_assessor_node(state: FraudInvestigationState) -> Dict[str, Any]:
    fraud_prob = state.get("fraud_probability", 0.5)
    ring_size = state.get("graph_ring_size", 0)
    dev_signals = state.get("device_signals", {})
    trigger_type = state.get("trigger_type", "")
    evidence_trail = state.get("evidence_trail", [])
    cycle_count = state.get("cycle_count", 1)
    additional_ev = state.get("additional_evidence_received")

    evidence_gaps: List[str] = []
    confidence: float = 0.50

    # If we already received additional evidence in a prior cycle, confidence increases
    if additional_ev:
        confidence = 0.92
        confidence_level = "HIGH"
    else:
        # Determine confidence based on graph strength and clarity of signals
        if ring_size >= 3:
            confidence = 0.91
            confidence_level = "HIGH"
        elif trigger_type == "customer_report":
            confidence = 0.88
            confidence_level = "HIGH"
        elif dev_signals.get("is_suspicious_fingerprint") and fraud_prob >= 0.85:
            confidence = 0.84
            confidence_level = "HIGH"
        elif fraud_prob >= 0.45 and fraud_prob < 0.75:
            # Uncertain boundary zone!
            confidence = 0.62
            confidence_level = "LOW"
            evidence_gaps.append("Cardholder direct validation of charge intent is absent")
            evidence_gaps.append("Step-up biometric / SMS OTP challenge unverified")
            evidence_gaps.append("Merchant item fulfillment & shipping address confirmation missing")
        else:
            confidence = 0.74
            confidence_level = "MEDIUM"
            evidence_gaps.append("Independent verification of customer travel status or device authorization pending")

    # Determine whether we need to gather additional evidence
    needs_more_evidence = (confidence < 0.75 and cycle_count < 2 and not additional_ev)

    requested_evidence = []
    if needs_more_evidence:
        requested_evidence = [
            "REQUEST_CUSTOMER_TRANSACTION_VALIDATION",
            "TRIGGER_STEP_UP_BIOMETRIC_AUTH",
            "QUERY_EXTERNAL_BREACH_INTELLIGENCE"
        ]
        status = "UNCERTAIN_AWAITING_EVIDENCE"
    else:
        status = "ACTION_RECOMMENDED"

    records = list(state.get("investigation_record", []))
    records.append({
        "step": "UNCERTAINTY_ASSESSMENT",
        "timestamp": datetime.utcnow().isoformat(),
        "details": f"Assessed confidence at {confidence:.0%} ({confidence_level}). Evidence Gaps: {len(evidence_gaps)}. Needs more evidence: {needs_more_evidence}."
    })

    return {
        "confidence_score": round(confidence, 3),
        "confidence_level": confidence_level,
        "evidence_gaps": evidence_gaps,
        "additional_evidence_requested": requested_evidence,
        "status": status,
        "investigation_record": records
    }
