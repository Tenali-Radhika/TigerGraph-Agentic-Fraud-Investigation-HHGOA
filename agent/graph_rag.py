"""
GraphRAG Grounding Engine (HHGOA Hackathon)
Extracts topological subgraphs from TigerGraph, correlates with vector CaseMemory,
and produces grounded, synthesized prompts and explanations for the reasoning agent.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from tigergraph.tigergraph_client import tg_client
from agent.policy_engine import policy_engine

logger = logging.getLogger("GraphRAG")

class GraphRAGEngine:
    def __init__(self):
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")

    def build_grounded_context(self, tx_id: str, tx_details: Dict[str, Any], 
                               ring_info: Dict[str, Any], velocity_info: Dict[str, Any],
                               pattern_matches: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Builds a comprehensive GraphRAG context payload combining:
        1. Multi-hop Graph Subgraph summary
        2. Topologically connected entity risk signals
        3. Historical Case Memory matches (Vector ANN)
        4. Applicable Fraud Policies & SAR rules
        """
        # 1. Fetch similar resolved cases from TigerGraph CaseMemory
        top_pattern = pattern_matches[0]["pattern_name"] if pattern_matches else None
        similar_cases = tg_client.retrieve_similar_cases(target_pattern=top_pattern, top_k=3)

        # 2. Extract policy citations
        amount = tx_details.get("amount", 0.0)
        prob = tx_details.get("riskScore", 0.5)
        applicable_policies = policy_engine.find_applicable_policies(amount, prob, top_pattern or "")

        # 3. Format synthesized textual summary for LLM grounding
        graph_text_lines = [
            f"=== TIGERGRAPH KNOWLEDGE GRAPH GROUNDING ===",
            f"Target Transaction ID: {tx_id}",
            f"Transaction Amount: ${amount:,.2f} USD | Product Code: {tx_details.get('product_code', 'N/A')} | Channel: {tx_details.get('channel', 'Online')}",
            f"Originating Account: {tx_details.get('account_id', 'Unknown')}",
            f"Card ID: {tx_details.get('card_id', 'Unknown')}",
            f"Device ID: {tx_details.get('device_id', 'Unknown')} (Suspicious: {ring_info.get('shared_devices', [])})",
            f"IP Address: {tx_details.get('ip_address', 'Unknown')} (High Risk / Proxy: {ring_info.get('shared_ips', [])})",
            "",
            f"=== GRAPH TOPOLOGY & FRAUD RING ANALYSIS ===",
            f"Connected Fraud Ring Size: {ring_info.get('ring_size', 0)} accounts",
            f"Co-located Accounts sharing Device/IP: {', '.join(ring_info.get('connected_accounts', [])) or 'None'}",
            f"Velocity Metrics (24h Window): {velocity_info.get('tx_count', 1)} txs, total volume ${velocity_info.get('total_volume', 0.0):,.2f}",
            "",
            f"=== HISTORICAL CASE MEMORY (PRIOR INVESTIGATIONS) ==="
        ]

        for sc in similar_cases:
            graph_text_lines.append(
                f"- Case {sc['case_id']}: Outcome={sc['outcome']} (Match Score: {sc['similarity_score']}). Findings: {sc['summary']}"
            )

        graph_text_lines.append("")
        graph_text_lines.append("=== GOVERNING BANK POLICIES & REGULATIONS ===")
        for pol in applicable_policies:
            graph_text_lines.append(f"- [{pol.get('policy_id')}] {pol.get('title')}: {pol.get('rule')} (Action: {pol.get('action')}, Required Auth: {pol.get('approval_required')})")

        synthesized_context = "\n".join(graph_text_lines)

        return {
            "synthesized_context": synthesized_context,
            "similar_cases": similar_cases,
            "applicable_policies": applicable_policies
        }

    def generate_investigation_narrative(self, state_data: Dict[str, Any]) -> str:
        """
        Generates an audit-ready, explainable investigation narrative
        synthesizing the evidence trail and decisions taken.
        """
        tx_id = state_data.get("transaction_id")
        amount = state_data.get("transaction_details", {}).get("amount", 0.0)
        likely_fraud = state_data.get("likely_fraud_type", "Suspicious Activity")
        conf = state_data.get("confidence_score", 0.0)
        ring_size = state_data.get("graph_ring_size", 0)
        pre_act = state_data.get("pre_evidence_action") or {}
        post_act = state_data.get("post_evidence_action") or {}

        narrative = (
            f"Investigation opened for Transaction {tx_id} (${amount:,.2f} USD) triggered by {state_data.get('trigger_type')}. "
            f"TigerGraph multi-hop analysis identified {ring_size} connected accounts sharing device and network infrastructure. "
            f"Topological and signature matching flagged primary typology as '{likely_fraud}' with confidence of {conf:.0%}. "
            f"Prior to additional evidence, next-best action was {pre_act.get('action_type', 'EVALUATE')} (Approval: {pre_act.get('authority_required', 'NONE')}). "
        )

        if state_data.get("additional_evidence_received"):
            ev_summary = state_data["additional_evidence_received"].get("summary", "Customer validation received.")
            narrative += f"Additional evidence gathered: '{ev_summary}'. "
            narrative += f"Post-evidence updated next-best action transitioned to {post_act.get('action_type', 'CONFIRM')} with route {post_act.get('authority_required', 'NONE')}. "

        if state_data.get("sar_required"):
            narrative += "Due to aggregate exposure exceeding statutory thresholds, a FinCEN Suspicious Activity Report (Form 111) was automatically drafted for compliance review."

        return narrative

graph_rag = GraphRAGEngine()
