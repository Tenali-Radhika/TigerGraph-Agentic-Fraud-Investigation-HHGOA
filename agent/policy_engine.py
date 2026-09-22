"""
Policy & Compliance Engine (HHGOA Hackathon)
Enforces banking policies, FinCEN regulations, SAR thresholds,
and human authority requirements.
"""

import os
import json
import logging
from typing import Dict, Any, List, Tuple

logger = logging.getLogger("PolicyEngine")

class PolicyEngine:
    def __init__(self, policies_path: str = None):
        if not policies_path:
            policies_path = os.path.join(os.path.dirname(__file__), "..", "data", "fraud_policies.json")
        self.policies_path = policies_path
        self.policies_data = self._load_policies()

    def _load_policies(self) -> Dict[str, Any]:
        if os.path.exists(self.policies_path):
            try:
                with open(self.policies_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load fraud policies: {e}")
        return {"known_fraud_patterns": [], "policies": [], "authority_matrix": {}}

    def check_sar_requirement(self, amount: float, fraud_prob: float, typology: str) -> Tuple[bool, str, str]:
        """
        FinCEN Form 111 / 31 CFR 1020.320 rule:
        Transactions involving suspected fraud aggregating >= $5,000 require a SAR.
        """
        sar_policy = next((p for p in self.policies_data.get("policies", []) if p.get("policy_id") == "POL-SAR-001"), None)
        threshold = sar_policy.get("threshold_amount", 5000.0) if sar_policy else 5000.0

        if amount >= threshold and fraud_prob >= 0.65:
            return True, "Mandatory FinCEN SAR filing triggered (transaction amount >= $5,000 with high fraud probability).", "COMPLIANCE_OFFICER"
        elif fraud_prob >= 0.90 and amount >= 2000.0:
            return True, "Enhanced compliance SAR triggered for high-confidence organized fraud pattern.", "COMPLIANCE_OFFICER"
        return False, "SAR threshold not met.", "NONE"

    def get_action_authority(self, action_type: str, amount: float = 0.0) -> Tuple[str, bool]:
        """
        Returns (required_authority_role, requires_approval_bool) based on action and monetary exposure.
        """
        if action_type in ["ALLOW_TRANSACTION", "SOFT_HOLD_2HR", "REQUEST_STEP_UP_AUTH", 
                           "SEND_CUSTOMER_WARNING", "ADD_MONITORING_FLAG", "REQUEST_ADDITIONAL_EVIDENCE"]:
            return "NONE", False

        if action_type in ["BLOCK_CARD", "CONFIRM_FRAUD", "CLEAR_FALSE_POSITIVE"]:
            return "ANALYST_TIER_1", True

        if action_type in ["BLOCK_ACCOUNT", "RECALL_FUNDS", "OVERRIDE_AGENT_DECISION"]:
            if amount >= 10000.0:
                return "SENIOR_ANALYST", True
            return "ANALYST_TIER_1", True

        if action_type in ["FILE_SAR_FINCEN", "SUBMIT_SAR_FINCEN", "ESCALATE_LAW_ENFORCEMENT"]:
            return "COMPLIANCE_OFFICER", True

        return "SENIOR_ANALYST", True

    def find_applicable_policies(self, amount: float, fraud_prob: float, pattern_name: str) -> List[Dict[str, Any]]:
        applicable = []
        for pol in self.policies_data.get("policies", []):
            if pol.get("policy_id") == "POL-SAR-001" and amount >= 5000.0:
                applicable.append(pol)
            elif pol.get("policy_id") == "POL-ACT-002" and amount >= 10000.0:
                applicable.append(pol)
            elif pol.get("policy_id") == "POL-UNC-004" and fraud_prob > 0.40:
                applicable.append(pol)
            elif pol.get("policy_id") == "POL-AUT-003":
                applicable.append(pol)
        return applicable

policy_engine = PolicyEngine()
