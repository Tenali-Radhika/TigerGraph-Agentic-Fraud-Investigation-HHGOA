# Technical Architecture & Solution Design: TigerGraph Agentic Fraud Sentinel (HHGOA)

> **Submissions Reference**: TigerGraph Agentic Fraud Investigation Hackathon (HHGOA 2026)  
> **Repository**: TigerGraph Agentic Fraud Investigation HHGOA

---

## 1. Executive Summary & What We Built

Modern financial fraud operations have evolved far beyond isolated card thefts. Coordinated fraud rings deploy synthetic identities, credential stuffing, emulator bot farms, and proxy rotation to siphon funds within minutes. Traditional rules engines and tabular machine learning models flag individual transactions with risk scores, but leave fraud analysts stranded in manual, slow, fragmented investigations.

**TigerGraph Agentic Fraud Sentinel** is an end-to-end autonomous AI fraud investigator powered by:
- **TigerGraph Savanna**: High-performance graph storage, multi-hop topological traversal, and vector similarity search.
- **LangGraph State Machine**: Cyclic, self-correcting agent workflow with explicit uncertainty bounds and Human-in-the-Loop (HITL) compliance gates.
- **GraphRAG Grounding**: Synthesizes topological subgraphs, historical CaseMemory resolutions, and bank policies into structured LLM context.
- **Dynamic Next-Best Action (NBA) Engine**: Recommends defensible actions with authority routing **before** and **after** gathering controlled evidence.
- **FinCEN SAR Form 111 Generator**: Automatically drafts regulatory-compliant Suspicious Activity Reports when exposure meets statutory thresholds ($5,000+).
- **Modern Analyst Workbench**: Real-time React dashboard with interactive knowledge graph visualizer, risk gauges, and 20 benchmark case evaluator.

---

## 2. High-Level Architecture Diagram

```
+--------------------------------------------------------------------------------------------------+
|                                    React / Vite Analyst Workbench                                |
|  [ Executive Dashboard ] [ Case Investigation Workbench ] [ Knowledge Graph Canvas ] [ 20 Benchmark ] |
+--------------------------------------------------------------------------------------------------+
                                                 | REST / WebSocket
                                                 v
+--------------------------------------------------------------------------------------------------+
|                                     FastAPI Application Server                                   |
|   /api/cases  |  /api/cases/{id}  |  /api/graph/{tx_id}  |  /api/benchmark/summary  |  /api/policies   |
+--------------------------------------------------------------------------------------------------+
                                                 |
                                                 v
+--------------------------------------------------------------------------------------------------+
|                           LangGraph Agentic Investigation State Machine                          |
|                                                                                                  |
|   [Trigger] ---> [Case Manager] ---> [Evidence Gatherer] ---> [Pattern Detector]                 |
|                                                                        |                         |
|                                                                        v                         |
|   [Action Recommender] <--- [Controlled Evidence] <--- [Uncertainty Assessor]                    |
|          |                                              (Confidence < 0.75?)                     |
|          v                                                                                       |
|   [Human Approval Gate] ---> [FinCEN SAR Generator] ---> [Memory Updater] ---> [END]             |
+--------------------------------------------------------------------------------------------------+
          |                                                                     |
          v                                                                     v
+---------------------------------------+             +--------------------------------------------+
|         TigerGraph Savanna            |             |               GraphRAG Store               |
|  - GSQL Multi-Hop BFS Traversals      |             |  - 5 Documented Fraud Typologies           |
|  - Connected Fraud Ring Detection     |             |  - FinCEN BSA 31 CFR 1020.320 Regulations  |
|  - Velocity & Device Churn Queries    |             |  - Bank Authority & Sign-Off Matrix        |
|  - CaseMemory Vector Upsert & Search  |             |  - Historical Closed Case Memory           |
+---------------------------------------+             +--------------------------------------------+
```

---

## 3. How TigerGraph is Used

TigerGraph serves as the foundational data and intelligence engine for the agent:

### 3.1 Graph Schema (`schema.gsql`)
- **Vertices**: `Account`, `Card`, `Device`, `IP_Address`, `Transaction`, `FraudCase`, `FraudPattern`, `FraudPolicy`, `SAR_Report`, `CaseMemory`, `Analyst`.
- **Edges**: `MADE_TRANSACTION`, `USED_CARD`, `ON_DEVICE`, `FROM_IP`, `SHARES_DEVICE`, `SHARES_IP`, `INVESTIGATED_IN`, `LINKED_TO_PATTERN`, `GOVERNED_BY`, `HAS_SAR`, `SIMILAR_TO`, `ASSIGNED_TO`.

