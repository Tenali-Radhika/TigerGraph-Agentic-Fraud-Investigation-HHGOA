"""
Fraud Investigation Agent State Schema
Defines the strict typed state passed between LangGraph nodes during fraud investigation.
"""

from typing import TypedDict, List, Dict, Any, Optional, Literal

class EvidenceItem(TypedDict):
    evidence_id: str
    source: str  # "TigerGraph_MultiHop", "Velocity_Engine", "Device_Fingerprint", "Case_Memory", "Customer_Verification"
    timestamp: str
    title: str
    description: str
    risk_contribution: float  # -1.0 (strongly benign) to +1.0 (strongly fraudulent)
    data: Dict[str, Any]

class PatternMatchResult(TypedDict):
    pattern_id: str
    pattern_name: str
    typology: str
    confidence: float
    matched_indicators: List[str]
    severity: str

class NextBestAction(TypedDict):
    action_type: str  # "ALLOW_TRANSACTION", "BLOCK_CARD", "BLOCK_ACCOUNT", "REQUEST_STEP_UP_AUTH", "SEND_CUSTOMER_WARNING", "FILE_SAR_FINCEN", "ESCALATE_ANALYST"
    target_entity: str
    rationale: str
    authority_required: str  # "NONE" (Autonomous), "ANALYST_TIER_1", "SENIOR_ANALYST", "COMPLIANCE_OFFICER"
    is_executed: bool
    requires_approval: bool
    execution_status: str  # "RECOMMENDED", "APPROVED", "EXECUTED", "REJECTED"

class FraudInvestigationState(TypedDict):
    # Case metadata
    case_id: str
    case_title: str
    transaction_id: str
    trigger_type: Literal["risk_score", "customer_report", "analyst_request"]
    initial_risk_score: float
    opened_at: str
    status: Literal["TRIGGERED", "INVESTIGATING", "UNCERTAIN_AWAITING_EVIDENCE", "ACTION_RECOMMENDED", "PENDING_APPROVAL", "RESOLVED"]

    # Transaction & Entity Details
    transaction_details: Dict[str, Any]
    subgraph: Dict[str, Any]

    # Accumulated Evidence
    evidence_trail: List[EvidenceItem]
    graph_ring_size: int
    connected_accounts: List[str]
    velocity_metrics: Dict[str, Any]
    device_signals: Dict[str, Any]

    # GraphRAG & Memory
    similar_cases: List[Dict[str, Any]]
    policy_citations: List[Dict[str, Any]]
    graph_rag_context: str

    # Assessment & Uncertainty
    fraud_probability: float
    confidence_score: float  # 0.0 to 1.0
    confidence_level: Literal["LOW", "MEDIUM", "HIGH"]
    evidence_gaps: List[str]
    pattern_matches: List[PatternMatchResult]
    likely_fraud_type: str

    # Next Best Actions (Pre & Post Evidence)
    pre_evidence_action: Optional[NextBestAction]
    additional_evidence_requested: List[str]
    additional_evidence_received: Optional[Dict[str, Any]]
    post_evidence_action: Optional[NextBestAction]
    final_action: Optional[NextBestAction]

    # Approvals & Human in the loop
    requires_human_approval: bool
    approval_role_required: str
    approval_status: Literal["PENDING", "APPROVED", "REJECTED", "BYPASSED"]

    # SAR & Regulatory Report
    sar_required: bool
    sar_report: Optional[Dict[str, Any]]

    # Audit & Explainability
    investigation_record: List[Dict[str, Any]]
    final_explanation: str
    cycle_count: int  # Prevent infinite evidence-gathering loops
