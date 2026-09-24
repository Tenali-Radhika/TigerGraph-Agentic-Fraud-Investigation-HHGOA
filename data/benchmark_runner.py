"""
20 Benchmark Cases Evaluator & Submission Generator (HHGOA Hackathon)
Executes the agent on all 20 benchmark test cases and generates submission answer files:
submissions/case_01.json ... submissions/case_20.json
Each file includes:
- Internal investigation record
- Evidence, findings, decisions, and actions taken
- Case written to TigerGraph
- Suspicious Activity Report (SAR) when required
- Pre-evidence Next Best Action & required approval route
- Post-evidence Next Best Action & required approval route
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, List

from data.dataset_loader import initialize_graph_database
from agent.fraud_agent import run_investigation

logger = logging.getLogger("BenchmarkRunner")
logging.basicConfig(level=logging.INFO)

def run_all_benchmark_cases(output_dir: str = "cases") -> List[Dict[str, Any]]:
    # Create both cases/ (official HHGOA portal requirement) and submissions/
    cases_dir = "cases"
    submissions_dir = "submissions"
    os.makedirs(cases_dir, exist_ok=True)
    os.makedirs(submissions_dir, exist_ok=True)
    
    # 1. Initialize TigerGraph database
    initialize_graph_database()

    # 2. Load benchmark cases
    cases_path = os.path.join(os.path.dirname(__file__), "benchmark_cases.json")
    with open(cases_path, "r", encoding="utf-8") as f:
        benchmark_cases = json.load(f)

    logger.info(f"Starting evaluation of all {len(benchmark_cases)} benchmark cases...")
    results_summary = []

    for idx, case in enumerate(benchmark_cases, 1):
        case_num_str = f"{idx:02d}"
        hhg_id = f"HHG-{idx:03d}"
        case_id = f"CASE_{case_num_str}"
        case["case_id"] = hhg_id

        logger.info(f"[{case_num_str}/20] Running investigation for {hhg_id} ({case_id}): '{case['case_title']}'...")
        res = run_investigation(case)

        # Build Hackathon Submission Answer File conforming to HHGOA specifications
        submission_payload = {
            "case_id": hhg_id,
            "case_id_alt": case_id,
            "case_title": case["case_title"],
            "transaction_id": case["transaction_id"],
            "trigger": {
                "type": case["trigger_type"],
                "initial_risk_score": case["initial_risk_score"],
                "reason": case.get("trigger_reason", "")
            },
            "investigation_record": res.get("investigation_record", []),
            "evidence": {
                "evidence_trail": res.get("evidence_trail", []),
                "graph_ring_size": res.get("graph_ring_size", 0),
                "connected_accounts": res.get("connected_accounts", []),
                "velocity_metrics": res.get("velocity_metrics", {}),
                "device_signals": res.get("device_signals", {})
            },
            "findings": {
                "fraud_probability": res.get("fraud_probability", 0.0),
                "confidence_score": res.get("confidence_score", 0.0),
                "confidence_level": res.get("confidence_level", "LOW"),
                "likely_fraud_type": res.get("likely_fraud_type", ""),
                "pattern_matches": res.get("pattern_matches", []),
                "evidence_gaps": res.get("evidence_gaps", [])
            },
            "next_best_action": {
                "before_additional_evidence": {
                    "action": (res.get("pre_evidence_action") or {}).get("action_type"),
                    "rationale": (res.get("pre_evidence_action") or {}).get("rationale"),
                    "required_approval_route": (res.get("pre_evidence_action") or {}).get("authority_required"),
                    "requires_approval": (res.get("pre_evidence_action") or {}).get("requires_approval")
                },
                "additional_evidence_requested": res.get("additional_evidence_requested", []),
                "additional_evidence_received": res.get("additional_evidence_received"),
                "after_additional_evidence": {
                    "action": (res.get("post_evidence_action") or {}).get("action_type") or (res.get("pre_evidence_action") or {}).get("action_type"),
                    "rationale": (res.get("post_evidence_action") or {}).get("rationale") or (res.get("pre_evidence_action") or {}).get("rationale"),
                    "required_approval_route": (res.get("post_evidence_action") or {}).get("authority_required") or (res.get("pre_evidence_action") or {}).get("authority_required"),
                    "requires_approval": (res.get("post_evidence_action") or {}).get("requires_approval") if res.get("post_evidence_action") else (res.get("pre_evidence_action") or {}).get("requires_approval")
                }
            },
            "written_to_tigergraph": {
                "vertex": "FraudCase",
                "vertex_id": hhg_id,
                "status": "RESOLVED",
                "case_memory_id": f"MEM_{hhg_id}"
            },
            "suspicious_activity_report": res.get("sar_report") if res.get("sar_required") else None,
            "explainability_narrative": res.get("final_explanation", "")
        }

        # 1. Official HHGOA format in cases/HHG-001.json ... HHG-020.json
        hhg_filename = f"{hhg_id}.json"
        hhg_filepath = os.path.join(cases_dir, hhg_filename)
        with open(hhg_filepath, "w", encoding="utf-8") as f:
            json.dump(submission_payload, f, indent=2)

        # 2. Also write submissions/case_01.json for backwards compatibility
        sub_filename = f"case_{case_num_str}.json"
        sub_filepath = os.path.join(submissions_dir, sub_filename)
        with open(sub_filepath, "w", encoding="utf-8") as f:
            json.dump(submission_payload, f, indent=2)

        results_summary.append({
            "case_id": hhg_id,
            "case_id_alt": case_id,
            "title": case["case_title"],
            "fraud_type": res.get("likely_fraud_type"),
            "pre_action": (res.get("pre_evidence_action") or {}).get("action_type"),
            "post_action": (res.get("post_evidence_action") or {}).get("action_type") or (res.get("pre_evidence_action") or {}).get("action_type"),
            "sar_filed": res.get("sar_required", False),
            "file": hhg_filename
        })

    # Write summary manifest to both folders
    for out_d in [cases_dir, submissions_dir]:
        summary_path = os.path.join(out_d, "benchmark_summary.json")
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(results_summary, f, indent=2)

    logger.info(f"Successfully evaluated and exported all 20 benchmark cases to 'cases/' ({len(results_summary)} files: HHG-001.json ... HHG-020.json) and 'submissions/'")
    return results_summary

if __name__ == "__main__":
    run_all_benchmark_cases()
