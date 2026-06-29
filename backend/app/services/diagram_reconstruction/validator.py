import logging
from typing import Dict, Any

def validate_diagram_schema(schema: Dict[str, Any], context_str: str) -> bool:
    """
    Validates that the generated nodes actually exist in the context string to prevent hallucination.
    """
    if "error" in schema:
        return False
        
    nodes = schema.get("nodes", [])
    edges = schema.get("edges", [])
    
    if not nodes or not edges:
        logging.warning("Extracted diagram is empty.")
        return False
        
    # Basic Hallucination Check: Ensure every node text appears in the context
    # (Allowing case-insensitive matching)
    context_lower = context_str.lower()
    for node in nodes:
        # A simple sub-string check. If the node name is totally alien, reject.
        # This is a heuristic. Sometimes LLMs summarize the node name slightly.
        # For stricter validation, we check if at least part of the node name is in the context.
        words = node.lower().split()
        match_found = any(word in context_lower for word in words if len(word) > 2)
        
        if not match_found and len(words) > 0:
            logging.warning(f"Hallucination detected: Node '{node}' not found in context.")
            return False
            
    # Validate edges refer to existing nodes
    for edge in edges:
        if len(edge) != 2:
            return False
        if edge[0] not in nodes or edge[1] not in nodes:
            logging.warning(f"Edge {edge} references unknown nodes.")
            return False
            
    return True
