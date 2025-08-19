#!/usr/bin/env python3
"""
Test script to verify confidence score calculation logic
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the TestingEngine class
from app import TestingEngine

def test_confidence_calculation():
    """Test the confidence score calculation with different scenarios"""
    
    engine = TestingEngine()
    
    # Test Case 1: Few defects, high confidence expected
    report_few_defects = {
        "scenarios": [
            {"id": "S1", "title": "Test 1"},
            {"id": "S2", "title": "Test 2"},
            {"id": "S3", "title": "Test 3"},
            {"id": "S4", "title": "Test 4"},
            {"id": "S5", "title": "Test 5"}
        ],
        "defects_and_gaps": [
            {"severity": "Low", "title": "Minor UI issue"},
            {"severity": "Medium", "title": "Form validation issue"},
            {"severity": "Low", "title": "Text alignment"}
        ]
    }
    
    # Test Case 2: Many defects, low confidence expected  
    report_many_defects = {
        "scenarios": [
            {"id": "S1", "title": "Test 1"},
            {"id": "S2", "title": "Test 2"},
            {"id": "S3", "title": "Test 3"},
            {"id": "S4", "title": "Test 4"},
            {"id": "S5", "title": "Test 5"}
        ],
        "defects_and_gaps": [
            {"severity": "Critical", "title": "Login broken"},
            {"severity": "High", "title": "Payment failure"},
            {"severity": "Critical", "title": "Data loss"},
            {"severity": "Medium", "title": "Form validation"},
            {"severity": "High", "title": "Security vulnerability"},
            {"severity": "Medium", "title": "UI issues"},
            {"severity": "Low", "title": "Text issues"},
            {"severity": "Medium", "title": "Navigation problems"},
            {"severity": "High", "title": "Performance issues"},
            {"severity": "Low", "title": "Minor styling"},
            {"severity": "Critical", "title": "Core functionality broken"},
            {"severity": "Medium", "title": "Search not working"}
        ]
    }
    
    # Test Case 3: No defects, high confidence expected
    report_no_defects = {
        "scenarios": [
            {"id": "S1", "title": "Test 1"},
            {"id": "S2", "title": "Test 2"},
            {"id": "S3", "title": "Test 3"},
            {"id": "S4", "title": "Test 4"},
            {"id": "S5", "title": "Test 5"}
        ],
        "defects_and_gaps": []
    }
    
    # Calculate confidence scores
    score_few_defects = engine.calculate_dynamic_confidence_score(report_few_defects)
    score_many_defects = engine.calculate_dynamic_confidence_score(report_many_defects)
    score_no_defects = engine.calculate_dynamic_confidence_score(report_no_defects)
    
    print("🔬 Confidence Score Calculation Test Results:")
    print("=" * 50)
    print(f"📊 Report with 3 defects (Low/Medium): {score_few_defects}%")
    print(f"📊 Report with 12 defects (Mix of Critical/High/Medium/Low): {score_many_defects}%")
    print(f"📊 Report with 0 defects: {score_no_defects}%")
    print("=" * 50)
    
    # Verify expected relationships
    if score_no_defects > score_few_defects > score_many_defects:
        print("✅ PASS: Confidence scores are correctly ordered")
        print(f"   No defects ({score_no_defects}%) > Few defects ({score_few_defects}%) > Many defects ({score_many_defects}%)")
    else:
        print("❌ FAIL: Confidence scores are not correctly ordered")
        print(f"   Expected: No defects > Few defects > Many defects")
        print(f"   Actual: {score_no_defects}% > {score_few_defects}% > {score_many_defects}%")
    
    # Additional checks
    print("\n📋 Detailed Analysis:")
    print(f"   - No defects should be 95-100%: {score_no_defects}% {'✅' if score_no_defects >= 95 else '⚠️'}")
    print(f"   - Few minor defects should be 75-90%: {score_few_defects}% {'✅' if 75 <= score_few_defects <= 90 else '⚠️'}")
    print(f"   - Many critical defects should be <40%: {score_many_defects}% {'✅' if score_many_defects < 40 else '⚠️'}")
    
    return score_few_defects, score_many_defects, score_no_defects

if __name__ == "__main__":
    test_confidence_calculation()
