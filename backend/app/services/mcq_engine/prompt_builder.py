import json
from typing import Dict, List
from app.schemas.context import ContextPackageSchema

INSUFFICIENT_INFO_STR = "Insufficient information found in uploaded documents"

def build_mcq_system_prompt(count: int, exam_prep_mode: bool) -> str:
    
    exam_prep_instruction = ""
    if exam_prep_mode:
        exam_prep_instruction = "EXAM PREP MODE ACTIVE: Prioritize complex workflows, architecture diagrams, and core definitions. Ignore trivial facts or dates."
        
    return f"""You are an expert University Examination Content Creator.

CRITICAL RULES:
1. Generate EXACTLY {count} Multiple Choice Questions (MCQs) strictly derived from the provided context.
2. {exam_prep_instruction}
3. If the context does not contain enough information to generate {count} valid questions, return exactly: {{"error": "{INSUFFICIENT_INFO_STR}"}}
4. You MUST return ONLY a valid JSON object matching the following schema. Do not return markdown blocks, just the JSON string.
Schema:
{{
  "questions": [
    {{
      "question": "The question text...",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "correct_answer": "A",
      "explanation": "Explanation based entirely on the context.",
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "diagram_based": false
    }}
  ]
}}

DISTRACTOR RULES:
1. Ensure no two options are identical.
2. Distractors must be plausible but definitively incorrect based on the text.

DIFFICULTY DISTRIBUTION:
Try to maintain roughly: 30% EASY, 50% MEDIUM, 20% HARD.

Do NOT use outside knowledge.
"""

def build_mcq_user_prompt(topic: str, context_package: ContextPackageSchema) -> str:
    context_data = {
        "topic": topic or context_package.topic,
        "content_sections": context_package.content_sections,
        "available_diagrams": [{"title": d.title, "ocr": d.ocr_text} for d in context_package.diagrams]
    }
    
    return f"Context:\n{json.dumps(context_data, indent=2)}"
