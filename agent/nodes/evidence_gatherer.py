"""
Evidence Gatherer Node (HHGOA Hackathon)
Conducts multi-hop graph traversals in TigerGraph, queries fraud ring connections,
measures transaction velocity, and inspects identity & device signals.
"""

from datetime import datetime
from typing import Dict, Any, List
from agent.state import FraudInvestigationState, EvidenceItem
from tigergraph.tigergraph_client import tg_client

def evidence_gatherer_node(state: FraudInvestigationState) -> Dict[str, Any]:
    tx_id = state.get("transaction_id")
    tx_details = state.get("transaction_details", {})
    account_id = tx_details.get("account_id", "UNKNOWN")
    evidence_trail: List[EvidenceItem] = list(state.get("evidence_trail", []))
    records = list(state.get("investigation_record", []))

    # 1. TigerGraph Multi-Hop Ring Traversal
    ring_info = tg_client.fraud_ring_detection(tx_id, max_hops=3)
    ring_size = ring_info.get("ring_size", 0)
    connected_accounts = ring_info.get("connected_accounts", [])

    if ring_size > 1:
        evidence_trail.append({
            "evidence_id": f"EV_GRAPH_{len(evidence_trail)+1:02d}",
            "source": "TigerGraph_MultiHop",
            "timestamp": datetime.utcnow().isoformat(),
            "title": f"Coordinated Fraud Ring Detected ({ring_size} Accounts)",
            "description": f"Target transaction is linked via shared hardware/network to accounts: {', '.join(connected_accounts)}.",
            "risk_contribution": 0.85,
            "data": ring_info
        })
    else:
        evidence_trail.append({
            "evidence_id": f"EV_GRAPH_{len(evidence_trail)+1:02d}",
            "source": "TigerGraph_MultiHop",
            "timestamp": datetime.utcnow().isoformat(),
            "title": "Single Account Entity Association",
            "description": "No immediate multi-party fraud ring observed across 2-hop device/IP neighborhood.",
            "risk_contribution": -0.10,
            "data": ring_info
        })

    # 2. TigerGraph Velocity Check
    velocity_metrics = tg_client.velocity_check(account_id, window_seconds=86400)
    if velocity_metrics.get("tx_count", 0) > 5 or velocity_metrics.get("total_volume", 0) > 8000:
        evidence_trail.append({
            "evidence_id": f"EV_VELOCITY_{len(evidence_trail)+1:02d}",
            "source": "Velocity_Engine",
            "timestamp": datetime.utcnow().isoformat(),
            "title": "High Transaction Velocity Spike",
            "description": f"Account executed {velocity_metrics.get('tx_count')} transactions totaling ${velocity_metrics.get('total_volume', 0):,.2f} in rolling 24-hour window.",
            "risk_contribution": 0.65,
            "data": velocity_metrics
        })

    # 3. Device & Identity Signals
    dev_id = tx_details.get("device_id", "")
    ip_addr = tx_details.get("ip_address", "")
    is_suspicious_device = "EMU" in dev_id or "BOT" in dev_id or "PROXY" in dev_id or "TOR" in dev_id

    device_signals = {
        "device_id": dev_id,
        "ip_address": ip_addr,
        "is_suspicious_fingerprint": is_suspicious_device,
        "device_type": "EMULATOR/HEADLESS" if is_suspicious_device else "STANDARD_BROWSER"
    }

    if is_suspicious_device:
        evidence_trail.append({
            "evidence_id": f"EV_DEVICE_{len(evidence_trail)+1:02d}",
            "source": "Device_Fingerprint",
            "timestamp": datetime.utcnow().isoformat(),
            "title": "Suspicious Device / Network Signature",
            "description": f"Originating fingerprint exhibits emulator, proxy, or bot characteristics ({dev_id} / {ip_addr}).",
            "risk_contribution": 0.80,
            "data": device_signals
        })

    # 4. Extract full 2-hop Subgraph for UI visualization and RAG
    subgraph = tg_client.get_case_subgraph(tx_id, max_hops=2)

    records.append({
        "step": "EVIDENCE_GATHERING",
        "timestamp": datetime.utcnow().isoformat(),
        "details": f"Gathered {len(evidence_trail)} evidence items from TigerGraph (Ring Size: {ring_size}, Subgraph Nodes: {len(subgraph.get('nodes', []))})"
    })

    return {
        "evidence_trail": evidence_trail,
        "graph_ring_size": ring_size,
        "connected_accounts": connected_accounts,
        "velocity_metrics": velocity_metrics,
        "device_signals": device_signals,
        "subgraph": subgraph,
        "investigation_record": records
    }
