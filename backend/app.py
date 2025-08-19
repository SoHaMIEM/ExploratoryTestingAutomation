from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
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

# Initialize Perplexity client
client = OpenAI(
    api_key="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",
    base_url="https://api.perplexity.ai"
)


test_results = {}

# ... (keep all your imports and Flask app setup)

class TestingEngine:
    def __init__(self):
        self.test_scenarios = []
        
   # In your backend/app.py file

    # In your backend/app.py file
# In your backend/app.py file

    # In your backend/app.py file

    def generate_test_prompt(self, url, test_type, browsers, platforms, test_categories):
        """
        Generate a definitive, integrated prompt that generates and simulates test cases
        in a single workflow to ensure defects are found.
        """
        
        categories_text = ", ".join([cat for cat, enabled in test_categories.items() if enabled])
        browsers_text = ", ".join(browsers)
        platforms_text = ", ".join(platforms)
        
        prompt = f"""
    You are a Principal QA Architect with an obsessive eye for detail. Your mission is to produce a comprehensive test report for the page at `{url}`. You will do this by brainstorming every conceivable test case and **immediately simulating the outcome of each one** to find and report all defects.
    
    **Target URL:** **{url}** (Analyze ONLY this page)
    **Test Type:** {test_type}
    
    **TESTING SCOPE AND FOCUS:**
    - **Target Browsers:** {browsers_text}
    - **Target Platforms:** {platforms_text}  
    - **Test Categories to Focus On:** {categories_text}
    
    **INSTRUCTIONS:** Tailor your testing approach to specifically address the selected categories, browsers, and platforms above. If specific categories are selected, prioritize those areas while ensuring comprehensive coverage.
    
    ---
    **## COGNITIVE WORKFLOW: INTEGRATED TEST & SIMULATION (MANDATORY) ##**
    
    You must follow this integrated process:
    
    1.  **Component Inventory:** Begin by creating a mental inventory of every single interactive element on the page (all buttons, links, forms, menus, etc.).
    
    2.  **Generate, Simulate, and Report (Continuous Loop):**
        -   You will go through your component inventory one by one.
        -   For each component, brainstorm a comprehensive list of test scenarios (Functional, UI, Usability, Accessibility, etc.).
        -   **PRIORITIZE scenarios that match the selected test categories: {categories_text}**
        -   **Consider browser-specific issues for: {browsers_text}**
        -   **Consider platform-specific issues for: {platforms_text}**
        -   **For EVERY SINGLE SCENARIO you create, you MUST immediately perform the following steps:**
            a.  **Add to `scenarios` array:** Write the complete test case, including `title`, `steps`, and `expected_result`, into the `scenarios` array.
            b.  **Simulate Execution:** Mentally execute the steps with a cynical mindset, considering the target browsers and platforms. Determine the most likely `observed_result`.
            c.  **Add `observed_result`:** Add the simulated `observed_result` to the scenario you just created in the `scenarios` array.
            d.  **Determine status:** Compare `expected_result` with `observed_result` and add a `status` field: "pass" if they match, "fail" if they don't match, "warning" for minor issues.
            e.  **Compare and Log Defect:** Directly compare the `expected_result` with the `observed_result`.
            f.  **IF** they do not match, you **MUST** create a corresponding, detailed entry in the `defects_and_gaps` array, assigning a severity based on the feature's importance.
    
    ---
    **## OUTPUT REQUIREMENTS ##**
    
    Produce a single JSON object. The `scenarios` array must contain your comprehensive list of test cases, each with an `observed_result`. The `defects_and_gaps` array must contain all failures discovered during your continuous simulation.
    
    **JSON Structure Example:**
    {{
      "scenarios": [
        {{
          "id": "SCENARIO-001",
          "title": "Critical Journey: Verify 'Read More' link navigation",
          "feature": "Article Navigation",
          "category": "Functional",
          "browser": "{browsers_text.split(', ')[0] if browsers_text else 'Chrome'}",
          "platform": "{platforms_text.split(', ')[0] if platforms_text else 'Windows'}",
          "priority": "High",
          "steps": ["Click the 'Read More' link on the first article."],
          "expected_result": "User should be navigated to the article content page.",
          "observed_result": "The page reloads, user remains on the same page.",
          "status": "fail"
        }},
        {{
          "id": "SCENARIO-002",
          "title": "UI Check: Verify footer text alignment across {browsers_text}",
          "feature": "Footer",
          "category": "UI/UX",
          "browser": "{browsers_text}",
          "platform": "{platforms_text}",
          "priority": "Low",
          "steps": ["Scroll to the bottom of the page.", "Observe the 'Need Help?' text and links."],
          "expected_result": "All text and links in the footer should be properly aligned without overlap on all target browsers.",
          "observed_result": "The 'Need Help?' text overlaps with the 'Contact us' link in Safari on iOS.",
          "status": "fail"
        }},
        {{
          "id": "SCENARIO-003",
          "title": "Functional Check: Verify search functionality",
          "feature": "Search",
          "category": "Functional",
          "browser": "{browsers_text.split(', ')[0] if browsers_text else 'Chrome'}",
          "platform": "{platforms_text.split(', ')[0] if platforms_text else 'Windows'}",
          "priority": "High",
          "steps": ["Enter search term", "Click search button"],
          "expected_result": "Search results should be displayed.",
          "observed_result": "Search results are displayed correctly with relevant content.",
          "status": "pass"
        }}
      ],
      "defects_and_gaps": [
        {{
            "id": "BUG-001",
            "title": "CRITICAL: Article links are non-functional, blocking all content access.",
            "description": "Test SCENARIO-001 failed. Expected: User should be navigated to content. Observed: Page reloaded. This breaks the page's core purpose.",
            "severity": "Critical",
            "feature": "Article Navigation",
            "affected_browsers": "{browsers_text}",
            "affected_platforms": "{platforms_text}"
        }},
        {{
            "id": "BUG-002",
            "title": "LOW: Footer text overlaps on mobile Safari",
            "description": "Test SCENARIO-002 failed. The text in the footer overlaps in Safari on iOS, which appears unprofessional on mobile devices.",
            "severity": "Low",
            "feature": "Footer",
            "affected_browsers": "Safari",
            "affected_platforms": "iOS"
        }}
      ],
      "recommendations": [
        "Fix article link routing immediately across all browsers: {browsers_text}.", 
        "Adjust footer CSS to fix text overlap specifically for Safari on iOS.",
        "Test responsive design thoroughly on {platforms_text} platforms.",
        "Focus additional testing on selected categories: {categories_text}"
      ]
    }}
    
    **IMPORTANT:** Do not include a "confidence_score" field in your response - this will be calculated automatically based on your findings.
    
    **CRITICAL REQUIREMENTS:**
    1. **Focus on selected categories:** Give priority to test scenarios that match: {categories_text}
    2. **Target specific browsers:** Consider browser-specific issues for: {browsers_text} 
    3. **Target specific platforms:** Consider platform-specific issues for: {platforms_text}
    4. **Include browser/platform context:** When reporting defects, specify which browsers/platforms are affected
    5. **Tailor recommendations:** Make recommendations specific to the selected browsers, platforms, and categories
    
    **FINAL INSTRUCTION:** Execute this integrated process precisely, always keeping the user's selected parameters in mind. Do not separate brainstorming from simulation. For every test case you think of, you must immediately determine its outcome and log a defect if it fails, considering the specific browsers, platforms, and categories selected by the user.
    """
        return prompt

    def analyze_website(self, url, test_type, browsers, platforms, test_categories):
        """Analyze website using Perplexity API"""
        try:
            prompt = self.generate_test_prompt(url, test_type, browsers, platforms, test_categories)
            
            response = client.chat.completions.create(
                model="sonar-pro",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert software testing engineer with 15+ years of experience. Generate comprehensive test reports in valid JSON format."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                temperature=0.5,
                max_tokens=8192
            )
            
            response_text = response.choices[0].message.content
            print(f"Raw response from Perplexity: {response_text[:500] if response_text else 'No content'}...")
            
            if not response_text:
                print("Empty response from Perplexity API")
                return self.create_error_report(url, "Empty response from Perplexity API")
            
            json_data = self.extract_json_from_response(response_text)
            
            if json_data:
                # Calculate dynamic confidence score based on actual results
                confidence_score = self.calculate_dynamic_confidence_score(json_data)
                json_data['confidence_score'] = confidence_score
                return json_data
            else:
                print("Failed to parse JSON, returning fallback report.")
                fallback_report = self.create_fallback_report(url, response_text)
                # Even fallback reports should have calculated confidence
                fallback_report['confidence_score'] = self.calculate_dynamic_confidence_score(fallback_report)
                return fallback_report
                
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
                if result and 'scenarios' in result: # Basic validation
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
        
        if not matches:
            return None
        
        # Try to parse the largest match first
        matches.sort(key=len, reverse=True)
        for match in matches:
            try:
                return json.loads(match)
            except json.JSONDecodeError:
                continue
        return None

    def parse_first_json_object(self, text):
        """Find and parse the first complete JSON object"""
        json_start = text.find('{')
        if json_start == -1:
            return None
            
        brace_count = 0
        json_end = -1
        
        # A more robust way to find the matching brace
        for i, char in enumerate(text[json_start:]):
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
            if brace_count == 0:
                json_end = json_start + i + 1
                break
        
        if json_end != -1:
            json_text = text[json_start:json_end]
            return json.loads(json_text)
        
        return None

    def parse_cleaned_response(self, text):
        """Clean the response and try to parse as JSON"""
        cleaned = text.strip()
        
        start = cleaned.find('{')
        end = cleaned.rfind('}') + 1
        
        if start != -1 and end > start:
            json_text = cleaned[start:end]
            json_text = self.fix_common_json_issues(json_text)
            return json.loads(json_text)
        
        return None

    def calculate_dynamic_confidence_score(self, report_data):
        """Calculate confidence score based on defects, scenarios, and severity"""
        try:
            # Get basic metrics
            total_scenarios = len(report_data.get('scenarios', []))
            total_defects = len(report_data.get('defects_and_gaps', []))
            
            # If no scenarios were tested, very low confidence
            if total_scenarios == 0:
                return 15
            
            # Base confidence starts at 100
            confidence = 100
            
            # Deduct points based on defect severity
            defects = report_data.get('defects_and_gaps', [])
            for defect in defects:
                severity = defect.get('severity', 'Medium').lower()
                
                if severity in ['critical', 'high']:
                    confidence -= 15  # Heavy penalty for critical/high severity
                elif severity in ['medium', 'moderate']:
                    confidence -= 8   # Medium penalty
                elif severity in ['low', 'minor']:
                    confidence -= 3   # Light penalty
            
            # Additional penalty for high defect ratio
            if total_scenarios > 0:
                defect_ratio = total_defects / total_scenarios
                if defect_ratio > 0.5:  # More than 50% of tests failed
                    confidence -= 20
                elif defect_ratio > 0.3:  # More than 30% of tests failed
                    confidence -= 10
            
            # Bonus points for comprehensive testing
            if total_scenarios >= 15:
                confidence += 5
            elif total_scenarios >= 10:
                confidence += 3
            
            # Ensure confidence is within bounds
            confidence = max(5, min(100, confidence))
            
            return int(confidence)
            
        except Exception as e:
            print(f"Error calculating confidence score: {str(e)}")
            return 50  # Default middle value if calculation fails

    def fix_common_json_issues(self, json_text):
        """Fix common JSON formatting issues like trailing commas"""
        import re
        # Remove trailing commas before closing braces/brackets
        json_text = re.sub(r',\s*([}\]])', r'\1', json_text)
        return json_text

    def create_fallback_report(self, url, analysis_text):
        """Create fallback report when JSON parsing fails"""
        report = {
            "scenarios": [],
            "functional_observations": [
                "Fallback report generated due to JSON parsing failure.",
                "Raw AI Response (truncated): " + analysis_text[:1000]
            ],
            "non_functional_observations": {},
            "defects_and_gaps": [{
                "id": "PARSE-001",
                "title": "JSON Generation Failed",
                "description": "The AI model did not return a valid JSON object. This could be due to a content policy violation or a model formatting error. Check the raw response above.",
                "severity": "High",
                "feature": "AI Response Processing"
            }],
            "recommendations": [
                "Try the request again with a different URL format",
                "If the problem persists, the target website may have content that triggers AI safety filters",
                "Consider testing a simpler website first"
            ]
        }
        # Calculate confidence based on the failure
        report['confidence_score'] = self.calculate_dynamic_confidence_score(report)
        return report

    def create_error_report(self, url, error_message):
        """Create error report when API call fails"""
        report = {
            "scenarios": [],
            "functional_observations": [f"A critical error occurred during analysis: {error_message}"],
            "non_functional_observations": {},
            "defects_and_gaps": [{
                "id": "ERROR-001",
                "title": "Analysis Process Error",
                "description": f"Technical error during testing: {error_message}",
                "severity": "Critical",
                "feature": "Testing Infrastructure"
            }],
            "recommendations": [
                "Check the Flask server logs for detailed error information",
                "Verify the Perplexity API key and connectivity",
                "Ensure the target URL is accessible and properly formatted"
            ]
        }
        # Even error reports should have calculated confidence (will be very low due to Critical severity)
        report['confidence_score'] = self.calculate_dynamic_confidence_score(report)
        return report

# ... (the rest of your Flask routes and main execution block)
# No changes are needed for the routes like /api/start-testing, run_testing_process, etc.

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
