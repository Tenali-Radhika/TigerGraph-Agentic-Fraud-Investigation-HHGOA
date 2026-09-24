"""
TigerGraph Model Context Protocol (MCP) Integration Module (HHGOA Hackathon)
Exposes TigerGraph database queries, graph algorithms, and CaseMemory tools
to AI agents using the standard Model Context Protocol (MCP) schema.
Ref: https://github.com/tigergraph/tigergraph-mcp
"""

import json
import logging
from typing import Dict, Any, List
from tigergraph.tigergraph_client import tg_client

logger = logging.getLogger("TigerGraphMCP")

# Standard MCP Tool Definitions for Agent Orchestration
MCP_TOOLS_MANIFEST = [
    {
        "name": "tigergraph_fraud_ring_detection",
        "description": "Performs a multi-hop BFS graph traversal starting from a transaction or account to discover coordinated fraud rings sharing devices or IPs.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "transaction_id": {"type": "string", "description": "Seed transaction ID (e.g. TX_3031048)"},
                "max_hops": {"type": "integer", "default": 3, "description": "Maximum BFS traversal depth"}
            },
            "required": ["transaction_id"]
        }
    },
    {
        "name": "tigergraph_velocity_check",
        "description": "Calculates 24-hour transaction frequency, total monetary volume, and device dispersion for an account.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "account_id": {"type": "string", "description": "Target account ID"}
            },
            "required": ["account_id"]
        }
    },
    {
        "name": "tigergraph_detect_credential_stuffing",
        "description": "Detects high-frequency automated card cycling or stuffing attacks originating from a single hardware device or bot fingerprint.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "device_id": {"type": "string", "description": "Originating device ID"}
            },
            "required": ["device_id"]
        }
    },
    {
        "name": "tigergraph_get_case_subgraph",
        "description": "Extracts 2-hop topological subgraph around a transaction containing all linked Accounts, Cards, Devices, and IPs for GraphRAG context grounding.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "transaction_id": {"type": "string", "description": "Target transaction identifier"}
            },
            "required": ["transaction_id"]
        }
    },
    {
        "name": "tigergraph_retrieve_similar_cases",
        "description": "Executes vector cosine similarity and topological matching against historical CaseMemory nodes to guide next-best action recommendations.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query_text": {"type": "string", "description": "Case title or fraud indicators summary"},
                "limit": {"type": "integer", "default": 3, "description": "Max cases to retrieve"}
            },
            "required": ["query_text"]
        }
    },
    {
        "name": "tigergraph_write_case_resolution",
        "description": "Records completed fraud investigation findings, next-best actions, and vector embedding to TigerGraph FraudCase and CaseMemory vertices.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "case_id": {"type": "string", "description": "Case identifier (e.g. HHG-001)"},
                "status": {"type": "string", "description": "Final case status (e.g. RESOLVED)"},
                "fraud_type": {"type": "string", "description": "Classified fraud typology"},
                "action_taken": {"type": "string", "description": "Executed mitigation action"}
            },
            "required": ["case_id", "status"]
        }
    }
]

class TigerGraphMCPServer:
    """Implements TigerGraph MCP protocol handlers for agentic tool execution."""

    def __init__(self):
        self.client = tg_client
        self.tools = {tool["name"]: tool for tool in MCP_TOOLS_MANIFEST}

    def list_tools(self) -> List[Dict[str, Any]]:
        """Returns the list of available MCP tools for LLM agent discovery."""
        return MCP_TOOLS_MANIFEST

    def call_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatches an MCP tool call to the underlying TigerGraph client."""
        logger.info(f"MCP Tool Invocation: {name} with args: {arguments}")

        if name == "tigergraph_fraud_ring_detection":
            tx_id = arguments.get("transaction_id", "")
            hops = arguments.get("max_hops", 3)
            return self.client.run_installed_query("fraud_ring_detection", {"seed_tx_id": tx_id, "max_hops": hops})

        elif name == "tigergraph_velocity_check":
            acc_id = arguments.get("account_id", "")
            return self.client.run_installed_query("velocity_check", {"target_account": acc_id})

        elif name == "tigergraph_detect_credential_stuffing":
            dev_id = arguments.get("device_id", "")
            return self.client.run_installed_query("detect_credential_stuffing", {"target_device": dev_id})

        elif name == "tigergraph_get_case_subgraph":
            tx_id = arguments.get("transaction_id", "")
            return self.client.get_case_subgraph(tx_id)

        elif name == "tigergraph_retrieve_similar_cases":
            query_text = arguments.get("query_text", "")
            limit = arguments.get("limit", 3)
            return self.client.retrieve_similar_cases(query_text, limit=limit)

        elif name == "tigergraph_write_case_resolution":
            case_id = arguments.get("case_id")
            status = arguments.get("status", "RESOLVED")
            self.client.upsert_vertex("FraudCase", case_id, {
                "status": status,
                "caseId": case_id,
                "likelyFraudType": arguments.get("fraud_type", ""),
                "actionTaken": arguments.get("action_taken", "")
            })
            return {"status": "SUCCESS", "case_id": case_id, "message": "Case resolution recorded in TigerGraph"}

        else:
            raise ValueError(f"Unknown TigerGraph MCP tool: '{name}'")

# Singleton instance
tigergraph_mcp = TigerGraphMCPServer()
