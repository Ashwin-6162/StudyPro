# Multi-LLM AI Project

This project leverages both the Google Gemini API and the xAI Grok API to provide intelligent answers, generate exams, extract information from documents, and more.

## Architecture & AI Providers
We use a robust Fallback Router (`llm_client.py`) that handles switching between LLM providers automatically.

### Supported Providers
1. **Google Gemini** (Default)
2. **xAI Grok** (Secondary)

### How to configure API keys
1. In the `backend` folder, copy `.env.example` to `.env`.
2. Fill in the variables:
```
GEMINI_API_KEY=your_gemini_api_key_here
GROK_API_KEY=your_xai_grok_key_here
DEFAULT_PROVIDER=gemini
```

### How provider selection works
You can send `"provider": "gemini"` or `"provider": "grok"` in your API request JSON payload for endpoints that generate text (e.g. Chat, Exams, MCQs, Diagram Reconstruction).
If no provider is specified, it defaults to the `DEFAULT_PROVIDER` set in `.env`.

### How fallback works
If the primary requested provider fails (e.g., due to a rate limit `429`, or service unavailable `503`), the backend will **automatically retry the request** using the secondary provider without crashing or bubbling an error to the frontend.

### Frontend Standardized Responses
Every generation endpoint returns a standardized response with the actual provider used, and the processing time:
```json
{
  ...
  "provider": "grok",
  "processing_time": 2.34
}
```
