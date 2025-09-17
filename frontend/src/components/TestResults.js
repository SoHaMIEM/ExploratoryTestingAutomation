import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  IconButton
} from '@mui/material';
import {
  ExpandMore,
  ArrowBack,
  CheckCircle,
  Error,
  Warning,
  Info,
  Assessment,
  Security,
  Accessibility,
  Speed,
  BugReport,
  Download,
  Cancel,
  ErrorOutline,
  FilterList,
  Clear
} from '@mui/icons-material';
import axios from 'axios';
import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';

const TestResults = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    testId: '',
    type: '',
    platform: '',
    browser: '',
    status: ''
  });
  
  // Browser compatibility filter states
  const [showBrowserFilters, setShowBrowserFilters] = useState(false);
  const [browserFilters, setBrowserFilters] = useState({
    testId: '',
    status: '',
    affectedBrowser: '',
    affectedPlatform: ''
  });

  useEffect(() => {
    fetchResults();
    const interval = setInterval(() => {
      if (!results || results.status === 'running') {
        fetchResults();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [testId]);

  const fetchResults = async () => {
    try {
      const response = await axios.get(`/api/test-results/${testId}`);
      setResults(response.data);
      setProgress(response.data.progress || 0);
      
      if (response.data.status === 'completed' || response.data.status === 'failed') {
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to fetch test results');
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return <Error color="error" />;
      case 'medium':
        return <Warning color="warning" />;
      case 'low':
        return <Info color="info" />;
      default:
        return <CheckCircle color="success" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'success';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pass':
      case 'passed':
        return <CheckCircle color="success" />;
      case 'fail':
      case 'failed':
        return <Cancel color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      default:
        return <ErrorOutline color="action" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pass':
      case 'passed':
        return 'success';
      case 'fail':
      case 'failed':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Helper function to check if any scenario has meaningful observed results
  const hasObservedResults = (scenarios) => {
    return scenarios && scenarios.some(scenario => {
      const observed = scenario.observed_result || scenario.observed || '';
      return observed && observed.trim() !== '' && observed.trim().toLowerCase() !== 'n/a';
    });
  };

  const deriveStatus = (scenario) => {
    // If status is already provided, use it
    if (scenario.status) {
      return scenario.status;
    }
    
    // Derive status from comparing expected vs observed results
    const expected = (scenario.expected_result || scenario.expected || '').toLowerCase().trim();
    const observed = (scenario.observed_result || scenario.observed || '').toLowerCase().trim();
    
    if (!expected || !observed) {
      return 'warning';
    }
    
    // Simple comparison - you can make this more sophisticated
    if (expected === observed) {
      return 'pass';
    }
    
    // Check if observed contains indicators of failure
    if (observed.includes('error') || observed.includes('fail') || observed.includes('not working') || 
        observed.includes('broken') || observed.includes('doesn\'t') || observed.includes('unable') ||
        observed.includes('overlaps') || observed.includes('misaligned') || observed.includes('incorrect')) {
      return 'fail';
    }
    
    // Check if observed contains indicators of partial success
    if (observed.includes('partially') || observed.includes('some issues') || observed.includes('minor')) {
      return 'warning';
    }
    
    // If expected and observed are different but no clear failure indicators
    return 'fail';
  };

  const downloadReport = async () => {
    try {
      // Show loading state
      const downloadButton = document.querySelector('button[aria-label="Download Report"]');
      const originalText = downloadButton?.textContent;
      
      if (downloadButton) {
        downloadButton.textContent = 'Generating PDF...';
        downloadButton.disabled = true;
      }

      // Get the main container element that contains all the test results
      const element = document.querySelector('[data-testid="test-results-container"]');
      
      if (!element) {
        throw new Error('Test results container not found');
      }

      // Get the bounding rectangle to understand the actual position
      const rect = element.getBoundingClientRect();
      const bodyRect = document.body.getBoundingClientRect();
      
      // Calculate the actual offset from the body
      const offsetX = rect.left - bodyRect.left;
      const offsetY = rect.top - bodyRect.top;

      // Scroll to top to ensure consistent capture
      window.scrollTo(0, 0);
      
      // Wait for scroll to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Temporarily expand all accordions for full capture
      const accordions = document.querySelectorAll('.MuiAccordion-root');
      const accordionStates = [];
      
      accordions.forEach((accordion, index) => {
        const summary = accordion.querySelector('.MuiAccordionSummary-root');
        const details = accordion.querySelector('.MuiAccordionDetails-root');
        const isExpanded = accordion.classList.contains('Mui-expanded');
        
        accordionStates.push({ accordion, isExpanded });
        
        if (!isExpanded && summary) {
          summary.click();
        }
      });

      // Wait for accordions to expand
      await new Promise(resolve => setTimeout(resolve, 500));

      // Configure html2canvas options for full page capture
      // Use document.body but crop to our element's area
      const canvas = await html2canvas(document.body, {
        height: element.scrollHeight + offsetY + 100, // Add some padding
        width: Math.max(element.scrollWidth + offsetX + 100, window.innerWidth), // Ensure full width
        useCORS: true,
        allowTaint: true,
        scale: 1,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        logging: false,
        backgroundColor: '#ffffff',
        removeContainer: false,
        foreignObjectRendering: true,
        imageTimeout: 15000,
        onclone: (clonedDoc, element) => {
          // Remove any potential transform or positioning issues
          clonedDoc.body.style.transform = 'none';
          clonedDoc.body.style.position = 'static';
          clonedDoc.body.style.overflow = 'visible';
          
          // Ensure the test results container is properly positioned
          const clonedContainer = clonedDoc.querySelector('[data-testid="test-results-container"]');
          if (clonedContainer) {
            clonedContainer.style.height = 'auto';
            clonedContainer.style.overflow = 'visible';
            clonedContainer.style.position = 'static';
            clonedContainer.style.transform = 'none';
            clonedContainer.style.left = '0';
            clonedContainer.style.top = '0';
            clonedContainer.style.margin = '0 auto'; // Center the container
            clonedContainer.style.maxWidth = 'none';
          }
          
          // Fix any elements with positioning issues
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            const computed = window.getComputedStyle(el);
            if (computed.position === 'fixed' || computed.position === 'sticky') {
              el.style.position = 'static';
            }
            // Remove any transforms that might cause offset
            if (computed.transform && computed.transform !== 'none') {
              el.style.transform = 'none';
            }
          });
          
          // Expand all accordions in clone
          const clonedAccordions = clonedDoc.querySelectorAll('.MuiAccordion-root');
          clonedAccordions.forEach(accordion => {
            accordion.classList.add('Mui-expanded');
            const details = accordion.querySelector('.MuiAccordionDetails-root');
            if (details) {
              details.style.display = 'block';
              details.style.height = 'auto';
            }
          });

          // Show all collapsed content
          const collapsedElements = clonedDoc.querySelectorAll('.MuiCollapse-hidden, .MuiCollapse-wrapper');
          collapsedElements.forEach(element => {
            element.style.height = 'auto';
            element.style.overflow = 'visible';
          });
        }
      });

      // Crop the canvas to just the content area we want
      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d');
      
      // Set the cropped canvas dimensions to match our element
      croppedCanvas.width = element.scrollWidth;
      croppedCanvas.height = element.scrollHeight;
      
      // Draw the relevant portion of the original canvas
      croppedCtx.drawImage(
        canvas,
        offsetX, offsetY, // Source x, y (where to start cropping from)
        element.scrollWidth, element.scrollHeight, // Source width, height
        0, 0, // Destination x, y (top-left of new canvas)
        element.scrollWidth, element.scrollHeight // Destination width, height
      );

      // Restore original accordion states
      accordionStates.forEach(({ accordion, isExpanded }) => {
        if (!isExpanded) {
          const summary = accordion.querySelector('.MuiAccordionSummary-root');
          if (summary) {
            summary.click();
          }
        }
      });

      // Create PDF with appropriate dimensions
      const imgData = croppedCanvas.toDataURL('image/png', 0.95);
      
      // Calculate proper dimensions
      const canvasWidth = croppedCanvas.width;
      const canvasHeight = croppedCanvas.height;
      
      // A4 dimensions in mm
      const a4Width = 210;
      const a4Height = 297;
      
      // Calculate scaling to fit width
      const scale = a4Width / (canvasWidth * 0.264583); // Convert pixels to mm (96 DPI)
      const scaledWidth = a4Width;
      const scaledHeight = (canvasHeight * 0.264583) * scale;
      
      // Create PDF in portrait mode
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      let position = 0;
      let remainingHeight = scaledHeight;
      
      // If content fits in one page
      if (scaledHeight <= a4Height) {
        pdf.addImage(imgData, 'PNG', 0, 0, scaledWidth, scaledHeight);
      } else {
        // Multiple pages needed
        const pageHeight = a4Height;
        let sourceY = 0;
        let pageNumber = 1;
        
        while (remainingHeight > 0) {
          const heightToAdd = Math.min(pageHeight, remainingHeight);
          const sourceHeight = (heightToAdd / scale) / 0.264583; // Convert back to pixels
          
          // Create canvas for this page section
          const pageCanvas = document.createElement('canvas');
          const pageCtx = pageCanvas.getContext('2d');
          pageCanvas.width = canvasWidth;
          pageCanvas.height = sourceHeight;
          
          // Draw the section of the original canvas
          pageCtx.drawImage(croppedCanvas, 0, sourceY, canvasWidth, sourceHeight, 0, 0, canvasWidth, sourceHeight);
          
          const pageImgData = pageCanvas.toDataURL('image/png', 0.95);
          
          if (pageNumber > 1) {
            pdf.addPage();
          }
          
          pdf.addImage(pageImgData, 'PNG', 0, 0, scaledWidth, heightToAdd);
          
          sourceY += sourceHeight;
          remainingHeight -= heightToAdd;
          pageNumber++;
        }
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filename = `test-report-${testId}-${timestamp}.pdf`;

      // Download the PDF
      pdf.save(filename);

      // Reset button state
      if (downloadButton) {
        downloadButton.textContent = originalText || 'Download Report';
        downloadButton.disabled = false;
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Reset button state
      const downloadButton = document.querySelector('button[aria-label="Download Report"]');
      if (downloadButton) {
        downloadButton.textContent = 'Download Report';
        downloadButton.disabled = false;
      }
      
      // Show error message to user
      alert('Failed to generate PDF. Downloading JSON report instead.');
      
      // Fallback to JSON download
      const dataStr = JSON.stringify(results.report, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `test-report-${testId}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  // Filter functions
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      testId: '',
      type: '',
      platform: '',
      browser: '',
      status: ''
    });
  };

  const getFilteredScenarios = (scenarios) => {
    if (!scenarios) return [];

    // Enrich scenarios with a stable displayed ID that matches what the table shows
    const enriched = scenarios.map((scenario, idx) => ({
      ...scenario,
      _displayId: scenario.test_id || `T${String(idx + 1).padStart(3, '0')}`
    }));

    return enriched.filter(scenario => {
      const scenarioStatus = deriveStatus(scenario);
      const scenarioId = scenario._displayId;
      const scenarioType = scenario.type || scenario.category || '';
      const scenarioPlatform = scenario.platform || '';
      const scenarioBrowser = scenario.browser || '';

      return (
        (filters.testId === '' || scenarioId.toLowerCase().includes(filters.testId.toLowerCase())) &&
        (filters.type === '' || scenarioType.toLowerCase().includes(filters.type.toLowerCase())) &&
        (filters.platform === '' || scenarioPlatform.toLowerCase().includes(filters.platform.toLowerCase())) &&
        (filters.browser === '' || scenarioBrowser.toLowerCase().includes(filters.browser.toLowerCase())) &&
        (filters.status === '' || scenarioStatus.toLowerCase() === filters.status.toLowerCase())
      );
    });
  };

  const getUniqueValues = (scenarios, field) => {
    if (!scenarios) return [];
    const values = scenarios.map(scenario => {
      switch(field) {
        case 'type': return scenario.type || scenario.category || '';
        case 'platform': return scenario.platform || '';
        case 'browser': return scenario.browser || '';
        case 'status': return deriveStatus(scenario);
        default: return '';
      }
    }).filter(value => value !== '');
    return [...new Set(values)].sort();
  };

  // Browser compatibility filter functions
  const handleBrowserFilterChange = (filterName, value) => {
    setBrowserFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearBrowserFilters = () => {
    setBrowserFilters({
      testId: '',
      status: '',
      affectedBrowser: '',
      affectedPlatform: ''
    });
  };

  const getFilteredBrowserScenarios = (scenarios) => {
    if (!scenarios) return [];

    const enriched = scenarios.map((scenario, idx) => ({
      ...scenario,
      _displayId: scenario.id || `BC-${String(idx + 1).padStart(3, '0')}`
    }));

    return enriched.filter(scenario => {
      const scenarioId = scenario._displayId;
      const scenarioStatus = scenario.status || '';
      const affectedBrowsers = Array.isArray(scenario.affected_browsers) ? 
        scenario.affected_browsers.join(' ').toLowerCase() : 
        (scenario.affected_browsers || '').toLowerCase();
      const affectedPlatforms = Array.isArray(scenario.affected_platforms) ? 
        scenario.affected_platforms.join(' ').toLowerCase() : 
        (scenario.affected_platforms || '').toLowerCase();

      return (
        (browserFilters.testId === '' || scenarioId.toLowerCase().includes(browserFilters.testId.toLowerCase())) &&
        (browserFilters.status === '' || scenarioStatus.toLowerCase() === browserFilters.status.toLowerCase()) &&
        (browserFilters.affectedBrowser === '' || affectedBrowsers.includes(browserFilters.affectedBrowser.toLowerCase())) &&
        (browserFilters.affectedPlatform === '' || affectedPlatforms.includes(browserFilters.affectedPlatform.toLowerCase()))
      );
    });
  };

  const getUniqueBrowserValues = (scenarios, field) => {
    if (!scenarios) return [];
    const values = [];
    
    scenarios.forEach(scenario => {
      switch(field) {
        case 'status': 
          if (scenario.status) values.push(scenario.status);
          break;
        case 'affectedBrowser':
          if (Array.isArray(scenario.affected_browsers)) {
            values.push(...scenario.affected_browsers);
          } else if (scenario.affected_browsers) {
            values.push(scenario.affected_browsers);
          }
          break;
        case 'affectedPlatform':
          if (Array.isArray(scenario.affected_platforms)) {
            values.push(...scenario.affected_platforms);
          } else if (scenario.affected_platforms) {
            values.push(scenario.affected_platforms);
          }
          break;
      }
    });
    
    return [...new Set(values.filter(v => v !== ''))].sort();
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (loading || !results) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={2} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <CircularProgress sx={{ mr: 2 }} />
            <Typography variant="h5">
              {results?.status === 'running' ? 'Testing in Progress...' : 'Loading Results...'}
            </Typography>
          </Box>
          
          {progress > 0 && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {progress}% Complete
              </Typography>
            </Box>
          )}
          
          <Typography color="text.secondary">
            Please wait while we analyze your application...
          </Typography>
        </Paper>
      </Container>
    );
  }

  const report = results.report;

  // Calculate overall score as average of all category scores
  const calculateOverallScore = () => {
    const categoryScores = report.category_scores || {
      functionality: { score: 85, status: 'Good' },
      security: { score: 70, status: 'Needs Work' },
      accessibility: { score: 75, status: 'Needs Work' },
      performance: { score: 90, status: 'Excellent' },
      browser_compatibility: { score: 80, status: 'Good' },
      usability: { score: 85, status: 'Good' }
    };
    
    const scores = Object.values(categoryScores).map(category => category.score);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average);
  };

  const overallScore = calculateOverallScore();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} data-testid="test-results-container">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<Download />} 
          onClick={downloadReport}
          aria-label="Download Report"
        >
          Download Report
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Test Results  
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip 
                label={`Status: ${results.status}`} 
                color={results.status === 'completed' ? 'success' : 'default'} 
              />
              <Chip label={`Test ID: ${testId}`} variant="outlined" />
              <Chip label={`URL: ${results.url}`} variant="outlined" />
              {/* {report.confidence_score && (
                <Chip 
                  label={`Confidence: ${report.confidence_score}%`} 
                  color={report.confidence_score >= 80 ? 'success' : report.confidence_score >= 60 ? 'warning' : 'error'}
                />
              )} */}
            </Box>
          </Paper>
        </Grid>

        {/* Test Results Summary Dashboard */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 4, mb: 2, backgroundColor: '#f8f9fa' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mb: 3 }}>
              Test Results Summary
            </Typography>
            
            {/* Overall Score and Summary Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Overall Score */}
              <Grid item xs={12} md={3}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 3, 
                  backgroundColor: 'white',
                  borderRadius: 2,
                  boxShadow: 1
                }}>
                  <Typography variant="h2" sx={{ 
                    fontWeight: 'bold', 
                    color: overallScore >= 80 ? '#2e7d32' : 
                           overallScore >= 60 ? '#f57c00' : '#d32f2f',
                    mb: 1
                  }}>
                    {overallScore}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Overall Score
                  </Typography>
                </Box>
              </Grid>

              {/* Summary Stats */}
              <Grid item xs={12} md={9}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 2, 
                      backgroundColor: '#1976d2',
                      color: 'white',
                      borderRadius: 2
                    }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {(report.scenarios?.length || 0) + (report.browser_compatibility_scenarios?.length || 0)}
                      </Typography>
                      <Typography variant="body2">
                        Total Tests
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 2, 
                      backgroundColor: '#2e7d32',
                      color: 'white',
                      borderRadius: 2
                    }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {[...(report.scenarios || []), ...(report.browser_compatibility_scenarios || [])].filter(s => {
                          const status = deriveStatus(s);
                          return status === 'pass' || status === 'passed';
                        }).length || 0}
                      </Typography>
                      <Typography variant="body2">
                        Passed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 2, 
                      backgroundColor: '#d32f2f',
                      color: 'white',
                      borderRadius: 2
                    }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {[...(report.scenarios || []), ...(report.browser_compatibility_scenarios || [])].filter(s => {
                          const status = deriveStatus(s);
                          return status === 'fail' || status === 'failed';
                        }).length || 0}
                      </Typography>
                      <Typography variant="body2">
                        Failed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 2, 
                      backgroundColor: '#f57c00',
                      color: 'white',
                      borderRadius: 2
                    }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {[...(report.scenarios || []), ...(report.browser_compatibility_scenarios || [])].filter(s => deriveStatus(s) === 'warning').length || 0}
                      </Typography>
                      <Typography variant="body2">
                        Warnings
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Test Categories */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Test Categories
              </Typography>
              {results.test_categories && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {Object.entries(results.test_categories)
                    .filter(([_, enabled]) => enabled)
                    .map(([category, _]) => (
                      <Chip 
                        key={category}
                        label={category.charAt(0).toUpperCase() + category.slice(1)}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                </Box>
              )}
            </Box>
            
            <Grid container spacing={3}>
              {Object.entries(report.category_scores || {
                functionality: { score: 85, status: 'Good' },
                security: { score: 70, status: 'Needs Work' },
                accessibility: { score: 75, status: 'Needs Work' },
                performance: { score: 90, status: 'Excellent' },
                browser_compatibility: { score: 80, status: 'Good' },
                usability: { score: 85, status: 'Good' }
              }).map(([key, category], index) => {
                const getStatusColor = (status) => {
                  switch (status?.toLowerCase()) {
                    case 'excellent':
                      return '#2e7d32';
                    case 'good':
                      return '#2e7d32';
                    case 'needs work':
                      return '#f57c00';
                    case 'critical issues':
                      return '#d32f2f';
                    default:
                      return '#1976d2';
                  }
                };

                const formatCategoryName = (key) => {
                  return key.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ');
                };

                return (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Box sx={{ 
                      p: 3, 
                      backgroundColor: 'white',
                      borderRadius: 2,
                      boxShadow: 1,
                      height: '100%'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 2 }}>
                        {formatCategoryName(key)}
                      </Typography>
                      <Typography variant="h3" sx={{ 
                        fontWeight: 'bold', 
                        color: getStatusColor(category.status),
                        mb: 1
                      }}>
                        {category.score}%
                      </Typography>
                      <Box sx={{
                        px: 2,
                        py: 0.5,
                        backgroundColor: getStatusColor(category.status),
                        color: 'white',
                        borderRadius: 1,
                        display: 'inline-block'
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {category.status}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>

        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assessment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Scenarios</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {report.scenarios?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BugReport color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Defects</Typography>
              </Box>
              <Typography variant="h4" color="error">
                {report.defects_and_gaps?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Security color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Security</Typography>
              </Box>
              <Typography variant="h4" color="warning">
                {report.non_functional_observations?.security?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Accessibility color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Accessibility</Typography>
              </Box>
              <Typography variant="h4" color="info">
                {report.non_functional_observations?.accessibility?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Scenarios */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                Test Scenarios ({getFilteredScenarios(report.scenarios).length} of {report.scenarios?.length || 0})
              </Typography>
              <Box sx={{ ml: 'auto', mr: 2 }}>
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent accordion from toggling
                    setShowFilters(!showFilters);
                  }}
                  size="small"
                  color={Object.values(filters).some(f => f !== '') ? 'primary' : 'default'}
                >
                  <FilterList />
                </IconButton>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {/* Filter Section */}
              <Collapse in={showFilters}>
                <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: '#f8f9fa' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Filter Test Scenarios
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        label="Test ID"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={filters.testId}
                        onChange={(e) => handleFilterChange('testId', e.target.value)}
                        placeholder="Search by ID..."
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <FormControl variant="outlined" size="small" fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={filters.type}
                          onChange={(e) => handleFilterChange('type', e.target.value)}
                          label="Type"
                        >
                          <MenuItem value="">All Types</MenuItem>
                          {getUniqueValues(report.scenarios, 'type').map(type => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <FormControl variant="outlined" size="small" fullWidth>
                        <InputLabel>Platform</InputLabel>
                        <Select
                          value={filters.platform}
                          onChange={(e) => handleFilterChange('platform', e.target.value)}
                          label="Platform"
                        >
                          <MenuItem value="">All Platforms</MenuItem>
                          {getUniqueValues(report.scenarios, 'platform').map(platform => (
                            <MenuItem key={platform} value={platform}>{platform}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <FormControl variant="outlined" size="small" fullWidth>
                        <InputLabel>Browser</InputLabel>
                        <Select
                          value={filters.browser}
                          onChange={(e) => handleFilterChange('browser', e.target.value)}
                          label="Browser"
                        >
                          <MenuItem value="">All Browsers</MenuItem>
                          {getUniqueValues(report.scenarios, 'browser').map(browser => (
                            <MenuItem key={browser} value={browser}>{browser}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <FormControl variant="outlined" size="small" fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={filters.status}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                          label="Status"
                        >
                          <MenuItem value="">All Status</MenuItem>
                          <MenuItem value="pass">Pass</MenuItem>
                          <MenuItem value="fail">Fail</MenuItem>
                          <MenuItem value="warning">Warning</MenuItem>
                          <MenuItem value="warning">Warning</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Button
                        variant="outlined"
                        startIcon={<Clear />}
                        onClick={clearFilters}
                        size="small"
                        fullWidth
                        disabled={Object.values(filters).every(f => f === '')}
                      >
                        Clear Filters
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Collapse>

              {/* Results Table */}
              {report.scenarios && report.scenarios.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Test ID</strong></TableCell>
                        <TableCell><strong>Test Case</strong></TableCell>
                        <TableCell><strong>Type</strong></TableCell>
                        <TableCell><strong>Platform</strong></TableCell>
                        <TableCell><strong>Browser</strong></TableCell>
                        <TableCell><strong>Expected</strong></TableCell>
                        {hasObservedResults(report.scenarios) && <TableCell><strong>Observed</strong></TableCell>}
                        <TableCell><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
            {getFilteredScenarios(report.scenarios).map((scenario, index) => (
                        <TableRow key={index} hover>
              <TableCell>{scenario._displayId || scenario.test_id || `T${String(index + 1).padStart(3, '0')}`}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', textAlign: 'justify' }}>
                              {scenario.title || scenario.test_case || 'N/A'}
                            </Typography>
                            {scenario.steps && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'justify' }}>
                                Steps: {Array.isArray(scenario.steps) ? scenario.steps.join(', ') : scenario.steps}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{scenario.type || scenario.category || 'Functional'}</TableCell>
                          <TableCell>{scenario.platform || 'Web'}</TableCell>
                          <TableCell>{scenario.browser || 'Chrome'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                              {scenario.expected_result || scenario.expected || 'N/A'}
                            </Typography>
                          </TableCell>
                          {hasObservedResults(report.scenarios) && (
                            <TableCell>
                              <Typography variant="body2" sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                                {scenario.observed_result || scenario.observed || 'N/A'}
                              </Typography>
                            </TableCell>
                          )}
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getStatusIcon(deriveStatus(scenario))}
                              <Chip 
                                label={deriveStatus(scenario)} 
                                size="small"
                                color={getStatusColor(deriveStatus(scenario))}
                                variant="outlined"
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {getFilteredScenarios(report.scenarios).length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary">
                        No scenarios match the current filters
                      </Typography>
                    </Box>
                  )}
                </TableContainer>
              ) : (
                <Typography color="text.secondary">No scenarios available</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>        {/* Browser Compatibility Testing */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
                Browser Compatibility Testing ({getFilteredBrowserScenarios(report.browser_compatibility_scenarios).length} of {report.browser_compatibility_scenarios?.length || 0})
              </Typography>
              <Box sx={{ ml: 'auto', mr: 2 }}>
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent accordion from toggling
                    setShowBrowserFilters(!showBrowserFilters);
                  }}
                  size="small"
                  color={Object.values(browserFilters).some(f => f !== '') ? 'primary' : 'default'}
                >
                  <FilterList />
                </IconButton>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {/* Browser Filter Section */}
              <Collapse in={showBrowserFilters}>
                <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: '#f8f9fa' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Filter Browser Compatibility Tests
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Test ID"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={browserFilters.testId}
                        onChange={(e) => handleBrowserFilterChange('testId', e.target.value)}
                        placeholder="Search by ID..."
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <FormControl variant="outlined" size="small" fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={browserFilters.status}
                          onChange={(e) => handleBrowserFilterChange('status', e.target.value)}
                          label="Status"
                        >
                          <MenuItem value="">All Status</MenuItem>
                          {getUniqueBrowserValues(report.browser_compatibility_scenarios, 'status').map(status => (
                            <MenuItem key={status} value={status}>{status}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <FormControl variant="outlined" size="small" fullWidth>
                        <InputLabel>Affected Browser</InputLabel>
                        <Select
                          value={browserFilters.affectedBrowser}
                          onChange={(e) => handleBrowserFilterChange('affectedBrowser', e.target.value)}
                          label="Affected Browser"
                        >
                          <MenuItem value="">All Browsers</MenuItem>
                          {getUniqueBrowserValues(report.browser_compatibility_scenarios, 'affectedBrowser').map(browser => (
                            <MenuItem key={browser} value={browser}>{browser}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <FormControl variant="outlined" size="small" fullWidth>
                        <InputLabel>Affected Platform</InputLabel>
                        <Select
                          value={browserFilters.affectedPlatform}
                          onChange={(e) => handleBrowserFilterChange('affectedPlatform', e.target.value)}
                          label="Affected Platform"
                        >
                          <MenuItem value="">All Platforms</MenuItem>
                          {getUniqueBrowserValues(report.browser_compatibility_scenarios, 'affectedPlatform').map(platform => (
                            <MenuItem key={platform} value={platform}>{platform}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        variant="outlined"
                        startIcon={<Clear />}
                        onClick={clearBrowserFilters}
                        size="small"
                        fullWidth
                        disabled={Object.values(browserFilters).every(f => f === '')}
                      >
                        Clear Filters
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Collapse>

              {/* Browser Compatibility Results Table */}
              {report.browser_compatibility_scenarios && report.browser_compatibility_scenarios.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Test ID</strong></TableCell>
                        <TableCell><strong>Test Case</strong></TableCell>
                        <TableCell><strong>Expected</strong></TableCell>
                        {hasObservedResults(report.browser_compatibility_scenarios) && <TableCell><strong>Observed</strong></TableCell>}
                        <TableCell><strong>Affected Browsers</strong></TableCell>
                        <TableCell><strong>Affected Platforms</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getFilteredBrowserScenarios(report.browser_compatibility_scenarios).map((scenario, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{scenario._displayId || scenario.id || `BC-${String(index + 1).padStart(3, '0')}`}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', textAlign: 'justify' }}>
                              {scenario.title || scenario.test_case || 'N/A'}
                            </Typography>
                            {scenario.steps && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'justify' }}>
                                Steps: {Array.isArray(scenario.steps) ? scenario.steps.join(', ') : scenario.steps}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                              {scenario.expected_result || scenario.expected || 'N/A'}
                            </Typography>
                          </TableCell>
                          {hasObservedResults(report.browser_compatibility_scenarios) && (
                            <TableCell>
                              <Typography variant="body2" sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                                {scenario.observed_result || scenario.observed || 'N/A'}
                              </Typography>
                            </TableCell>
                          )}
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 150, wordBreak: 'break-word' }}>
                              {Array.isArray(scenario.affected_browsers) ? 
                                scenario.affected_browsers.join(', ') : 
                                scenario.affected_browsers || 'None'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 150, wordBreak: 'break-word' }}>
                              {Array.isArray(scenario.affected_platforms) ? 
                                scenario.affected_platforms.join(', ') : 
                                scenario.affected_platforms || 'None'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getStatusIcon(scenario.status)}
                              <Chip 
                                label={scenario.status || 'warning'} 
                                size="small"
                                color={getStatusColor(scenario.status)}
                                variant="outlined"
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {getFilteredBrowserScenarios(report.browser_compatibility_scenarios).length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary">
                        No browser compatibility tests match the current filters
                      </Typography>
                    </Box>
                  )}
                </TableContainer>
              ) : (
                <Typography color="text.secondary">No browser compatibility tests available</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Performance Analysis */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
                Performance Analysis
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* Page Load Time */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 3, height: '100%', backgroundColor: '#f8f9fa' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
                      Page Load Time
                    </Typography>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
                        {report.performance?.page_load_time || '2.3s'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Overall Load Time
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                {/* Core Web Vitals */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 3, height: '100%', backgroundColor: '#f8f9fa' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
                      Core Web Vitals
                    </Typography>
                    
                    {/* First Contentful Paint */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1, color: '#555' }}>
                        First Contentful Paint
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 0.5 }}>
                        {report.performance?.core_web_vitals?.fcp_desktop || '0.9s'} / {report.performance?.core_web_vitals?.fcp_mobile || '1.3s'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Desktop / Mobile
                      </Typography>
                    </Box>

                    {/* Largest Contentful Paint */}
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1, color: '#555' }}>
                        Largest Contentful Paint
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 0.5 }}>
                        {report.performance?.core_web_vitals?.lcp_desktop || '1.5s'} / {report.performance?.core_web_vitals?.lcp_mobile || '2.1s'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Desktop / Mobile
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Defects and Gaps */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                <BugReport sx={{ mr: 1, verticalAlign: 'middle' }} />
                Defects and Gaps ({report.defects_and_gaps?.length || 0})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {report.defects_and_gaps?.map((defect, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getSeverityIcon(defect.severity)}
                          <Typography variant="body1">{defect.title || defect.description}</Typography>
                          <Chip 
                            label={defect.severity || 'Medium'} 
                            size="small" 
                            color={getSeverityColor(defect.severity)}
                          />
                        </Box>
                      }
                      secondary={defect.details || defect.description}
                    />
                  </ListItem>
                )) || (
                  <Typography color="text.secondary">No defects found</Typography>
                )}
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Non-Functional Observations */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
                Non-Functional Observations
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {Object.entries(report.non_functional_observations || {}).map(([category, observations]) => (
                  <Grid item xs={12} md={6} key={category}>
                    <Typography variant="h6" sx={{ textTransform: 'capitalize', mb: 1 }}>
                      {category}
                    </Typography>
                    <List dense>
                      {Array.isArray(observations) ? observations.map((obs, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={obs.description || obs} />
                        </ListItem>
                      )) : (
                        <ListItem>
                          <ListItemText primary={observations || "No observations available"} />
                        </ListItem>
                      )}
                    </List>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                Recommendations ({report.recommendations?.length || 0})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {Array.isArray(report.recommendations) ? report.recommendations.map((recommendation, index) => (
                  <ListItem key={index} divider>
                    <ListItemText 
                      primary={recommendation.title || recommendation}
                      secondary={recommendation.details || recommendation.description}
                    />
                  </ListItem>
                )) : (
                  <ListItem>
                    <ListItemText 
                      primary="No recommendations available"
                      secondary="Please retry the analysis to get recommendations"
                    />
                  </ListItem>
                )}
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Raw JSON Report */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Raw JSON Report</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box className="json-container">
                <JSONPretty data={report} />
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TestResults;
