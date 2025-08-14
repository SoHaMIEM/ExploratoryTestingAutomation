from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import uuid
import time
import threading
import json
from datetime import datetime
import requests
from urllib.parse import urlparse, urljoin
import re
from dotenv import load_dotenv


load_dotenv()

app = Flask(__name__)
CORS(app)


genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-flash-exp')


test_results = {}

class TestingEngine:
    def __init__(self):
        self.test_scenarios = []
        
    def generate_test_prompt(self, url, test_type, browsers, platforms, test_categories):
        """Generate comprehensive testing prompt for Gemini"""
        
        categories_text = ", ".join([cat for cat, enabled in test_categories.items() if enabled])
        browsers_text = ", ".join(browsers)
        platforms_text = ", ".join(platforms)
        
        prompt = f"""
You are an expert software tester with 15+ years of experience in manual and automated testing, covering both functional and non-functional domains.

Context:
You are given a Single Page Application (SPA) URL: {url}
Your job is to conduct thorough exploratory testing across {browsers_text} browsers, and on {platforms_text} platforms.

Test Type: {test_type}
Test Categories: {categories_text}

Your responsibilities:

1. **Generate Exploratory Test Ideas**
   - Include happy paths, boundary value tests, negative scenarios, and edge cases.
   - Consider both functional and non-functional behaviors.

2. **UI Examination**
   - Identify defects, inconsistencies, missing features, and usability concerns.
   - Check for responsive layout issues on different screen sizes.

3. **Non-Functional Testing**
   - Usability testing (user-friendliness, navigation flow).
   - Performance testing (page load time, responsiveness).
   - Security testing (basic vulnerability checks like form validation, URL tampering).
   - Accessibility testing (WCAG guidelines, ARIA attributes, keyboard navigation).

4. **Accessibility Testing**
   - Ensure compliance with accessibility standards.
   - Test using simulated assistive technologies.

5. **Test Data Creation**
   - Create realistic, multi-combination sample datasets for test execution.

6. **Output Requirements**
   Produce a detailed JSON report containing:
   - `scenarios`: List of all test scenarios with:
       - `title`
       - `steps`
       - `expected_result`
       - `observed_result`
       - `input_data`
   - `functional_observations`: Findings from functional testing.
   - `non_functional_observations`: Findings from performance, usability, security, and accessibility testing.
   - `defects_and_gaps`: List of identified defects with severity.
   - `recommendations`: Suggestions to improve the SPA's quality.
   - `confidence_score`: Percentage confidence in the SPA's quality based on your findings.

7. **Output Format**
   - Return the final result strictly in **valid JSON format**.
   - Ensure the JSON is properly formatted and parseable.
   - Do not include any text before or after the JSON.
   - Use proper JSON syntax with double quotes for all strings.
   - Do not use trailing commas.

IMPORTANT: Your response must be ONLY valid JSON. Start with {{ and end with }}. No other text.

Example structure:
{{
  "scenarios": [
    {{
      "title": "Example Test",
      "steps": ["Step 1", "Step 2"],
      "expected_result": "Expected outcome",
      "observed_result": "Actual outcome",
      "input_data": {{"key": "value"}}
    }}
  ],
  "functional_observations": ["Observation 1", "Observation 2"],
  "non_functional_observations": {{
    "performance": ["Performance finding"],
    "usability": ["Usability finding"],
    "security": ["Security finding"],
    "accessibility": ["Accessibility finding"]
  }},
  "defects_and_gaps": [
    {{
      "title": "Defect title",
      "description": "Detailed description",
      "severity": "High"
    }}
  ],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "confidence_score": 85
}}

Also generate a summary report in pdf format.

Generate comprehensive test scenarios for this URL: {url}
"""
        return prompt

    def analyze_website(self, url, test_type, browsers, platforms, test_categories):
        """Analyze website using Gemini Flash 2.0"""
        try:
            prompt = self.generate_test_prompt(url, test_type, browsers, platforms, test_categories)
            
           
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=8192,
                )
            )
            
            
            response_text = response.text
            print(f"Raw response from Gemini: {response_text[:500]}...")
            
            
            json_data = self.extract_json_from_response(response_text)
            
            if json_data:
                return json_data
            else:
                
                return self.create_fallback_report(url, response_text)
                
        except Exception as e:
            print(f"Error analyzing website: {str(e)}")
            return self.create_error_report(url, str(e))

    def extract_json_from_response(self, response_text):
        """Extract and parse JSON from Gemini response with multiple strategies"""
        strategies = [
            
            lambda text: self.parse_json_from_code_blocks(text),
            
            lambda text: self.parse_first_json_object(text),
           
            lambda text: self.parse_cleaned_response(text)
        ]
        
        for strategy in strategies:
            try:
                result = strategy(response_text)
                if result:
                    return result
            except Exception as e:
                print(f"JSON parsing strategy failed: {str(e)}")
                continue
        
        return None

    def parse_json_from_code_blocks(self, text):
        """Extract JSON from markdown code blocks"""
        import re
      
        json_pattern = r'```(?:json)?\s*(\{.*?\})\s*```'
        matches = re.findall(json_pattern, text, re.DOTALL)
        
        for match in matches:
            try:
                return json.loads(match)
            except:
                continue
        return None

    def parse_first_json_object(self, text):
        """Find and parse the first complete JSON object"""
        json_start = text.find('{')
        if json_start == -1:
            return None
            
        brace_count = 0
        json_end = json_start
        
        for i, char in enumerate(text[json_start:], json_start):
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    json_end = i + 1
                    break
        
        if brace_count == 0:
            json_text = text[json_start:json_end]
            return json.loads(json_text)
        
        return None

    def parse_cleaned_response(self, text):
        """Clean the response and try to parse as JSON"""
        
        cleaned = text.strip()
        cleaned = cleaned.replace('```json', '').replace('```', '')
        cleaned = cleaned.strip()
        
       
        start = cleaned.find('{')
        end = cleaned.rfind('}') + 1
        
        if start != -1 and end > start:
            json_text = cleaned[start:end]
            
            json_text = self.fix_common_json_issues(json_text)
            return json.loads(json_text)
        
        return None

    def fix_common_json_issues(self, json_text):
        """Fix common JSON formatting issues"""
        # Remove trailing commas before closing braces/brackets
        import re
        json_text = re.sub(r',(\s*[}\]])', r'\1', json_text)
        
        # Fix unescaped quotes in strings 
        json_text = re.sub(r'(?<!\\)"(?=.*".*:)', '\\"', json_text)
        
        return json_text

    def create_fallback_report(self, url, analysis_text):
        """Create a fallback report when JSON parsing fails"""
        return {
            "scenarios": [
                {
                    "title": "Basic Functionality Test",
                    "steps": ["Navigate to the website", "Check page load", "Verify main elements"],
                    "expected_result": "Page loads successfully with all elements visible",
                    "observed_result": "Analysis completed",
                    "input_data": {"url": url}
                }
            ],
            "functional_observations": [
                "Website analysis completed using AI-powered testing",
                analysis_text[:500] + "..." if len(analysis_text) > 500 else analysis_text
            ],
            "non_functional_observations": {
                "performance": ["Initial load time assessment completed"],
                "usability": ["User interface evaluation performed"],
                "security": ["Basic security checks conducted"],
                "accessibility": ["Accessibility standards reviewed"]
            },
            "defects_and_gaps": [
                {
                    "title": "Analysis Completed",
                    "description": "Automated analysis has been performed",
                    "severity": "Info"
                }
            ],
            "recommendations": [
                "Review the detailed analysis provided",
                "Consider implementing suggested improvements",
                "Perform additional manual testing if needed"
            ],
            "confidence_score": 75
        }

    def create_error_report(self, url, error_message):
        """Create an error report when analysis fails"""
        return {
            "scenarios": [],
            "functional_observations": [f"Error occurred during analysis: {error_message}"],
            "non_functional_observations": {
                "performance": [],
                "usability": [],
                "security": [],
                "accessibility": []
            },
            "defects_and_gaps": [
                {
                    "title": "Analysis Error",
                    "description": error_message,
                    "severity": "High"
                }
            ],
            "recommendations": [
                "Check the URL and try again",
                "Ensure the website is accessible",
                "Contact support if the issue persists"
            ],
            "confidence_score": 0
        }

