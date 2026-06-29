import json
from app.schemas.context import ContextPackageSchema

def build_15m_system_prompt(format_mode: str = "paragraph") -> str:
    if format_mode == "bullet":
        structure_rule = """3. Your answer MUST be structured strictly as a comprehensive 15 Mark examination response using ONLY BULLET POINTS for EVERY section:
   - ## Introduction (Bullet points: Definition, Purpose, Overview)
   - ## Detailed Explanation (Clear, concise bullet points: Core Concepts, Components, Processes)
   - ## Advantages (Clear bullet points: Only if available)
   - ## Disadvantages (Clear bullet points: Only if available)
   - ## Applications (Clear bullet points: Academic/Industry uses)
   - ## Examples (Clear bullet points: Specific uses cases)
   - ## Conclusion (Bullet points: Summary of importance)
   - Do NOT include a section if there is zero context for it.
4. TOTAL LENGTH: Keep points concise and highly readable."""
        format_rule = "8. You MUST use bullet points for EVERY SINGLE SECTION. Do NOT write any paragraphs."
    else:
        structure_rule = """3. Your answer MUST be structured strictly as a comprehensive 15 Mark examination response:
   - ## Introduction (up to 80 words: Definition, Purpose, Overview)
   - ## Detailed Explanation (up to 250 words: Core Concepts, Components, Processes)
   - ## Advantages (up to 60 words: Only if available)
   - ## Disadvantages (up to 60 words: Only if available)
   - ## Applications (up to 60 words: Academic/Industry uses)
   - ## Examples (up to 50 words: Specific uses cases)
   - ## Conclusion (up to 40 words: Summary of importance)
   - Do NOT include a section if there is zero context for it.
4. TOTAL LENGTH: Must be strictly under 600 words."""
        format_rule = "8. Format the response entirely in continuous paragraphs. Do NOT use bullet points or numbered lists."
        
    return f"""You are a highly precise university examination answer generator.

CRITICAL RULES:
1. If the context contains sufficient information, prioritize answering using ONLY the provided context.
2. If the context contains insufficient information to fully answer the query, you may supplement your answer with outside knowledge.
2b. If you use outside knowledge, you MUST append this exact disclaimer at the very end of your answer: "\n\n[Note: Parts of this answer were generated using external knowledge because the uploaded document contained insufficient information.]"
{structure_rule}
5. If the context provides a "diagram" object with a diagram_id, you MUST embed it immediately after the Introduction section using exact Markdown syntax: `![Diagram: {{title}}]({{diagram_id}})`.
6. Do NOT append your own citations at the end. The system will attach them automatically.
7. Use formal academic language. Do not output conversational filler.
{format_rule}
"""

def build_15m_user_prompt(query: str, context_package: ContextPackageSchema) -> str:
    # 15M gets the best top diagram
    diagram_info = None
    if context_package.diagrams:
        d = context_package.diagrams[0]
        diagram_info = {"diagram_id": str(d.diagram_id), "title": d.title, "ocr_text": d.ocr_text}
        
    context_data = {
        "topic": context_package.topic,
        "content_sections": context_package.content_sections,
        "primary_diagram": diagram_info
    }
    
    return f"Query/Question: {query}\n\nContext Data:\n{json.dumps(context_data, indent=2)}"
