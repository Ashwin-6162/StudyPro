def classify_diagram(image_path: str, context_text: str = "") -> str:
    """
    Basic heuristic diagram classifier.
    In future phases, this will be replaced with a Vision LLM.
    """
    context_text = context_text.lower()
    
    if any(word in context_text for word in ["flowchart", "flow diagram", "workflow"]):
        return "FLOWCHART"
    elif any(word in context_text for word in ["architecture", "system", "components"]):
        return "ARCHITECTURE"
    elif any(word in context_text for word in ["pipeline", "process"]):
        return "PIPELINE"
    elif any(word in context_text for word in ["network", "topology"]):
        return "NETWORK"
    
    return "UNKNOWN"
