from typing import Dict, Any
import json
from app.schemas.context import ContextPackageSchema

def build_system_prompt(answer_type: str, response_length: str) -> str:
    
    length_instructions = ""
    if response_length == "short":
        length_instructions = "Keep your answer between 50-100 words."
    elif response_length == "medium":
        length_instructions = "Keep your answer between 150-300 words."
    elif response_length == "detailed":
        length_instructions = "Keep your answer between 300-500 words."
        
    type_instructions = ""
    if answer_type == "TOPIC_EXPLANATION":
        type_instructions = "Provide a clear, student-friendly explanation of the topic."
    elif answer_type == "SUMMARY":
        type_instructions = "Provide a bulleted summary of the core concepts."
    elif answer_type == "COMPARE":
        type_instructions = "Compare the topics strictly based on the provided context."
    elif answer_type == "EXPLANATION":
        type_instructions = "Provide a detailed, step-by-step explanation of the concept in a way that is easy for students to understand."
    else:
        type_instructions = "Provide a clear, educational explanation."
        
    system_prompt = f"""You are an expert academic assistant for university students.

CRITICAL RULES:
1. If the context contains sufficient information, prioritize answering using ONLY the provided context.
2. If the context contains insufficient information to fully answer the query, you may supplement your answer with outside knowledge.
3. If you use outside knowledge, you MUST append this exact disclaimer at the very end of your answer: "\n\n[Note: Parts of this answer were generated using external knowledge because the uploaded document contained insufficient information.]"
4. If the context mentions a diagram, you should briefly reference it in your answer (e.g., "The provided context illustrates a diagram of..."). Do NOT attempt to draw diagrams.
5. Use academic terminology but maintain a student-friendly, logical flow.
6. Do NOT append citations at the end of your text, the system will attach them automatically.
7. {length_instructions}
8. {type_instructions}
"""
    return system_prompt

def build_user_prompt(query: str, context_package: ContextPackageSchema) -> str:
    # We serialize the relevant parts of the context package into a string for the LLM
    context_data = {
        "content_sections": context_package.content_sections,
        "available_diagrams": [{"topic": d.topic, "title": d.title, "ocr_text": d.ocr_text} for d in context_package.diagrams]
    }
    
    context_str = json.dumps(context_data, indent=2)
    
    return f"""
Query: {query}

Context:
{context_str}
"""
