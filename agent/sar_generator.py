"""
FinCEN SAR Form 111 Generator (HHGOA Hackathon)
Generates structured, regulatory-compliant Suspicious Activity Reports (SAR)
meeting FinCEN 31 CFR 1020.320 guidelines for banking institutions.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, Optional

def generate_fincen_sar(case_id: str, transaction_id: str, tx_details: Dict[str, Any],
                        fraud_type: str, evidence_trail: list, ring_info: Dict[str, Any],
                        compliance_officer: str = "Chief Compliance Officer") -> Dict[str, Any]:
    """
    Constructs a complete FinCEN Form 111 Suspicious Activity Report.
    """
    sar_id = f"SAR-FINCEN-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    amount = tx_details.get("amount", 0.0)
    acc_id = tx_details.get("account_id", "UNKNOWN")
    card_id = tx_details.get("card_id", "UNKNOWN")
    dev_id = tx_details.get("device_id", "UNKNOWN")
    ip_addr = tx_details.get("ip_address", "UNKNOWN")
    timestamp = tx_details.get("timestamp", datetime.utcnow().isoformat())

    # Build comprehensive narrative
    narrative_paragraphs = [
        f"PART I - SUBJECT & ACTIVITY OVERVIEW:\n"
        f"Horizon Federal Bank & Trust is filing this Suspicious Activity Report (SAR) pursuant to 31 U.S.C. 5318(g) "
        f"concerning suspected financial crimes categorized under '{fraud_type}'. "
        f"The primary target transaction {transaction_id} totaled ${amount:,.2f} USD on account {acc_id}, utilizing payment card {card_id}.",

        f"\nPART II - TIGERGRAPH KNOWLEDGE GRAPH INVESTIGATION FINDINGS:\n"
        f"TigerGraph multi-hop topological graph analysis revealed that originating device '{dev_id}' and IP '{ip_addr}' "
        f"are linked to a coordinated ring of {ring_info.get('ring_size', 1)} interrelated accounts: {', '.join(ring_info.get('connected_accounts', [])) or acc_id}. "
        f"Network connection patterns indicate synchronized unauthorized authorization attempts and high-velocity fund dissipation.",

        f"\nPART III - CHRONOLOGICAL EVIDENCE TRAIL:\n"
        + "\n".join([f"- [{e.get('timestamp', 'N/A')}] {e.get('source', 'Graph')}: {e.get('title')} - {e.get('description')}" for e in evidence_trail[:5]]),

        f"\nPART IV - NEXT BEST ACTIONS & DISPOSITION:\n"
        f"Horizon Federal Bank automated fraud agents, under supervisory authorization, executed immediate account freezing, "
        f"revoked associated card authorizations, and preserved transaction audit trails. "
        f"All related entities have been tagged for AML watchlist monitoring. This report is submitted for FinCEN review."
    ]

    full_narrative = "\n".join(narrative_paragraphs)

    return {
        "sar_id": sar_id,
        "filing_institution": {
            "institution_name": "Horizon Federal Bank & Trust",
            "fincen_identifier": "HFBT-US-77402",
            "regulatory_agency": "OCC",
            "city": "Charlotte",
            "state": "NC",
            "country": "US"
        },
        "subject_information": {
            "account_id": acc_id,
            "card_id": card_id,
            "device_id": dev_id,
            "ip_address": ip_addr,
            "associated_accounts": ring_info.get("connected_accounts", [])
        },
        "suspicious_activity": {
            "primary_type": fraud_type,
            "typology_code": "FRAUD_ORGANIZED_RING" if ring_info.get("ring_size", 0) > 1 else "ACCOUNT_TAKEOVER",
            "transaction_count": ring_info.get("linked_transactions_count", 1) + 1,
            "total_suspicious_amount": amount,
            "date_range_start": timestamp,
            "date_range_end": datetime.utcnow().isoformat()
        },
        "narrative": full_narrative,
        "compliance_signoff": {
            "officer_name": compliance_officer,
            "title": "BSA/AML Compliance Officer",
            "approval_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "status": "APPROVED_FOR_FILING"
        }
    }