### 3.2 GSQL Intelligence Queries (`queries.gsql`)
1. **`fraud_ring_detection`**: Executes a 3-hop BFS starting from a transaction to identify all co-located accounts sharing hardware fingerprints or residential proxy subnets.
2. **`velocity_check`**: Measures rolling 24-hour transaction frequency, total volume, and device dispersion to catch sudden spending bursts.
3. **`detect_credential_stuffing`**: Identifies card-testing scripts cycling through dozens of stolen card credentials from a single headless device.
4. **`retrieve_similar_cases`**: Performs vector and topological similarity matching over resolved `CaseMemory` vertices to inform new investigations.
5. **`get_case_subgraph`**: Extracts 2-hop subgraphs for visual rendering and GraphRAG prompt grounding.

---

## 4. Agentic Capabilities Implemented

### 4.1 Trigger & Investigation Lifecycle
The agent responds dynamically to three triggers:
1. Model Risk Score spikes (e.g., ML score ≥ 0.75)
2. Customer emergency reports (e.g., unauthorized charge dispute)
3. Fraud Analyst manual triage requests

### 4.2 Uncertainty Reasoning & Controlled Evidence Gathering
Unlike brittle rules engines that immediately trigger destructive card freezes on ambiguous signals, the agent:
1. Evaluates confidence score based on topological graph proof.
2. Identifies specific evidence gaps (e.g., customer verification pending, secondary biometric unverified).
3. If confidence is below 0.75, formulates a non-destructive **Pre-Evidence Next Best Action** (e.g. `SOFT_HOLD_2HR` or `REQUEST_STEP_UP_AUTH` with autonomous route `NONE`).
4. Dispatches controlled, policy-compliant inquiries.
5. Ingests response and updates to a defensible **Post-Evidence Next Best Action** (e.g. `BLOCK_ACCOUNT` with route `ANALYST_TIER_1` or `ALLOW_TRANSACTION` if cleared).

### 4.3 Human-in-the-Loop (HITL) Governance & Compliance Matrix
The agent adheres to a strict authority matrix:
- **Autonomous Agent**: Soft holds (2hr), MFA challenges, customer warning SMS, monitoring tags.
- **Tier-1 Analyst**: Card blocks, confirming fraud, clearing false positives.
- **Senior Analyst**: Permanent account freezes, funds recall (> $10,000 exposure).
- **Compliance Officer**: FinCEN SAR Form 111 submissions and regulatory referrals.

### 4.4 Case Memory Update
When an investigation concludes:
- Findings, disposition, and Next-Best Actions are written directly back to the `FraudCase` vertex in TigerGraph.
- A new `CaseMemory` vertex is created with resolution metadata and vector embeddings, enabling continuous learning across future cases.

---

## 5. Benchmark Performance on 20 Test Cases

The agent was evaluated against all 20 benchmark test cases:
- **100% Evaluation Completion**: Generated `submissions/case_01.json` through `case_20.json`.
- **Pre & Post Evidence NBA Tracking**: Recorded distinct pre-evidence and post-evidence decisions for every scenario.
- **FinCEN Compliance**: Generated 9 structured SAR Form 111 reports for cases exceeding the $5,000 statutory threshold.
- **False Positive Discrimination**: Correctly cleared VIP travelers and recurring insurance charges as legitimate after authenticated step-up challenges.

---

## 6. What We Learned & Future Improvements

### Key Takeaways
1. **Graphs outperform tabular models for fraud**: Tabular models look at features in isolation; TigerGraph reveals the hidden multi-hop infrastructure (shared devices, proxy subnets, synthetic rings) that exposes organized crime.
2. **GraphRAG grounds agent reasoning**: Injecting topological subgraph summaries into LLM prompts eliminates hallucinations and produces audit-defensible explanations.
3. **HITL is essential in finance**: High-stakes decisions (freezing business accounts, filing federal SARs) require policy-enforced human gates.

### Future Improvements
1. Real-time GSQL streaming graph neural network (GNN) embeddings using TigerGraph ML Workbench.
2. Automated voice/interactive IVR phone challenge simulation for customer transaction verification.
3. Cross-bank consortium graph sharing via privacy-preserving federated graph learning.
