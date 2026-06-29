import json
from app.schemas.context import ContextPackageSchema

INSUFFICIENT_INFO_STR = "Insufficient information found in uploaded documents"

def build_qp_system_prompt(marks: int, count: int) -> str:
    
    focus_instruction = ""
    if marks <= 3:
        focus_instruction = "Focus strictly on Definitions, Formulas, Short Facts, and brief concepts."
    elif marks <= 10:
        focus_instruction = "Focus on Workflows, Process flows, Advantages/Disadvantages, and structural comparisons."
    else:
        focus_instruction = "Focus on deep Architectures, complex Algorithms, full system explanations, and comprehensive design questions."

    return f"""You are an expert University Examination Content Creator.

CRITICAL RULES:
1. Generate EXACTLY {count} questions, each worth {marks} marks, strictly derived from the provided context.
2. {focus_instruction}
3. If the context does not contain enough depth to generate {count} unique questions worth {marks} marks, return exactly: {{"error": "{INSUFFICIENT_INFO_STR}"}}
4. You MUST return ONLY a valid JSON object matching the following schema.
Schema:
{{
  "questions": [
    {{
      "question_text": "The actual question...",
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "topic": "The core topic this addresses"
    }}
  ]
}}

Do NOT use outside knowledge. Do not invent formulas or diagrams that don't exist in context.
"""

def build_qp_user_prompt(subject: str, context_package: ContextPackageSchema) -> str:
    context_data = {
        "subject": subject,
        "content_sections": context_package.content_sections,
        "available_diagrams": [{"title": d.title, "ocr": d.ocr_text} for d in context_package.diagrams]
    }
    
    return f"Context Data:\n{json.dumps(context_data, indent=2)}"
