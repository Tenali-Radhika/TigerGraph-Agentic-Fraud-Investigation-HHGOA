# TigerGraph Agentic Fraud Sentinel (HHGOA Hackathon)

> **Build an AI Agent for Fraud Investigation and Next-Best Action**  
> Powered by **TigerGraph Savanna**, **LangGraph**, **GraphRAG**, and **FastAPI / React**

[![TigerGraph](https://img.shields.io/badge/TigerGraph-Savanna%20%7C%20CE-FF6B00?logo=tigergraph)](https://savanna.tgcloud.io)
[![LangGraph](https://img.shields.io/badge/Orchestrator-LangGraph-blue)](https://langchain-ai.github.io/langgraph/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react)](https://react.dev)
[![FinCEN SAR](https://img.shields.io/badge/Compliance-FinCEN%20Form%20111-purple)]()

---

## 🏆 Key Features & Capabilities

1. **TigerGraph GSQL Engine**:
   - `schema.gsql`: 11 vertex types (`Account`, `Card`, `Device`, `IP_Address`, `Transaction`, `FraudCase`, `FraudPattern`, `FraudPolicy`, `SAR_Report`, `CaseMemory`, `Analyst`) and 12 edge types.
   - `queries.gsql`: High-performance multi-hop BFS traversals for 3-hop fraud ring detection, rolling velocity checks, and topological pattern matching.
   - Dual-mode operation: Live connection to **TigerGraph Savanna / CE** via `pyTigerGraph` with a high-fidelity **Embedded Graph Engine** fallback.

2. **LangGraph State Machine Agent**:
   - Explicit typed state transitions: `Trigger` → `Case Manager` → `Evidence Gatherer` → `Pattern Detector` → `Uncertainty Assessor` → `Controlled Inquiries` → `Action Recommender` → `HITL Gate` → `Memory Updater`.
   - Cyclic evidence loops: Self-correcting flow that recognizes uncertain signals and gathers policy-approved evidence before irreversible action.

3. **Next-Best Action (NBA) Decision Progression**:
   - Dual NBA tracking required by hackathon:
     - **Before Additional Evidence**: Non-destructive holding actions (e.g. `SOFT_HOLD_2HR`, `REQUEST_STEP_UP_AUTH`) with autonomous route `NONE`.
     - **After Additional Evidence**: Defensible permanent mitigations (e.g. `BLOCK_ACCOUNT`, `BLOCK_CARD`) or false positive clearance (`ALLOW_TRANSACTION`).

4. **FinCEN SAR Form 111 Regulatory Generator**:
   - Automatically generates structured Suspicious Activity Reports (SAR) adhering to 31 U.S.C. 5318(g) and 31 CFR 1020.320 guidelines for transactions exceeding $5,000.

5. **20 Benchmark Evaluation Cases**:
   - All 20 benchmark test cases executed end-to-end.
   - Output files stored in `submissions/case_01.json` ... `submissions/case_20.json`.
   - One-click ZIP download available directly from the UI.

6. **Interactive Analyst Workbench**:
   - Executive Dashboard with real-time KPI metrics.
   - Case Workbench with circular SVG risk gauge, uncertainty bar, and evidence timeline.
   - Knowledge Graph Explorer with interactive SVG canvas, zoom, and node inspector.
   - Policy & GraphRAG Browser with interactive compliance chat assistant.

---

## 📁 Repository Structure

```
TigerGraph Agentic Fraud Investigation HHGOA/
├── tigergraph/
│   ├── schema.gsql             # Vertex and edge DDL for FraudGraph
│   ├── queries.gsql            # Installed GSQL graph traversal & detection queries
│   ├── tigergraph_client.py    # pyTigerGraph client & embedded graph engine
│   └── .env.example            # Savanna connection credentials template
│
├── data/
│   ├── fraud_policies.json     # 5 known fraud typologies, BSA rules, authority matrix
│   ├── benchmark_cases.json    # 20 benchmark evaluation test cases
│   ├── dataset_loader.py       # Ingests IEEE-CIS dataset & seeds graph with memory
│   └── benchmark_runner.py     # Batch runs 20 benchmark cases and exports answer files
│
├── agent/
│   ├── state.py                # TypedDict state schema
│   ├── fraud_agent.py          # Master LangGraph StateGraph pipeline
│   ├── graph_rag.py            # Hybrid GraphRAG context grounding engine
│   ├── policy_engine.py        # Authority rules and FinCEN SAR threshold evaluator
│   ├── sar_generator.py        # FinCEN Form 111 structured report generator
│   └── nodes/                  # Individual LangGraph state machine node handlers
│
├── backend/
│   └── main.py                 # FastAPI REST API & submission exporter
│
├── frontend/                   # Modern React + Vite + Tailwind CSS dashboard
│   ├── src/
│   │   ├── pages/              # Dashboard, Workbench, GraphExplorer, Benchmark, Policies
│   │   ├── components/         # RiskGauge, ActionCards, EvidenceTimeline, GraphCanvas, SARViewer
│   │   └── App.tsx
│   └── package.json
│
├── submissions/                # 20 benchmark answer files (case_01.json ... case_20.json)
└── docs/
    └── architecture.md         # Technical architecture blog post
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js v18+ and npm

### 2. Run the Benchmark Runner (Generates 20 Case Submissions)
```bash
python -m data.benchmark_runner
```
*Evaluates all 20 benchmark cases and writes `submissions/case_01.json` through `case_20.json`.*

### 3. Launch Backend Server
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Launch Analyst Dashboard UI
In a separate terminal:
```bash
cd frontend
npm run dev
```
Open browser at: [http://localhost:5173](http://localhost:5173)

---

## ☁️ Connecting to Live TigerGraph Savanna

To connect to your TigerGraph Cloud (Savanna) instance:
1. Create a graph named `FraudGraph` in [TigerGraph Savanna](https://savanna.tgcloud.io).
2. Run `tigergraph/schema.gsql` in the GSQL console.
3. Run `tigergraph/queries.gsql` to install queries.
4. Set your environment variables in `.env`:
```env
TG_HOST=https://your-savanna-instance.i.tgcloud.io
TG_GRAPH=FraudGraph
TG_USERNAME=tigergraph
TG_PASSWORD=your_password
TG_SECRET=your_graph_secret
```

---

## 📊 Summary of 20 Benchmark Test Cases

| Case | Scenario Title | Primary Typology | Pre-Evidence Action | Post-Evidence Action | SAR Filed |
|---|---|---|---|---|---|
| **CASE_01** | Multi-Card Velocity Spike on Mobile Device | Device Spoofing & Emulator Farm | BLOCK_CARD | BLOCK_CARD | Yes |
| **CASE_02** | Synthetic Identity Ring Across 4 Accounts | Synthetic Identity Fraud Ring | SOFT_HOLD_2HR | BLOCK_ACCOUNT | Yes |
| **CASE_03** | Impossible Velocity - NY to London (45 min) | Rapid Geolocation Shift & Impossible Travel | BLOCK_CARD | BLOCK_CARD | No |
| **CASE_04** | Automated Emulator Farm Checkout Burst | Device Spoofing & Emulator Farm | BLOCK_CARD | BLOCK_CARD | No |
| **CASE_05** | Bust-Out Spree on Dormant Platinum ($14.2k) | Bust-Out / First-Party Credit Depletion | SOFT_HOLD_2HR | BLOCK_ACCOUNT | Yes |
| **CASE_06** | High-Risk Proxy Card Testing Micro-Txs | Card-Not-Present Credential Stuffing & ATO | REQUEST_STEP_UP_AUTH | BLOCK_CARD | No |
| **CASE_07** | Legitimate High-Value Traveler (VIP Test) | Potential False Positive / Legitimate Unusual Activity | SOFT_HOLD_2HR | ALLOW_TRANSACTION | No |
| **CASE_08** | Coordinated ATO with Contact Details Change | Card-Not-Present Credential Stuffing & ATO | SOFT_HOLD_2HR | BLOCK_ACCOUNT | Yes |
| **CASE_09** | Multiple Cards Tested Rapidly Across Subnet | Device Spoofing & Emulator Farm | BLOCK_CARD | BLOCK_CARD | No |
| **CASE_10** | Uncertain First-Time Electronics Purchase | Anomalous Spending - Insufficient Typology Match | REQUEST_STEP_UP_AUTH | BLOCK_CARD | No |
| **CASE_11** | Stolen Card Used on Newly Minted Account | Card-Not-Present Credential Stuffing & ATO | SOFT_HOLD_2HR | BLOCK_CARD | Yes |
| **CASE_12** | Shared IP Subnet Linking 5 Fraudulent Loans | Synthetic Identity Fraud Ring | BLOCK_CARD | BLOCK_CARD | Yes |
| **CASE_13** | Middle-of-the-Night ATM Withdrawal Attempt | Card-Not-Present Credential Stuffing & ATO | SOFT_HOLD_2HR | BLOCK_CARD | No |
| **CASE_14** | Legitimate Payroll Bonus Deposit | Potential False Positive / Legitimate Unusual Activity | REQUEST_STEP_UP_AUTH | ALLOW_TRANSACTION | No |
| **CASE_15** | Cross-Border Remittance to High-Risk Jurisdiction | Rapid Geolocation Shift & Impossible Travel | BLOCK_CARD | BLOCK_CARD | Yes |
| **CASE_16** | Bursty In-App Game Currency Purchases | Card-Not-Present Credential Stuffing & ATO | REQUEST_STEP_UP_AUTH | BLOCK_CARD | No |
| **CASE_17** | Commercial Credit Card Dump Testing on SaaS | Card-Not-Present Credential Stuffing & ATO | REQUEST_STEP_UP_AUTH | BLOCK_CARD | No |
| **CASE_18** | Structuring Pattern Evading $10,000 CTR | Structuring / Smurfing to Evade CTR Reporting | SOFT_HOLD_2HR | BLOCK_ACCOUNT | Yes |
| **CASE_19** | False Alarm - Recurring Annual Insurance | Potential False Positive / Legitimate Unusual Activity | SOFT_HOLD_2HR | ALLOW_TRANSACTION | No |
| **CASE_20** | Sophisticated Multi-Hop Bust-Out with Stolen ID | Bust-Out / First-Party Credit Depletion | SOFT_HOLD_2HR | BLOCK_ACCOUNT | Yes |

---

## 📝 Hackathon Submission Checklist

- [x] **Working Agent**: LangGraph state machine with cyclic evidence gathering and TigerGraph memory.
- [x] **GitHub Repository Ready**: Modular directory structure, clean commits, and complete documentation.
- [x] **20 Benchmark Answer Files**: Generated in `submissions/case_01.json` through `submissions/case_20.json`.
- [x] **Dual NBA Tracking**: Pre-evidence and post-evidence actions with required approval routes.
- [x] **TigerGraph Ingestion**: Graph schema, installed queries, and CaseMemory vector updates.
- [x] **FinCEN SAR Generation**: Form 111 narratives meeting 31 CFR 1020.320 guidelines.
- [x] **Analyst Dashboard UI**: Vite + React frontend with live graph canvas and decision gates.
- [x] **Technical Blog Post**: Complete architecture document in `docs/architecture.md`.
