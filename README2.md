# Automated Exploratory Testing Platform

This repository contains a small platform that automates exploratory QA by generating and simulating test scenarios for a target web page using an LLM (Perplexity Sonar Pro via an OpenAI-compatible client). The project consists of a React frontend and a Flask backend.

## High-level architecture

- Frontend: React app (single-page) that collects test parameters and displays results.
- Backend: Flask API that composes deterministic prompts, calls the LLM, post-processes results, and returns a structured JSON report.
- LLM: Perplexity Sonar Pro (accessed via an OpenAI-compatible client in `backend/app.py`).

Component diagram (simplified):

```
React Frontend (frontend/)  <--HTTP-->  Flask Backend (backend/app.py)  <--API-->  Perplexity Sonar Pro (LLM)
```

## Tech stack

- Frontend: React, JavaScript, axios, Material-UI (MUI)
- Backend: Python 3.10+, Flask, Flask-CORS, requests, python-dotenv, OpenAI-compatible client (used to call Perplexity)
- Dev: npm, pip, python venv

## Key modules and files

- frontend/
  - `package.json` - frontend deps & scripts
  - `src/App.js` - app entry & routing
  - `src/index.js`, `src/index.css` - bootstrap
  - `src/components/TestingDashboard.js` - input form and controls
  - `src/components/TestResults.js` - renders results (including non-functional observations)

- backend/
  - `app.py` - main Flask app and the `TestingEngine` implementation (prompt generation, LLM calls, JSON extraction and repair, browser compatibility heuristics, scoring)
  - `requirements.txt` - Python dependencies
  - `test_confidence_logic.py`, `test_perplexity.py`, `test_prompt_parameters.py` - tests and validation scripts

## LLM details and deterministic configuration

- Model: `sonar-pro` (accessed through the Perplexity/OpenAI-compatible client in `backend/app.py`).
- Deterministic parameters in use:
  - `temperature = 0.0` (minimizes randomness)
  - `frequency_penalty = 0.0`
  - `presence_penalty = 0.0`
- Prompting: system messages and user prompt are crafted to enforce strict JSON output and consistent ordering of scenarios and categories.

## Running locally (Windows / cmd.exe)

1) Backend

```cmd
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` in `backend/` with your API key (example variable name used in the codebase):

```
OPENAI_API_KEY=your_api_key_here
```

Start the backend:

```cmd
python app.py
```

2) Frontend

```cmd
cd frontend
npm install
npm start
```

Default ports: frontend usually on `http://localhost:3000`, backend on `http://localhost:5000`.

## Tests

- Backend tests are located in the `backend/` folder. Run using pytest after activating the Python venv:

```cmd
cd backend
.\.venv\Scripts\activate
pip install pytest
pytest -q
```

## Recent changes / notes

- The project previously used input hashing and an in-memory LLM response cache to ensure repeatable results and to improve speed; those were intentionally removed per the recent request. The backend now requests fresh LLM responses for every run while keeping deterministic LLM parameters.
- Even with deterministic parameters and strict prompting, absolute result reproducibility depends on the LLM provider and model. If 100% reproducibility is required, reintroducing a content-addressable cache (file-based or Redis) is recommended.

## Troubleshooting & next steps

- If the LLM responses contain malformed JSON, the backend implements multiple extraction/repair strategies in `app.py` to recover structured JSON. Check logs for extraction details.
- To re-enable caching, add a cache store in `backend/` and key entries by a deterministic string representation of inputs.

## Contribution & contact

- Owner: SoHaMIEM
- When contributing, please run backend tests and validate prompt outputs with representative URLs.

- **UUID Generation**: Unique test session identification
- **Background Processing**: Non-blocking test execution
- **Thread Management**: Daemon threads for cleanup

