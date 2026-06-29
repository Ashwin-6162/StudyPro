import os
import logging
from google import genai
import time

_client = None

def get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logging.warning("GEMINI_API_KEY not found in environment variables. Gemini calls will fail.")
        _client = genai.Client(api_key=api_key)
    return _client

def generate(system_prompt: str, user_prompt: str, model_name: str = "gemini-2.5-flash", json_mode: bool = False) -> str:
    """
    Calls the Gemini API to generate text based on the system and user prompts.
    """
    client = get_client()
    
    max_retries = 3
    base_delay = 2 # Shorter delay to prevent web requests from timing out
    fallback_models = ["gemini-2.5-flash-lite", "gemini-flash-lite-latest"]
    current_model = model_name
    
    for attempt in range(max_retries):
        try:
            config_kwargs = {
                "temperature": 0.1,
                "top_p": 0.95
            }
            if json_mode:
                config_kwargs["response_mime_type"] = "application/json"
                
            response = client.models.generate_content(
                model=current_model,
                contents=[
                    {"role": "user", "parts": [{"text": f"{system_prompt}\n\nUser Request: {user_prompt}"}]}
                ],
                config=genai.types.GenerateContentConfig(**config_kwargs)
            )
            return response.text
        except Exception as e:
            error_msg = str(e)
            is_retryable = "429" in error_msg or "503" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "UNAVAILABLE" in error_msg
            
            if is_retryable and attempt < max_retries - 1:
                # If 503 Service Unavailable or 429 Quota Exceeded, fallback to another model
                if fallback_models:
                    current_model = fallback_models.pop(0)
                    logging.warning(f"Gemini API 429/503 error. Falling back to {current_model}...")
                    time.sleep(1) # Short delay before trying new model
                    continue
                    
                logging.warning(f"Gemini API error (429/503). Retrying in {base_delay}s... (Attempt {attempt+1}/{max_retries})")
                time.sleep(base_delay)
                base_delay *= 2 # Exponential backoff
                continue
                
            logging.error(f"Gemini Generation failed after {attempt+1} attempts: {e}")
            raise e
