"""
TigerGraph Client & Embedded Graph Engine (HHGOA Hackathon)
Provides dual-mode operation:
1. Live pyTigerGraph connector to TigerGraph Savanna / Community Edition
2. Embedded In-Memory Graph Engine (NetworkX based) matching GSQL schema & algorithms
"""

import os
import math
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

logger = logging.getLogger("TigerGraphClient")
logging.basicConfig(level=logging.INFO)

class EmbeddedGraphEngine:
    """
    High-fidelity in-memory graph engine simulating TigerGraph GSQL graph schema,
    multi-hop BFS traversals, pattern detection algorithms, and vector similarity search.
    """

    def __init__(self):
        import networkx as nx
        self.g = nx.MultiDiGraph()
        self.vertices: Dict[str, Dict[str, Any]] = {}
        self.edges: List[Dict[str, Any]] = []
        self.case_memory_store: List[Dict[str, Any]] = []
        logger.info("Initialized Embedded TigerGraph Simulation Engine")

    def upsert_vertex(self, vertex_type: str, vertex_id: str, attributes: Dict[str, Any]):
        node_key = f"{vertex_type}:{vertex_id}"
        attrs = {
            "type": vertex_type,
            "id": vertex_id,
            **attributes
        }
        self.vertices[node_key] = attrs
        self.g.add_node(node_key, **attrs)
        
        # Track case memory specifically for vector retrieval
        if vertex_type == "CaseMemory":
            self.case_memory_store.append(attrs)

    def upsert_edge(self, source_type: str, source_id: str, edge_type: str, 
                    target_type: str, target_id: str, attributes: Optional[Dict[str, Any]] = None):
        u = f"{source_type}:{source_id}"
        v = f"{target_type}:{target_id}"
        attrs = attributes or {}
        edge_data = {
            "source": u,
            "target": v,
            "source_type": source_type,
            "source_id": source_id,
            "target_type": target_type,
            "target_id": target_id,
            "edge_type": edge_type,
            **attrs
        }
        self.edges.append(edge_data)
        self.g.add_edge(u, v, key=edge_type, **edge_data)

    def get_vertex(self, vertex_type: str, vertex_id: str) -> Optional[Dict[str, Any]]:
        return self.vertices.get(f"{vertex_type}:{vertex_id}")

    def get_case_subgraph(self, tx_id: str, max_hops: int = 2) -> Dict[str, Any]:
        """
        Executes GSQL get_case_subgraph query logic:
        Extracts 2-hop radius around target Transaction node.
        """
        import networkx as nx
        start_node = f"Transaction:{tx_id}"
        if start_node not in self.g:
            # Fallback search if transaction node key is slightly different
            matches = [n for n in self.g.nodes if n.endswith(f":{tx_id}")]
            if matches:
                start_node = matches[0]
            else:
                return {"nodes": [], "edges": []}

        subgraph_nodes = set([start_node])
        current_frontier = set([start_node])

        for _ in range(max_hops):
            next_frontier = set()
            for node in current_frontier:
                # Undirected neighborhood traversal
                succ = list(self.g.successors(node))
                pred = list(self.g.predecessors(node))
                for neighbor in succ + pred:
                    if neighbor not in subgraph_nodes:
                        subgraph_nodes.add(neighbor)
                        next_frontier.add(neighbor)
            current_frontier = next_frontier

        # Assemble node list and edge list
        nodes_out = []
        for n in subgraph_nodes:
            node_data = self.g.nodes.get(n, {})
            nodes_out.append({
                "id": n,
                "type": node_data.get("type", "Unknown"),
                "label": f"{node_data.get('type')}: {node_data.get('id')}",
                "attributes": {k: v for k, v in node_data.items() if k not in ["type", "id"]}
            })

        edges_out = []
        for u in subgraph_nodes:
            for v in subgraph_nodes:
                if self.g.has_edge(u, v):
                    edge_dict = self.g.get_edge_data(u, v)
                    for k, edge_props in edge_dict.items():
                        edges_out.append({
                            "source": u,
                            "target": v,
                            "type": edge_props.get("edge_type", k),
                            "attributes": {ek: ev for ek, ev in edge_props.items() if ek not in ["source", "target", "edge_type"]}
                        })

        return {"nodes": nodes_out, "edges": edges_out}

    def fraud_ring_detection(self, tx_id: str, max_hops: int = 3) -> Dict[str, Any]:
        """
        Executes GSQL fraud_ring_detection query:
        Traverses Transaction -> Device/IP -> Other Accounts/Cards sharing same infrastructure.
        """
        tx_node = f"Transaction:{tx_id}"
        if tx_node not in self.g:
            return {"ring_size": 0, "connected_accounts": [], "shared_devices": [], "shared_ips": []}

        # Step 1: Find device and IP of this transaction
        connected_devices = []
        connected_ips = []
        for _, v, data in self.g.out_edges(tx_node, data=True):
            if data.get("edge_type") == "ON_DEVICE":
                connected_devices.append(v)
            elif data.get("edge_type") == "FROM_IP":
                connected_ips.append(v)

        # Step 2: Find all other transactions using these devices or IPs
        linked_transactions = set()
        for dev in connected_devices:
            for u, _, data in self.g.in_edges(dev, data=True):
                if u != tx_node and data.get("edge_type") == "ON_DEVICE":
                    linked_transactions.add(u)

        for ip_node in connected_ips:
            for u, _, data in self.g.in_edges(ip_node, data=True):
                if u != tx_node and data.get("edge_type") == "FROM_IP":
                    linked_transactions.add(u)

        # Step 3: Find accounts owning these linked transactions
        connected_accounts = set()
        for l_tx in linked_transactions:
            for u, _, data in self.g.in_edges(l_tx, data=True):
                if data.get("edge_type") == "MADE_TRANSACTION":
                    connected_accounts.add(u)

        return {
            "ring_size": len(connected_accounts),
            "connected_accounts": [self.g.nodes[acc].get("id", acc) for acc in connected_accounts],
            "linked_transactions_count": len(linked_transactions),
            "shared_devices": [self.g.nodes[d].get("id", d) for d in connected_devices],
            "shared_ips": [self.g.nodes[ip].get("id", ip) for ip in connected_ips]
        }

    def velocity_check(self, account_id: str, window_seconds: int = 86400) -> Dict[str, Any]:
        """
        Executes GSQL velocity_check query:
        Calculates transaction volume, frequency, and device dispersion.
        """
        acc_node = f"Account:{account_id}"
        if acc_node not in self.g:
            return {"tx_count": 0, "total_volume": 0.0, "device_count": 0, "ip_count": 0}

        tx_list = []
        for _, v, data in self.g.out_edges(acc_node, data=True):
            if data.get("edge_type") == "MADE_TRANSACTION":
                tx_data = self.g.nodes.get(v, {})
                tx_list.append(tx_data)

        total_vol = sum(t.get("amount", 0.0) for t in tx_list)
        devices = set()
        ips = set()

        for t in tx_list:
            t_node = f"Transaction:{t.get('id')}"
            for _, dev, d_data in self.g.out_edges(t_node, data=True):
                if d_data.get("edge_type") == "ON_DEVICE":
                    devices.add(dev)
                elif d_data.get("edge_type") == "FROM_IP":
                    ips.add(dev)

        return {
            "tx_count": len(tx_list),
            "total_volume": round(total_vol, 2),
            "device_count": len(devices),
            "ip_count": len(ips),
            "avg_amount": round(total_vol / max(1, len(tx_list)), 2)
        }

    def retrieve_similar_cases(self, query_embedding: Optional[List[float]] = None, 
                               target_pattern: Optional[str] = None, 
                               top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves similar cases from CaseMemory using vector cosine similarity
        or pattern matching.
        """
        results = []
        for mem in self.case_memory_store:
            score = 0.0
            if query_embedding and mem.get("embedding"):
                # Cosine similarity
                dot = sum(a * b for a, b in zip(query_embedding, mem["embedding"]))
                norm_a = math.sqrt(sum(a * a for a in query_embedding))
                norm_b = math.sqrt(sum(b * b for b in mem["embedding"]))
                score = dot / (norm_a * norm_b + 1e-9)
            elif target_pattern and mem.get("patternMatched") == target_pattern:
                score = 0.88
            else:
                score = 0.65

            results.append({
                "case_id": mem.get("caseId"),
                "summary": mem.get("summary"),
                "outcome": mem.get("caseOutcome"),
                "pattern_matched": mem.get("patternMatched"),
                "similarity_score": round(score, 3)
            })

        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results[:top_k]


class TigerGraphClient:
    """
    Unified client providing seamless switching between live TigerGraph Savanna instance
    and high-fidelity Embedded Graph Engine.
    """

    def __init__(self, host: Optional[str] = None, graph: str = "FraudGraph",
                 username: Optional[str] = None, password: Optional[str] = None,
                 secret: Optional[str] = None):
        self.host = host or os.getenv("TG_HOST")
        self.graph = graph or os.getenv("TG_GRAPH", "FraudGraph")
        self.username = username or os.getenv("TG_USERNAME")
        self.password = password or os.getenv("TG_PASSWORD")
        self.secret = secret or os.getenv("TG_SECRET")

        self.live_conn = None
        self.is_live = False
        self.embedded = EmbeddedGraphEngine()

        if self.host and self.username and self.password:
            try:
                import pyTigerGraph as tg
                logger.info(f"Connecting to live TigerGraph instance at {self.host}...")
                self.live_conn = tg.TigerGraphConnection(
                    host=self.host,
                    graphname=self.graph,
                    username=self.username,
                    password=self.password,
                    secret=self.secret
                )
                self.live_conn.getToken()
                self.is_live = True
                logger.info("Successfully connected to live TigerGraph Savanna!")
            except Exception as e:
                logger.warning(f"Could not connect to live TigerGraph ({e}). Falling back to Embedded Graph Engine.")
                self.is_live = False
        else:
            logger.info("No live TigerGraph credentials supplied. Operating in high-fidelity Embedded Graph Engine mode.")

    def upsert_vertex(self, vertex_type: str, vertex_id: str, attributes: Dict[str, Any]):
        self.embedded.upsert_vertex(vertex_type, vertex_id, attributes)
        if self.is_live and self.live_conn:
            try:
                self.live_conn.upsertVertex(vertex_type, vertex_id, attributes)
            except Exception as e:
                logger.error(f"Failed live upsertVertex: {e}")

    def upsert_edge(self, source_type: str, source_id: str, edge_type: str,
                    target_type: str, target_id: str, attributes: Optional[Dict[str, Any]] = None):
        self.embedded.upsert_edge(source_type, source_id, edge_type, target_type, target_id, attributes)
        if self.is_live and self.live_conn:
            try:
                self.live_conn.upsertEdge(source_type, source_id, edge_type, target_type, target_id, attributes or {})
            except Exception as e:
                logger.error(f"Failed live upsertEdge: {e}")

    def get_case_subgraph(self, tx_id: str, max_hops: int = 2) -> Dict[str, Any]:
        if self.is_live and self.live_conn:
            try:
                res = self.live_conn.runInstalledQuery("get_case_subgraph", {"txId": tx_id})
                return res
            except Exception as e:
                logger.warning(f"Live get_case_subgraph failed ({e}), using embedded")
        return self.embedded.get_case_subgraph(tx_id, max_hops)

    def fraud_ring_detection(self, tx_id: str, max_hops: int = 3) -> Dict[str, Any]:
        if self.is_live and self.live_conn:
            try:
                res = self.live_conn.runInstalledQuery("fraud_ring_detection", {"targetTx": tx_id, "maxHops": max_hops})
                return res[0] if isinstance(res, list) and res else res
            except Exception as e:
                logger.warning(f"Live fraud_ring_detection failed ({e}), using embedded")
        return self.embedded.fraud_ring_detection(tx_id, max_hops)

    def velocity_check(self, account_id: str, window_seconds: int = 86400) -> Dict[str, Any]:
        if self.is_live and self.live_conn:
            try:
                res = self.live_conn.runInstalledQuery("velocity_check", {"targetAcc": account_id, "windowSeconds": window_seconds})
                return res[0] if isinstance(res, list) and res else res
            except Exception as e:
                logger.warning(f"Live velocity_check failed ({e}), using embedded")
        return self.embedded.velocity_check(account_id, window_seconds)

    def retrieve_similar_cases(self, query_embedding: Optional[List[float]] = None,
                               target_pattern: Optional[str] = None,
                               top_k: int = 3) -> List[Dict[str, Any]]:
        return self.embedded.retrieve_similar_cases(query_embedding, target_pattern, top_k)

# Global singleton client instance
tg_client = TigerGraphClient()