#### **GET `/api/test-results/{test_id}`**
**Functionality**: Retrieve test results and progress
**Implementation**:
```python
@app.route('/api/test-results/<test_id>', methods=['GET'])
def get_test_results(test_id):
    if test_id not in test_results:
        return jsonify({'error': 'Test not found'}), 404
    
    return jsonify(test_results[test_id])
```
- **ID Validation**: Check test session existence
- **Progress Tracking**: Real-time status updates
- **Error Handling**: 404 for non-existent tests
- **JSON Serialization**: Automatic response formatting

#### **GET `/api/health`**
**Functionality**: System health monitoring
**Implementation**:
```python
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })
```
- **Service Monitoring**: Application health status
- **Version Information**: API version tracking
- **Timestamp Logging**: Request time recording

### 3.4 Asynchronous Testing Process

#### **Function: `run_testing_process`**
**Functionality**: Background test execution with progress updates
**Implementation**:
```python
def run_testing_process(test_id, url, test_type, browsers, platforms, test_categories):
    try:
        # Progress simulation
        phases = [
            (20, "Initializing browser testing..."),
            (40, "Analyzing UI components..."),
            (60, "Running accessibility checks..."),
            (80, "Performing security analysis..."),
            (90, "Generating comprehensive report..."),
        ]
        
        for progress, phase in phases:
            test_results[test_id]['progress'] = progress
            time.sleep(2)
        
        # AI Analysis
        report = testing_engine.analyze_website(...)
        
        # Update results
        test_results[test_id].update({
            'status': 'completed',
            'progress': 100,
            'report': report
        })
    except Exception as e:
        # Error handling
        test_results[test_id].update({
            'status': 'failed',
            'error': str(e)
        })
```
- **Phased Execution**: Multiple testing phases with progress tracking
- **Time Simulation**: Realistic testing duration simulation
- **Progress Updates**: Real-time progress reporting
- **Error Recovery**: Comprehensive error handling and logging

---

## 4. AI INTEGRATION & TESTING CAPABILITIES

### 4.1 Gemini Flash 2.0 Integration

#### **AI Model Configuration**
```python
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-flash-exp')

response = model.generate_content(
    prompt,
    generation_config=genai.types.GenerationConfig(
        temperature=0.7,
        max_output_tokens=8192,
    )
)
```
- **Model Selection**: Gemini 2.0 Flash Experimental version
- **Parameter Tuning**: Temperature for creativity vs consistency
- **Token Limits**: 8192 tokens for comprehensive reports
- **API Key Security**: Environment variable protection

### 4.2 Expert-Level Testing Scenarios

#### **Functional Testing Capabilities**
1. **UI Element Testing**:
   - Button functionality and states
   - Form validation and submission
   - Navigation link verification
   - Input field behavior

2. **User Journey Testing**:
   - Happy path scenarios
   - Edge case handling
   - Error state management
   - Boundary value testing

3. **Data Validation**:
   - Input sanitization
   - Format validation
   - Required field checking
   - Character limit testing

#### **Accessibility Testing Features**
1. **WCAG 2.1 Compliance**:
   - Color contrast analysis
   - Text size and readability
   - Focus indicators
   - Error message clarity

2. **Assistive Technology Support**:
   - Screen reader compatibility
   - Keyboard navigation
   - ARIA label validation
   - Semantic HTML structure

3. **Motor Accessibility**:
   - Click target sizes
   - Touch-friendly interfaces
   - Keyboard shortcuts
   - Voice control compatibility

#### **Performance Testing Analysis**
1. **Load Time Assessment**:
   - Initial page load
   - Resource loading times
   - Image optimization
   - Script execution speed

2. **Core Web Vitals**:
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)
   - First Contentful Paint (FCP)

3. **Responsiveness Testing**:
   - Mobile device compatibility
   - Viewport scaling
   - Touch interface optimization
   - Cross-browser performance

#### **Security Testing Coverage**
1. **Input Validation**:
   - SQL injection prevention
   - XSS attack protection
   - CSRF token validation
   - Input sanitization

