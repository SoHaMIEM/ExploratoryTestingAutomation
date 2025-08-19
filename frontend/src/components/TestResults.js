import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  TableRow
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
  ErrorOutline
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

  const deriveStatus = (scenario) => {
    // If status is already provided, use it
    if (scenario.status) {
      return scenario.status;
    }
    
    // Derive status from comparing expected vs observed results
    const expected = (scenario.expected_result || scenario.expected || '').toLowerCase().trim();
    const observed = (scenario.observed_result || scenario.observed || '').toLowerCase().trim();
    
    if (!expected || !observed) {
      return 'unknown';
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

  const downloadReport = () => {
    const dataStr = JSON.stringify(results.report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `test-report-${testId}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<Download />} 
          onClick={downloadReport}
        >
          Download Report
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Test Results for {results.url}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip 
                label={`Status: ${results.status}`} 
                color={results.status === 'completed' ? 'success' : 'default'} 
              />
              <Chip label={`Test ID: ${testId}`} variant="outlined" />
              {report.confidence_score && (
                <Chip 
                  label={`Confidence: ${report.confidence_score}%`} 
                  color={report.confidence_score >= 80 ? 'success' : report.confidence_score >= 60 ? 'warning' : 'error'}
                />
              )}
            </Box>
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
                Test Scenarios ({report.scenarios?.length || 0})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
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
                        <TableCell><strong>Observed</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.scenarios.map((scenario, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{scenario.test_id || `T${String(index + 1).padStart(3, '0')}`}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {scenario.title || scenario.test_case || 'N/A'}
                            </Typography>
                            {scenario.steps && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
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
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                              {scenario.observed_result || scenario.observed || 'N/A'}
                            </Typography>
                          </TableCell>
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
                </TableContainer>
              ) : (
                <Typography color="text.secondary">No scenarios available</Typography>
              )}
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
                      {observations?.map((obs, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={obs.description || obs} />
                        </ListItem>
                      )) || (
                        <Typography color="text.secondary">No observations</Typography>
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
                {report.recommendations?.map((recommendation, index) => (
                  <ListItem key={index} divider>
                    <ListItemText 
                      primary={recommendation.title || recommendation}
                      secondary={recommendation.details || recommendation.description}
                    />
                  </ListItem>
                )) || (
                  <Typography color="text.secondary">No recommendations available</Typography>
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
