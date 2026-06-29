import os
import logging
import time
from openai import OpenAI, APIError, RateLimitError, APIConnectionError

_client = None

def get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GROK_API_KEY")
        if not api_key:
            logging.warning("GROK_API_KEY not found in environment variables. Grok calls will fail.")
        _client = OpenAI(
            api_key=api_key,
            base_url="https://api.x.ai/v1"
        )
    return _client

def generate(system_prompt: str, user_prompt: str, model_name: str = "grok-2-latest", json_mode: bool = False) -> str:
    """
    Calls the xAI Grok API to generate text based on the system and user prompts.
    """
    client = get_client()
    
    max_retries = 3
    base_delay = 2 # Shorter delay to prevent web requests from timing out
    
    for attempt in range(max_retries):
        try:
            kwargs = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"User Request: {user_prompt}"}
                ],
                "temperature": 0.1,
                "top_p": 0.95
            }
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
                
            response = client.chat.completions.create(**kwargs)
            return response.choices[0].message.content
        except RateLimitError as e:
            if attempt < max_retries - 1:
                logging.warning(f"Grok API Rate Limit error. Retrying in {base_delay}s... (Attempt {attempt+1}/{max_retries})")
                time.sleep(base_delay)
                base_delay *= 2
                continue
            logging.error(f"Grok Rate Limit failed after {attempt+1} attempts: {e}")
            raise e
        except APIConnectionError as e:
            if attempt < max_retries - 1:
                logging.warning(f"Grok API Connection error. Retrying in {base_delay}s... (Attempt {attempt+1}/{max_retries})")
                time.sleep(base_delay)
                base_delay *= 2
                continue
            logging.error(f"Grok Connection failed after {attempt+1} attempts: {e}")
            raise e
        except APIError as e:
            # 500, 503 errors
            if e.status_code in [500, 502, 503, 504] and attempt < max_retries - 1:
                logging.warning(f"Grok API Server error {e.status_code}. Retrying in {base_delay}s... (Attempt {attempt+1}/{max_retries})")
                time.sleep(base_delay)
                base_delay *= 2
                continue
            logging.error(f"Grok Server error failed after {attempt+1} attempts: {e}")
            raise e
        except Exception as e:
            logging.error(f"Grok Generation failed: {e}")
            raise e
