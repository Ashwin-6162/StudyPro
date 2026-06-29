import logging
import json
from sqlalchemy.orm import Session
from app.schemas.question_paper import QuestionPaperRequestSchema, QuestionPaperResponseSchema, SectionSchema, QuestionSchema
from app.schemas.context import ContextRequestSchema
from app.services.context_builder.builder import build_context_package
from app.services.question_paper_engine.prompt_builder import build_qp_system_prompt, build_qp_user_prompt, INSUFFICIENT_INFO_STR
from app.services.question_paper_engine.validator import validate_question_batch


logging.basicConfig(filename="logs/question_paper_generator.log", level=logging.INFO, 
                    format="%(asctime)s - %(levelname)s - %(message)s")

# Defines standard university mappings
DEFAULT_PATTERNS = {
    "SEMESTER": {2: 10, 8: 5, 15: 2},
    "INTERNAL": {2: 5, 8: 2, 15: 1},
    "UNIT": {2: 5, 8: 3, 15: 1}
}

def generate_paper(request: QuestionPaperRequestSchema, db: Session) -> QuestionPaperResponseSchema:
    
    # 1. Determine Pattern
    pattern = request.custom_pattern
    if not pattern:
        pattern = DEFAULT_PATTERNS.get(request.exam_type.upper(), DEFAULT_PATTERNS["SEMESTER"])
        
    # 2. Fetch Massive Context for full exam coverage
    # top_k=40 to pull a huge chunk of the database covering multiple chapters
    context_req = ContextRequestSchema(query=request.subject, document_id=request.document_id, top_k=40)
    context_package = build_context_package(context_req, "GENERIC", db)
    
    if not context_package.content_sections:
        raise ValueError(INSUFFICIENT_INFO_STR)
        
    user_prompt = build_qp_user_prompt(request.subject, context_package)
    from app.services.chat_engine.llm_client import generate_text
    import time
    
    sections = []
    global_question_tracker = [] # Used to deduplicate across the whole paper
    section_names = ["Section A", "Section B", "Section C", "Section D"]
    
    start_time = time.time()
    used_provider = request.provider
    
    # 3. Segmented Generation Loop
    # We iterate over the pattern items (e.g. {2: 10} means 10 questions of 2 marks)
    for idx, (marks_str, count) in enumerate(pattern.items()):
        marks = int(marks_str)
        system_prompt = build_qp_system_prompt(marks, count)
        
        logging.info(f"Generating {count} questions for {marks} Marks...")
        
        try:
            result = generate_text(system_prompt, user_prompt, provider=request.provider, json_mode=True)
            used_provider = result.provider
            
            raw_json = result.text.strip()
            if raw_json.startswith("```json"): raw_json = raw_json[7:-3]
            elif raw_json.startswith("```"): raw_json = raw_json[3:-3]
                
            schema = json.loads(raw_json)
            
            is_valid, valid_questions = validate_question_batch(schema, global_question_tracker)
            
            if is_valid:
                section_questions = []
                for q in valid_questions:
                    section_questions.append(
                        QuestionSchema(
                            question_text=q["question_text"],
                            marks=marks,
                            difficulty=q.get("difficulty", "MEDIUM"),
                            topic=q.get("topic", request.subject),
                            source=context_package.citations[0] if context_package.citations else None
                        )
                    )
                
                s_name = section_names[idx] if idx < len(section_names) else f"Section {idx+1}"
                sections.append(
                    SectionSchema(
                        name=s_name,
                        instructions=f"Answer the following questions. Each carries {marks} marks.",
                        questions=section_questions
                    )
                )
            else:
                logging.warning(f"Failed to generate valid section for {marks} marks.")
                
        except Exception as e:
            logging.error(f"LLM Section generation failed: {e}")
            
    if not sections:
        raise ValueError("Failed to generate any valid sections. The document may not have enough depth.")
        
    return QuestionPaperResponseSchema(
        subject=request.subject,
        exam_type=request.exam_type,
        total_marks=request.total_marks, # For a dynamic system, we'd calculate this based on generated counts
        sections=sections,
        ready_for_export=True,
        provider=used_provider,
        processing_time=round(time.time() - start_time, 2)
    )
