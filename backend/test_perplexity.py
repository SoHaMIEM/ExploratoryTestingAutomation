#!/usr/bin/env python3
"""
Simple test script to verify Perplexity API integration
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from openai import OpenAI

def test_perplexity_api():
    """Test Perplexity API with a simple request"""
    try:
        client = OpenAI(
            api_key="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",
            base_url="https://api.perplexity.ai"
        )
        
        response = client.chat.completions.create(
            model="sonar-pro",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Respond with a simple JSON object."
                },
                {
                    "role": "user", 
                    "content": "Generate a simple test JSON object with fields: status, message, timestamp"
                }
            ],
            temperature=0.1,
            max_tokens=100
        )
        
        result = response.choices[0].message.content
        print("✅ Perplexity API Test Successful!")
        print(f"Response: {result}")
        return True
        
    except Exception as e:
        print(f"❌ Perplexity API Test Failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_perplexity_api()
