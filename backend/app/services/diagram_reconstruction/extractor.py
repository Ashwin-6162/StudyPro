import json
import logging


INSUFFICIENT_INFO_STR = "Insufficient information found in uploaded documents"

def extract_diagram_structure(topic: str, context_str: str, provider: str = None) -> dict:
    """
    Uses LLM in structured JSON output mode to extract a diagram schema.
    Returns a dict with 'nodes' and 'edges'.
    """
    system_prompt = f"""You are an expert Diagram Extraction Engine.
    
CRITICAL RULES:
1. You MUST extract a process workflow, architecture, or flowchart from the provided academic context.
2. Output ONLY a valid JSON object matching this schema:
   {{
     "nodes": ["Node 1", "Node 2", ...],
     "edges": [["Node 1", "Node 2"], ...]
   }}
3. Do NOT invent nodes or edges that do not exist in the context. Every edge must represent a directional flow (e.g. A -> B).
4. If there is no clear structural flow, architecture, or relationship data in the context to build a diagram, you MUST return exactly: {{"error": "{INSUFFICIENT_INFO_STR}"}}
"""

    user_prompt = f"Topic: {topic}\n\nContext:\n{context_str}"

    from app.services.chat_engine.llm_client import generate_text
    
    try:
        result = generate_text(system_prompt, user_prompt, provider=provider, json_mode=True)
        return json.loads(result.text), result.provider
    except Exception as e:
        logging.error(f"Failed to extract diagram JSON: {e}")
        return {"error": "LLM Failure"}, provider
