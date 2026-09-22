"""
Dataset Loader & Graph Ingestor for IEEE-CIS / Vesta Fraud Data (HHGOA)
Handles raw CSV ingestion or generates a high-fidelity benchmark graph
complete with historical closed cases, entities, and vector memory.
"""

import os
import json
import random
import logging
from typing import Dict, Any, List
from tigergraph.tigergraph_client import tg_client

logger = logging.getLogger("DatasetLoader")
logging.basicConfig(level=logging.INFO)

HISTORICAL_CLOSED_CASES = [
    {
        "case_id": "HIST_CASE_101",
        "pattern": "Card-Not-Present Credential Stuffing & Account Takeover",
        "outcome": "CONFIRMED_FRAUD",
        "summary": "Attacker automated card testing across 12 distinct cards using headless Linux Chrome browser on Ukrainian VPN. Resulted in 4 successful authorizations before detection.",
        "actions_taken": ["BLOCK_CARD", "BLOCK_DEVICE", "NOTIFY_CARDHOLDERS"],
        "embedding": [0.85, 0.12, 0.45, 0.78, 0.91, 0.05, 0.33, 0.62]
    },
    {
        "case_id": "HIST_CASE_102",
        "pattern": "Synthetic Identity Fraud Ring",
        "outcome": "CONFIRMED_FRAUD",
        "summary": "Organized fraud ring created 5 synthetic identities sharing residential proxy subnet and VoIP virtual numbers. Aggregated unauthorized loans and luxury purchases totaling $42,000.",
        "actions_taken": ["BLOCK_ACCOUNT", "FILE_SAR_FINCEN", "ESCALATE_LAW_ENFORCEMENT"],
        "embedding": [0.92, 0.88, 0.14, 0.35, 0.77, 0.89, 0.40, 0.95]
    },
    {
        "case_id": "HIST_CASE_103",
        "pattern": "Legitimate High-Value Traveler (VIP False Positive)",
        "outcome": "CLEARED_FALSE_POSITIVE",
        "summary": "Long-standing premier account owner charged $4,500 at European luxury boutique. IP geolocation was in Paris while billing address was in California. Customer validated charge via mobile push OTP.",
        "actions_taken": ["REQUEST_STEP_UP_AUTH", "ALLOW_TRANSACTION", "ADD_TRAVEL_NOTICE"],
        "embedding": [0.22, 0.15, 0.89, 0.44, 0.10, 0.08, 0.75, 0.31]
    },
    {
        "case_id": "HIST_CASE_104",
        "pattern": "Device Spoofing & Emulator Farm",
        "outcome": "CONFIRMED_FRAUD",
        "summary": "Android emulator farm executed 25 gift card purchases of $200 each using stolen debit credentials. Emulators randomized screen resolutions and MAC addresses.",
        "actions_taken": ["BLOCK_CARD", "BLOCK_DEVICE", "RECALL_FUNDS"],
        "embedding": [0.76, 0.42, 0.63, 0.90, 0.82, 0.19, 0.54, 0.80]
    },
    {
        "case_id": "HIST_CASE_105",
        "pattern": "Bust-Out / First-Party Credit Depletion",
        "outcome": "CONFIRMED_FRAUD",
        "summary": "Account holder opened card 8 months prior, maintained $200 average monthly balance, then maxed out $15,000 credit limit in 36 hours across cryptocurrency exchanges and bullion dealers.",
        "actions_taken": ["BLOCK_ACCOUNT", "FILE_SAR_FINCEN", "REFERRED_COLLECTIONS"],
        "embedding": [0.95, 0.70, 0.30, 0.60, 0.85, 0.72, 0.61, 0.92]
    }
]