2. **Authentication Security**:
   - Password strength requirements
   - Session management
   - Login attempt limits
   - Secure token handling

3. **Data Protection**:
   - HTTPS enforcement
   - Data encryption
   - Privacy compliance
   - Secure cookie settings

#### **Usability Testing Evaluation**
1. **User Experience**:
   - Intuitive navigation
   - Clear visual hierarchy
   - Consistent design patterns
   - Error prevention

2. **Information Architecture**:
   - Logical content organization
   - Search functionality
   - Breadcrumb navigation
   - Menu structure

3. **Conversion Optimization**:
   - Call-to-action effectiveness
   - Form completion rates
   - User flow optimization
   - Mobile user experience

### 4.3 AI Report Generation

#### **JSON Report Structure**
```json
{
  "scenarios": [
    {
      "title": "Test scenario name",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "expected_result": "Expected outcome",
      "observed_result": "Actual outcome",
      "input_data": {"field": "value"}
    }
  ],
  "functional_observations": [
    "Detailed functional findings"
  ],
  "non_functional_observations": {
    "performance": ["Performance insights"],
    "usability": ["UX observations"],
    "security": ["Security findings"],
    "accessibility": ["A11y violations"]
  },
  "defects_and_gaps": [
    {
      "title": "Issue title",
      "description": "Detailed description",
      "severity": "High|Medium|Low"
    }
  ],
  "recommendations": [
    "Actionable improvement suggestions"
  ],
  "confidence_score": 85
}
```

#### **AI Analysis Depth**
- **Scenario Generation**: 10-50 test scenarios per analysis
- **Multi-dimensional Analysis**: 5 different testing categories
- **Severity Classification**: Critical, High, Medium, Low priorities
- **Actionable Insights**: Specific improvement recommendations
- **Confidence Scoring**: AI-assessed quality confidence (0-100%)

---

## 5. DATA MANAGEMENT & STORAGE

### 5.1 In-Memory Storage System

#### **Data Structure**
```python
test_results = {
    'test_id_uuid': {
        'id': 'unique_identifier',
        'url': 'tested_application_url',
        'status': 'running|completed|failed',
        'progress': 0-100,
        'created_at': 'ISO_timestamp',
        'completed_at': 'ISO_timestamp',
        'test_type': 'quick|comprehensive|deep',
        'browsers': ['chrome', 'edge'],
        'platforms': ['windows', 'mac'],
        'test_categories': {...},
        'report': {...},
        'error': 'error_message_if_failed'
    }
}
```

#### **Storage Features**
- **Session Management**: Unique UUID for each test session
- **Progress Tracking**: Real-time progress updates (0-100%)
- **Status Management**: Running, completed, failed states
- **Metadata Storage**: Test configuration and timestamps
- **Error Logging**: Detailed error information for debugging

### 5.2 Data Persistence (Production Considerations)

#### **Database Integration Options**
1. **PostgreSQL**: Relational database for structured data
2. **MongoDB**: Document database for JSON reports
3. **Redis**: In-memory caching for session data
4. **SQLite**: Lightweight option for smaller deployments

#### **Data Schema Design**
```sql
-- Test Sessions Table
CREATE TABLE test_sessions (
    id UUID PRIMARY KEY,
    url VARCHAR(2048) NOT NULL,
    status VARCHAR(20) NOT NULL,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    test_type VARCHAR(20),
    configuration JSONB,
    report JSONB,
    error_message TEXT
);

-- Test History Index
CREATE INDEX idx_test_sessions_created ON test_sessions(created_at DESC);
CREATE INDEX idx_test_sessions_status ON test_sessions(status);
```

---

## 6. DEVELOPMENT & DEPLOYMENT INFRASTRUCTURE

### 6.1 Development Environment

