#!/usr/bin/env python3
"""
Test script to verify prompt generation includes user-selected parameters
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import TestingEngine

def test_prompt_parameters():
    """Test that the prompt includes user-selected parameters"""
    
    print("🔬 Testing Prompt Parameter Integration")
    print("=" * 50)
    
    # Create test parameters
    test_url = "https://example.com"
    test_type = "comprehensive"
    test_browsers = ["Chrome", "Firefox", "Safari"]
    test_platforms = ["Windows", "macOS", "iOS"] 
    test_categories = {
        "functional": True,
        "accessibility": True,
        "performance": False,
        "security": True,
        "usability": False
    }
    
    # Initialize testing engine
    engine = TestingEngine()
    
    # Generate prompt
    prompt = engine.generate_test_prompt(
        test_url, 
        test_type, 
        test_browsers, 
        test_platforms, 
        test_categories
    )
    
    # Check if parameters are included
    print("📋 Checking Parameter Inclusion:")
    print("-" * 30)
    
    # Check browsers
    browsers_text = ", ".join(test_browsers)
    if browsers_text in prompt:
        print(f"✅ Browsers included: {browsers_text}")
    else:
        print(f"❌ Browsers missing: {browsers_text}")
    
    # Check platforms  
    platforms_text = ", ".join(test_platforms)
    if platforms_text in prompt:
        print(f"✅ Platforms included: {platforms_text}")
    else:
        print(f"❌ Platforms missing: {platforms_text}")
    
    # Check categories
    categories_text = ", ".join([cat for cat, enabled in test_categories.items() if enabled])
    if categories_text in prompt:
        print(f"✅ Categories included: {categories_text}")
    else:
        print(f"❌ Categories missing: {categories_text}")
    
    # Check test type
    if test_type in prompt:
        print(f"✅ Test type included: {test_type}")
    else:
        print(f"❌ Test type missing: {test_type}")
    
    print("\n" + "=" * 50)
    print("📄 Generated Prompt Sample:")
    print("-" * 30)
    print(prompt[:800] + "..." if len(prompt) > 800 else prompt)
    
    return prompt

if __name__ == "__main__":
    test_prompt_parameters()