def load_fraud_policies_into_graph():
    """Loads policies and known patterns into TigerGraph vertices."""
    policies_path = os.path.join(os.path.dirname(__file__), "fraud_policies.json")
    if not os.path.exists(policies_path):
        return

    with open(policies_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Ingest Fraud Patterns
    for pat in data.get("known_fraud_patterns", []):
        tg_client.upsert_vertex("FraudPattern", pat["pattern_id"], {
            "name": pat["name"],
            "description": "; ".join(pat["indicators"]),
            "typology": pat["typology"],
            "severity": pat["severity"],
            "mitigationAction": pat["mitigation_action"]
        })

    # Ingest Fraud Policies
    for pol in data.get("policies", []):
        tg_client.upsert_vertex("FraudPolicy", pol["policy_id"], {
            "title": pol["title"],
            "threshold": pol.get("threshold_amount", 0.0),
            "action": pol["action"],
            "approvalRequired": pol["approval_required"],
            "regulatoryRef": pol["regulatory_reference"],
            "slaHours": pol.get("sla_hours", 24)
        })

    logger.info(f"Loaded {len(data.get('known_fraud_patterns', []))} patterns and {len(data.get('policies', []))} policies into graph.")

def load_case_memories_into_graph():
    """Ingests historical closed fraud cases into CaseMemory vertices."""
    for idx, mem in enumerate(HISTORICAL_CLOSED_CASES):
        mem_id = f"MEM_{idx+1:03d}"
        tg_client.upsert_vertex("CaseMemory", mem_id, {
            "caseId": mem["case_id"],
            "summary": mem["summary"],
            "caseOutcome": mem["outcome"],
            "patternMatched": mem["pattern"],
            "resolutionTimeHours": 4.5,
            "embedding": mem["embedding"]
        })
    logger.info(f"Loaded {len(HISTORICAL_CLOSED_CASES)} historical closed cases into CaseMemory.")

def load_benchmark_cases_into_graph():
    """Ingests the 20 benchmark cases and their underlying entities into TigerGraph."""
    benchmark_path = os.path.join(os.path.dirname(__file__), "benchmark_cases.json")
    if not os.path.exists(benchmark_path):
        return

    with open(benchmark_path, "r", encoding="utf-8") as f:
        cases = json.load(f)

    for case in cases:
        tx = case["transaction_details"]
        tx_id = case["transaction_id"]
        acc_id = tx["account_id"]
        card_id = tx["card_id"]
        dev_id = tx["device_id"]
        ip_hash = tx["ip_address"]

        # 1. Upsert Account
        tg_client.upsert_vertex("Account", acc_id, {
            "cardType": "visa",
            "bankCountry": "US",
            "billingZip": "90210",
            "emailDomain": "gmail.com",
            "riskScore": case["initial_risk_score"],
            "status": "ACTIVE",
            "totalTransactions": random.randint(12, 140),
            "totalVolume": round(random.uniform(1500, 25000), 2)
        })

        # 2. Upsert Card
        tg_client.upsert_vertex("Card", card_id, {
            "card1": random.randint(1000, 9999),
            "card2": 150.0,
            "card3": 150.0,
            "card4": "visa",
            "card5": 226.0,
            "card6": "debit",
            "cardNetwork": "Visa",
            "cardCategory": "Purchasing",
            "isStolen": False
        })

        # 3. Upsert Device
        tg_client.upsert_vertex("Device", dev_id, {
            "deviceType": "mobile" if "IOS" in dev_id or "ANDROID" in dev_id else "desktop",
            "browserType": "Chrome",
            "deviceInfo": dev_id,
            "os": "Android" if "ANDROID" in dev_id else "iOS" if "IOS" in dev_id else "Windows",
            "isMobile": "IOS" in dev_id or "ANDROID" in dev_id,
            "fingerprint": f"fp_{abs(hash(dev_id)) % 1000000}",
            "isSuspicious": "EMU" in dev_id or "BOT" in dev_id
        })

        # 4. Upsert IP_Address
        tg_client.upsert_vertex("IP_Address", ip_hash, {
            "country": "US" if "UK" not in case["case_title"] else "GB",
            "isp": "Residential Broadband",
            "isProxy": "PROXY" in dev_id or "TOR" in dev_id,
            "isVPN": "VPN" in case["case_title"],
            "riskScore": 0.85 if "TOR" in dev_id or "PROXY" in dev_id else 0.15,
            "connectionCount": random.randint(1, 15)
        })

        # 5. Upsert Transaction
        tg_client.upsert_vertex("Transaction", tx_id, {
            "amount": tx["amount"],
            "transactionDT": 15600000 + random.randint(100, 864000),
            "productCode": tx["product_code"],
            "riskScore": case["initial_risk_score"],
            "channel": tx["channel"],
            "isFlagged": case["initial_risk_score"] > 0.70,
            "dist1": random.uniform(1.0, 500.0),
            "dist2": 0.0,
            "C1": random.randint(1, 10),
            "C2": random.randint(1, 5),
            "C3": 0,
            "C4": random.randint(0, 3),
            "C5": random.randint(0, 2),
            "D1": random.randint(1, 365),
            "D2": random.randint(0, 100),
            "D3": random.randint(0, 50),
            "M1": "T", "M2": "T", "M3": "F", "M4": "M0"
        })

        # 6. Upsert Edges
        tg_client.upsert_edge("Account", acc_id, "MADE_TRANSACTION", "Transaction", tx_id)
        tg_client.upsert_edge("Transaction", tx_id, "USED_CARD", "Card", card_id)
        tg_client.upsert_edge("Transaction", tx_id, "ON_DEVICE", "Device", dev_id)
        tg_client.upsert_edge("Transaction", tx_id, "FROM_IP", "IP_Address", ip_hash)

        # For Fraud Ring Cases (CASE_02, CASE_12): add shared infrastructure edges
        if case["case_id"] in ["CASE_02", "CASE_12"]:
            # Connect auxiliary synthetic accounts to the same device/IP
            for aux_idx in range(1, 4):
                aux_acc = f"ACC_SYN_{case['case_id']}_{aux_idx}"
                tg_client.upsert_vertex("Account", aux_acc, {
                    "cardType": "mastercard",
                    "bankCountry": "US",
                    "billingZip": "90210",
                    "emailDomain": "throwawaymail.io",
                    "riskScore": 0.92,
                    "status": "SUSPICIOUS"
                })
                tg_client.upsert_edge("Account", acc_id, "SHARES_DEVICE", "Account", aux_acc, {"viaDevice": dev_id})
                tg_client.upsert_edge("Account", acc_id, "SHARES_IP", "Account", aux_acc, {"viaIP": ip_hash})

    logger.info(f"Loaded all {len(cases)} benchmark cases and topology into TigerGraph.")

def initialize_graph_database():
    """Initializes the entire graph database with policies, memories, and benchmark dataset."""
    logger.info("Starting TigerGraph Knowledge Ingestion...")
    load_fraud_policies_into_graph()
    load_case_memories_into_graph()
    load_benchmark_cases_into_graph()
    logger.info("TigerGraph Knowledge Ingestion Complete!")

if __name__ == "__main__":
    initialize_graph_database()