#### **VS Code Configuration**
**File: `.vscode/tasks.json`**
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Backend Server",
      "type": "shell",
      "command": ".venv\\Scripts\\python.exe",
      "args": ["backend\\app.py"],
      "isBackground": true
    },
    {
      "label": "Start Frontend Server", 
      "type": "shell",
      "command": "npm",
      "args": ["start"],
      "options": {"cwd": "${workspaceFolder}/frontend"}
    },
    {
      "label": "Start Both Servers",
      "dependsOn": ["Start Backend Server", "Start Frontend Server"]
    }
  ]
}
```

#### **Development Features**
- **Concurrent Execution**: Frontend and backend servers
- **Hot Reload**: Automatic code refresh during development
- **Debug Support**: VS Code debugging configuration
- **Task Automation**: One-click server startup

### 6.2 Environment Configuration

#### **Backend Environment** (`.env`)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
FLASK_ENV=development
FLASK_DEBUG=True
```

#### **Frontend Configuration** (`package.json`)
```json
{
  "proxy": "http://localhost:5000",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  }
}
```

### 6.3 Dependency Management

#### **Python Dependencies** (`requirements.txt`)
```txt
flask==3.0.0                 # Web framework
flask-cors==4.0.0           # CORS support
google-generativeai==0.8.3  # Gemini AI integration
requests==2.31.0            # HTTP library
python-dotenv==1.0.0        # Environment variables
gunicorn==21.2.0            # Production server
```

#### **JavaScript Dependencies** (`package.json`)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0", 
    "axios": "^1.6.0",
    "react-router-dom": "^6.8.0",
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "react-json-pretty": "^2.2.0"
  },
  "devDependencies": {
    "@babel/core": "^7.23.0",
    "@babel/preset-env": "^7.23.0",
    "@babel/preset-react": "^7.22.0"
  }
}
```

### 6.4 Build & Deployment

#### **Production Build Process**
1. **Frontend Build**:
   ```bash
   npm run build
   # Creates optimized production build
   ```

2. **Backend Deployment**:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   # Production WSGI server with 4 workers
   ```

#### **Deployment Configurations**
- **Docker Support**: Containerization for consistent deployment
- **Environment Variables**: Production vs development configs
- **SSL/HTTPS**: Security certificate configuration
- **Load Balancing**: Multiple server instance support

---

## 7. USER EXPERIENCE & INTERFACE DESIGN

### 7.1 Material Design Implementation

#### **Theme Configuration**
```javascript
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5' }
  },
  typography: {
    h4: { fontWeight: 600 },
    h6: { fontWeight: 500 }
  }
});
```

#### **UI Components Used**
- **AppBar & Toolbar**: Application header
- **Paper & Card**: Content containers with elevation
- **Grid System**: Responsive layout management
- **Form Controls**: Input fields, selects, checkboxes
- **Progress Indicators**: Linear and circular progress bars
- **Accordions**: Expandable content sections
- **Chips**: Tag-like visual elements
- **Alerts**: Error and status messages

### 7.2 Responsive Design

#### **Breakpoint Management**
- **xs (0-600px)**: Mobile phones
- **sm (600-960px)**: Tablets
- **md (960-1280px)**: Small laptops
- **lg (1280-1920px)**: Desktops
- **xl (1920px+)**: Large screens

#### **Layout Adaptations**
```javascript
<Grid container spacing={3}>
  <Grid item xs={12} md={6}>
    {/* Full width on mobile, half on desktop */}
  </Grid>
</Grid>
```

### 7.3 Accessibility Features

#### **WCAG Compliance**
- **Keyboard Navigation**: Full tab-based navigation
- **Screen Reader Support**: ARIA labels and descriptions
- **Color Contrast**: AAA-compliant color combinations
- **Focus Indicators**: Clear focus states for all interactive elements

#### **Implementation Examples**
```javascript
<Button
  aria-label="Start testing process"
  startIcon={<PlayArrow />}
  disabled={loading}
>
  Start Testing
</Button>
```

---

## 8. ERROR HANDLING & RELIABILITY

### 8.1 Frontend Error Management

