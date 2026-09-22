"""
Memory Updater Node (HHGOA Hackathon)
Writes resolved case findings, decisions, and embeddings back to TigerGraph CaseMemory
and updates the knowledge graph topology to improve future investigations.
"""

from datetime import datetime
from typing import Dict, Any
from agent.state import FraudInvestigationState
from tigergraph.tigergraph_client import tg_client
from agent.graph_rag import graph_rag

def memory_updater_node(state: FraudInvestigationState) -> Dict[str, Any]:
    case_id = state.get("case_id")
    tx_id = state.get("transaction_id")
    likely_fraud = state.get("likely_fraud_type", "General Suspicious Activity")
    final_act = state.get("final_action", {})
    records = list(state.get("investigation_record", []))

    # Generate final audit narrative
    final_narrative = graph_rag.generate_investigation_narrative(state)

    # 1. Update FraudCase vertex in TigerGraph
    tg_client.upsert_vertex("FraudCase", case_id, {
        "status": "RESOLVED",
        "outcome": "CONFIRMED_FRAUD" if state.get("fraud_probability", 0.0) >= 0.65 else "CLEARED_LEGITIMATE",
        "findings": final_narrative,
        "preEvidenceAction": (state.get("pre_evidence_action") or {}).get("action_type", "NONE"),
        "postEvidenceAction": (state.get("post_evidence_action") or {}).get("action_type", "NONE"),
        "approvalRoute": (final_act or {}).get("authority_required", "NONE"),
        "closedAt": datetime.utcnow().isoformat()
    })

    # 2. Ingest into TigerGraph CaseMemory
    mem_id = f"MEM_{case_id}"
    outcome = "CONFIRMED_FRAUD" if state.get("fraud_probability", 0.0) >= 0.65 else "CLEARED_LEGITIMATE"
    
    # Simple semantic signature embedding
    emb = [
        state.get("fraud_probability", 0.5),
        state.get("confidence_score", 0.5),
        min(1.0, state.get("graph_ring_size", 0) / 5.0),
        1.0 if state.get("sar_required") else 0.0,
        0.8, 0.4, 0.2, 0.9
    ]

    tg_client.upsert_vertex("CaseMemory", mem_id, {
        "caseId": case_id,
        "summary": final_narrative,
        "caseOutcome": outcome,
        "patternMatched": likely_fraud,
        "resolutionTimeHours": 1.2,
        "embedding": emb
    })

    # Link Case to Memory
    tg_client.upsert_edge("FraudCase", case_id, "SIMILAR_TO", "CaseMemory", mem_id, {"score": 1.0})

    records.append({
        "step": "MEMORY_UPDATE",
        "timestamp": datetime.utcnow().isoformat(),
        "details": f"Investigation findings, actions, and vector embedding stored in TigerGraph CaseMemory ({mem_id}). Case marked RESOLVED."
    })

    return {
        "status": "RESOLVED",
        "final_explanation": final_narrative,
        "investigation_record": records
    }