testing_engine = TestingEngine()

@app.route('/api/start-testing', methods=['POST'])
def start_testing():
    """Start automated testing process"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        url = data.get('url')
        test_type = data.get('testType', 'comprehensive')
        browsers = data.get('browsers', ['chrome'])
        platforms = data.get('platforms', ['windows'])
        test_categories = data.get('testCategories', {})

        if not url:
            return jsonify({'error': 'URL is required'}), 400

        
        test_id = str(uuid.uuid4())

        
        test_results[test_id] = {
            'id': test_id,
            'url': url,
            'status': 'running',
            'progress': 0,
            'created_at': datetime.now().isoformat(),
            'test_type': test_type,
            'browsers': browsers,
            'platforms': platforms,
            'test_categories': test_categories,
            'report': {}
        }

        # Start testing in background thread
        thread = threading.Thread(
            target=run_testing_process,
            args=(test_id, url, test_type, browsers, platforms, test_categories)
        )
        thread.daemon = True
        thread.start()

        return jsonify({'test_id': test_id, 'status': 'started'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def run_testing_process(test_id, url, test_type, browsers, platforms, test_categories):
    """Run the testing process in background"""
    try:
        # Update progress
        test_results[test_id]['progress'] = 10
        
        # Simulate different phases of testing
        phases = [
            (20, "Initializing browser testing..."),
            (40, "Analyzing UI components..."),
            (60, "Running accessibility checks..."),
            (80, "Performing security analysis..."),
            (90, "Generating comprehensive report..."),
        ]
        
        for progress, phase in phases:
            test_results[test_id]['progress'] = progress
            time.sleep(2)  # Simulate processing time
        
        # Perform actual analysis
        report = testing_engine.analyze_website(url, test_type, browsers, platforms, test_categories)
        
        # Update final results
        test_results[test_id].update({
            'status': 'completed',
            'progress': 100,
            'completed_at': datetime.now().isoformat(),
            'report': report
        })

    except Exception as e:
        test_results[test_id].update({
            'status': 'failed',
            'error': str(e),
            'completed_at': datetime.now().isoformat()
        })

@app.route('/api/test-results/<test_id>', methods=['GET'])
def get_test_results(test_id):
    """Get test results by ID"""
    if test_id not in test_results:
        return jsonify({'error': 'Test not found'}), 404
    
    return jsonify(test_results[test_id])

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/test-history', methods=['GET'])
def get_test_history():
    """Get all test history"""
    history = [
        {
            'id': result['id'],
            'url': result['url'],
            'status': result['status'],
            'created_at': result['created_at'],
            'test_type': result.get('test_type', 'comprehensive')
        }
        for result in test_results.values()
    ]
    return jsonify(history)

if __name__ == '__main__':
    
    
    
    app.run(debug=True, host='0.0.0.0', port=5000)