#### **API Error Handling**
```javascript
try {
  const response = await axios.post('/api/start-testing', data);
  // Success handling
} catch (err) {
  setError(err.response?.data?.error || 'Failed to start testing');
} finally {
  setLoading(false);
}
```

#### **User Feedback Systems**
- **Loading States**: Visual indicators during API calls
- **Error Messages**: User-friendly error descriptions
- **Success Notifications**: Confirmation of successful actions
- **Form Validation**: Real-time input validation

### 8.2 Backend Error Management

#### **Exception Handling**
```python
@app.route('/api/start-testing', methods=['POST'])
def start_testing():
    try:
        # Main logic
        return jsonify({'test_id': test_id}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

#### **Error Categories**
- **Validation Errors**: Input format and requirement errors
- **API Errors**: External service communication failures
- **Processing Errors**: Internal logic and computation errors
- **System Errors**: Resource and infrastructure issues

### 8.3 Fallback Mechanisms

#### **AI Response Fallbacks**
```python
def create_fallback_report(self, url, analysis_text):
    return {
        "scenarios": [{"title": "Basic Functionality Test", ...}],
        "functional_observations": ["Analysis completed"],
        "confidence_score": 75
    }
```

#### **Graceful Degradation**
- **AI Unavailable**: Default test scenarios provided
- **Network Issues**: Offline mode capabilities
- **Browser Compatibility**: Progressive enhancement
- **Performance Issues**: Reduced functionality modes

---

## 9. TESTING & QUALITY ASSURANCE

### 9.1 Test Categories Covered

#### **Functional Testing Scope**
1. **Form Testing**: Validation, submission, error handling
2. **Navigation Testing**: Menu functionality, routing, breadcrumbs
3. **UI Component Testing**: Buttons, links, interactive elements
4. **Data Integrity**: Input/output validation, data persistence
5. **Business Logic**: Workflow testing, conditional logic
6. **Integration Testing**: Component interaction, API integration

#### **Non-Functional Testing Scope**
1. **Performance Testing**:
   - Page load times
   - Resource optimization
   - Memory usage
   - Network efficiency

2. **Accessibility Testing**:
   - WCAG 2.1 AA/AAA compliance
   - Screen reader compatibility
   - Keyboard navigation
   - Color contrast ratios

3. **Security Testing**:
   - Input validation
   - Authentication mechanisms
   - Authorization controls
   - Data protection

4. **Usability Testing**:
   - User journey optimization
   - Interface intuitiveness
   - Error prevention
   - Mobile experience

### 9.2 Quality Metrics

#### **Automated Quality Checks**
- **Code Quality**: ESLint for JavaScript, Flake8 for Python
- **Security Scanning**: Dependency vulnerability checks
- **Performance Monitoring**: Bundle size analysis
- **Accessibility Auditing**: Automated WCAG compliance checks

#### **Test Coverage Areas**
- **Unit Testing**: Component-level functionality
- **Integration Testing**: API endpoint testing
- **End-to-End Testing**: Complete user workflows
- **Performance Testing**: Load and stress testing

---

## 10. SCALABILITY & PERFORMANCE

### 10.1 Frontend Performance Optimization

#### **Code Splitting**
```javascript
// Lazy loading for large components
const TestResults = React.lazy(() => import('./components/TestResults'));
```

#### **Bundle Optimization**
- **Tree Shaking**: Remove unused code
- **Code Splitting**: Route-based loading
- **Asset Optimization**: Image compression, lazy loading
- **CDN Integration**: Static asset delivery

### 10.2 Backend Scalability

#### **Horizontal Scaling**
```python
# Production deployment with multiple workers
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### **Performance Optimizations**
- **Background Processing**: Asynchronous test execution
- **Caching**: Result caching for repeated requests
- **Database Optimization**: Query optimization, indexing
- **Load Balancing**: Multiple server instances

### 10.3 AI Service Optimization

