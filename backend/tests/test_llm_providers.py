import os
import pytest
from unittest.mock import patch, MagicMock
from app.services.chat_engine.llm_client import generate_text, LLMGenerationResult
from app.services import gemini_service, grok_service

@pytest.fixture
def mock_gemini():
    with patch('app.services.gemini_service.generate') as mock:
        mock.return_value = "Gemini Response"
        yield mock

@pytest.fixture
def mock_grok():
    with patch('app.services.grok_service.generate') as mock:
        mock.return_value = "Grok Response"
        yield mock

def test_generate_text_gemini(mock_gemini, mock_grok):
    result = generate_text("system", "user", provider="gemini")
    assert result.text == "Gemini Response"
    assert result.provider == "gemini"
    mock_gemini.assert_called_once()
    mock_grok.assert_not_called()

def test_generate_text_grok(mock_gemini, mock_grok):
    result = generate_text("system", "user", provider="grok")
    assert result.text == "Grok Response"
    assert result.provider == "grok"
    mock_grok.assert_called_once()
    mock_gemini.assert_not_called()

def test_generate_text_fallback_to_grok(mock_gemini, mock_grok):
    # Gemini fails, should fallback to Grok
    mock_gemini.side_effect = Exception("Gemini Down")
    
    result = generate_text("system", "user", provider="gemini")
    
    assert result.text == "Grok Response"
    assert result.provider == "grok"
    mock_gemini.assert_called_once()
    mock_grok.assert_called_once()

def test_generate_text_fallback_to_gemini(mock_gemini, mock_grok):
    # Grok fails, should fallback to Gemini
    mock_grok.side_effect = Exception("Grok Down")
    
    result = generate_text("system", "user", provider="grok")
    
    assert result.text == "Gemini Response"
    assert result.provider == "gemini"
    mock_grok.assert_called_once()
    mock_gemini.assert_called_once()

def test_generate_text_both_fail(mock_gemini, mock_grok):
    mock_gemini.side_effect = Exception("Gemini Down")
    mock_grok.side_effect = Exception("Grok Down")
    
    with pytest.raises(Exception) as excinfo:
        generate_text("system", "user", provider="gemini")
        
    assert "Both primary (gemini) and fallback (grok) LLM providers failed." in str(excinfo.value)
