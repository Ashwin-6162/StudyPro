from typing import Dict, Any
import json
from app.schemas.context import ContextPackageSchema

def build_8m_system_prompt(format_mode: str = "paragraph") -> str:
    if format_mode == "bullet":
        structure_rule = """3. Your answer MUST be structured strictly as an 8 Mark examination response using ONLY BULLET POINTS for EVERY section:
   - ## Introduction (Bullet points: Definition, Purpose)
   - ## Main Explanation (Clear, concise bullet points: Architecture, Workflow, Concepts)
   - ## Applications (Clear bullet points: Real-world uses)
   - ## Conclusion (Bullet points: Key takeaways)
4. TOTAL LENGTH: Keep points concise and highly readable."""
        format_rule = "8. You MUST use bullet points for EVERY SINGLE SECTION (Introduction, Main Explanation, Applications, Conclusion). Do NOT write any paragraphs."
    else:
        structure_rule = """3. Your answer MUST be structured strictly as an 8 Mark examination response:
   - ## Introduction (up to 60 words: Definition, Purpose)
   - ## Main Explanation (up to 200 words: Architecture, Workflow, Concepts)
   - ## Applications (up to 50 words: Real-world uses)
   - ## Conclusion (up to 30 words: Key takeaways)
4. TOTAL LENGTH: Must be strictly under 400 words."""
        format_rule = "8. Format the response entirely in continuous paragraphs. Do NOT use bullet points or numbered lists."
        
    return f"""You are a highly precise university examination answer generator.

CRITICAL RULES:
1. If the context contains sufficient information, prioritize answering using ONLY the provided context.
2. If the context contains insufficient information to fully answer the query, you may supplement your answer with outside knowledge.
2b. If you use outside knowledge, you MUST append this exact disclaimer at the very end of your answer: "\n\n[Note: Parts of this answer were generated using external knowledge because the uploaded document contained insufficient information.]"
{structure_rule}
5. If the context provides a "diagram" object with a diagram_id, you MUST embed it immediately after the Introduction section using exact Markdown syntax: `![Diagram: {{title}}]({{diagram_id}})`. 
   - Do NOT try to draw your own diagram. Just use the markdown placeholder if one is provided in the JSON.
6. Do NOT append your own citations at the end. The system will attach them automatically.
7. Use formal academic language. Avoid chat-bot style ("Sure! Here is the answer:"). Begin directly with the Introduction.
{format_rule}
"""

def build_8m_user_prompt(query: str, context_package: ContextPackageSchema) -> str:
    # Serialize context package
    diagram_info = None
    if context_package.diagrams:
        # For 8M, we usually pick the best top diagram
        d = context_package.diagrams[0]
        diagram_info = {"diagram_id": str(d.diagram_id), "title": d.title, "ocr_text": d.ocr_text}
        
    context_data = {
        "topic": context_package.topic,
        "content_sections": context_package.content_sections,
        "primary_diagram": diagram_info
    }
    
    context_str = json.dumps(context_data, indent=2)
    
    return f"""
Query/Question: {query}

Context Data:
{context_str}
"""