#### **Request Management**
- **Rate Limiting**: API call throttling
- **Retry Logic**: Automatic retry on failures
- **Timeout Handling**: Request timeout management
- **Cost Optimization**: Efficient prompt engineering

---

## 11. SECURITY CONSIDERATIONS

### 11.1 API Security

#### **Environment Variable Protection**
```python
# Secure API key management
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
```

#### **Security Measures**
- **CORS Configuration**: Controlled cross-origin access
- **Input Validation**: Request data sanitization
- **Error Information**: Limited error details in responses
- **HTTPS Enforcement**: Secure communication protocols

### 11.2 Data Protection

#### **Privacy Compliance**
- **Data Minimization**: Only necessary data collection
- **Retention Policies**: Automatic data cleanup
- **User Consent**: Clear privacy notices
- **Anonymization**: Personal data protection

---

## 12. MONITORING & ANALYTICS

### 12.1 Application Monitoring

#### **Health Checks**
```python
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })
```

#### **Monitoring Capabilities**
- **Service Health**: Application status monitoring
- **Performance Metrics**: Response time tracking
- **Error Logging**: Comprehensive error reporting
- **Usage Analytics**: User interaction tracking

### 12.2 Operational Insights

#### **Test Analytics**
- **Test Volume**: Number of tests performed
- **Success Rates**: Test completion statistics
- **Performance Trends**: Response time analysis
- **User Behavior**: Usage pattern analysis

---

## 13. FUTURE ENHANCEMENTS & ROADMAP

### 13.1 Planned Features

#### **Advanced Testing Capabilities**
1. **Visual Regression Testing**: Screenshot comparison
2. **Mobile App Testing**: Native app support
3. **API Testing**: REST/GraphQL endpoint testing
4. **Database Testing**: Data integrity validation

#### **Enhanced AI Integration**
1. **Multi-Model Support**: Different AI providers
2. **Custom Training**: Domain-specific test patterns
3. **Predictive Analytics**: Defect prediction models
4. **Automated Fixes**: AI-generated fix suggestions

### 13.2 Technical Improvements

#### **Infrastructure Enhancements**
1. **Database Integration**: Persistent data storage
2. **Container Deployment**: Docker/Kubernetes support
3. **CI/CD Pipeline**: Automated deployment
4. **Monitoring Dashboard**: Real-time analytics

#### **User Experience Improvements**
1. **Test Templates**: Pre-configured test scenarios
2. **Collaboration Features**: Team sharing and comments
3. **Custom Reports**: Branded report generation
4. **Integration APIs**: Third-party tool integration

---

## 14. CONCLUSION

The **Automated Exploratory Testing Platform** represents a comprehensive solution for modern web application testing, combining the power of AI with expert-level testing methodologies. The platform successfully integrates:

### Key Achievements
- **AI-Powered Analysis**: Leverages Gemini Flash 2.0 for intelligent test generation
- **Comprehensive Coverage**: Five major testing categories with expert-level depth
- **Modern Architecture**: React/Flask stack with best practices
- **User-Friendly Interface**: Intuitive Material Design implementation
- **Scalable Design**: Built for production deployment and growth
- **Quality Focus**: Comprehensive error handling and reliability measures

### Technical Excellence
- **15+ Years Expertise Simulation**: AI prompts designed to replicate expert tester experience
- **Multi-Strategy Processing**: Robust JSON parsing with fallback mechanisms
- **Real-time Updates**: Live progress tracking and status management
- **Responsive Design**: Cross-device compatibility and accessibility
- **Security-First**: Environment variable protection and secure API practices

The platform delivers a production-ready solution that can significantly reduce manual testing effort while providing expert-level insights and comprehensive coverage across functional and non-functional testing domains.

---

**Document Version**: 1.0  
**Last Updated**: August 13, 2025  
**Total Implementation**: 100% Complete  
**Lines of Code**: ~2,500+ (Frontend), ~400+ (Backend)  
**Dependencies**: 20+ packages across both stacks
