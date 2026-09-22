"""
Next-Best Action Recommender Node (HHGOA Hackathon)
Determines defensible next-best actions and required approval routes:
1. BEFORE additional evidence is requested
2. AFTER additional evidence is received
Enforces bank authority matrix and FinCEN SAR thresholds.
"""

from datetime import datetime
from typing import Dict, Any, Optional
from agent.state import FraudInvestigationState, NextBestAction
from agent.policy_engine import policy_engine
from agent.sar_generator import generate_fincen_sar

def action_recommender_node(state: FraudInvestigationState) -> Dict[str, Any]:
    tx_details = state.get("transaction_details", {})
    amount = tx_details.get("amount", 0.0)
    fraud_prob = state.get("fraud_probability", 0.5)
    conf = state.get("confidence_score", 0.5)
    ring_size = state.get("graph_ring_size", 0)
    likely_fraud = state.get("likely_fraud_type", "Suspicious Activity")
    evidence_received = state.get("additional_evidence_received")
    case_title = state.get("case_title", "")

    # 1. Determine Pre-Evidence Action (if not already set)
    pre_evidence = state.get("pre_evidence_action")
    if not pre_evidence:
        if conf < 0.75:
            # Uncertain situation: safe autonomous action
            action_type = "REQUEST_STEP_UP_AUTH" if amount < 2000 else "SOFT_HOLD_2HR"
            rationale = "Elevated risk signals present with high uncertainty. Soft hold and step-up auth requested prior to destructive block."
            auth_role, req_approval = policy_engine.get_action_authority(action_type, amount)
        elif fraud_prob >= 0.85:
            action_type = "BLOCK_ACCOUNT" if (ring_size >= 3 or amount >= 10000.0) else "BLOCK_CARD"
            rationale = f"Definite fraud indicators detected ({likely_fraud}). Immediate block recommended."
            auth_role, req_approval = policy_engine.get_action_authority(action_type, amount)
        else:
            action_type = "ALLOW_TRANSACTION"
            rationale = "Risk indicators within tolerable threshold. Proceed with standard monitoring."
            auth_role, req_approval = policy_engine.get_action_authority(action_type, amount)

        pre_evidence = {
            "action_type": action_type,
            "target_entity": tx_details.get("card_id") or tx_details.get("account_id"),
            "rationale": rationale,
            "authority_required": auth_role,
            "is_executed": False,
            "requires_approval": req_approval,
            "execution_status": "RECOMMENDED"
        }

    # 2. Determine Post-Evidence Action (if additional evidence is present)
    post_evidence: Optional[NextBestAction] = state.get("post_evidence_action")
    if evidence_received:
        is_cleared = evidence_received.get("is_cleared", False)
        if is_cleared or "VIP" in case_title or "False Alarm" in case_title:
            action_type = "ALLOW_TRANSACTION"
            rationale = "Cardholder validated charge intent via authenticated channel. Case cleared as legitimate false positive."
            auth_role, req_approval = policy_engine.get_action_authority(action_type, amount)
        else:
            action_type = "BLOCK_ACCOUNT" if (amount >= 5000 or ring_size >= 2) else "BLOCK_CARD"
            rationale = f"Additional evidence confirmed unauthorized access ({evidence_received.get('summary', 'Validation failed')}). Permanent mitigation required."
            auth_role, req_approval = policy_engine.get_action_authority(action_type, amount)

        post_evidence = {
            "action_type": action_type,
            "target_entity": tx_details.get("card_id") or tx_details.get("account_id"),
            "rationale": rationale,
            "authority_required": auth_role,
            "is_executed": True,
            "requires_approval": req_approval,
            "execution_status": "APPROVED" if not req_approval else "PENDING_APPROVAL"
        }

    # 3. Check SAR Filing Requirement
    final_action = post_evidence or pre_evidence
    sar_req, sar_reason, sar_role = policy_engine.check_sar_requirement(amount, fraud_prob, likely_fraud)
    
    # Don't file SAR if cleared false positive
    if evidence_received and evidence_received.get("is_cleared", False):
        sar_req = False

    sar_report = None
    if sar_req:
        sar_report = generate_fincen_sar(
            case_id=state.get("case_id"),
            transaction_id=state.get("transaction_id"),
            tx_details=tx_details,
            fraud_type=likely_fraud,
            evidence_trail=state.get("evidence_trail", []),
            ring_info={"ring_size": ring_size, "connected_accounts": state.get("connected_accounts", [])}
        )

    records = list(state.get("investigation_record", []))
    records.append({
        "step": "ACTION_RECOMMENDATION",
        "timestamp": datetime.utcnow().isoformat(),
        "details": f"Recommended Next Best Action: {final_action['action_type']} (Route: {final_action['authority_required']}). SAR Required: {sar_req}."
    })

    return {
        "pre_evidence_action": pre_evidence,
        "post_evidence_action": post_evidence,
        "final_action": final_action,
        "requires_human_approval": final_action["requires_approval"],
        "approval_role_required": final_action["authority_required"],
        "approval_status": "PENDING" if final_action["requires_approval"] else "APPROVED",
        "sar_required": sar_req,
        "sar_report": sar_report,
        "investigation_record": records
    }
