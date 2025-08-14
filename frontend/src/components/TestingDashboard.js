import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { PlayArrow, Assessment, Security, Accessibility, Speed } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TestingDashboard = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testType, setTestType] = useState('comprehensive');
  const [browsers, setBrowsers] = useState(['chrome', 'edge']);
  const [platforms, setPlatforms] = useState(['windows', 'mac']);
  const [testCategories, setTestCategories] = useState({
    functional: true,
    accessibility: true,
    performance: true,
    security: true,
    usability: true
  });
  
  const navigate = useNavigate();

  const handleBrowserChange = (event) => {
    setBrowsers(event.target.value);
  };

  const handlePlatformChange = (event) => {
    setPlatforms(event.target.value);
  };

  const handleCategoryChange = (category) => {
    setTestCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleStartTesting = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL (include http:// or https://)');
      return;
    }

    if (browsers.length === 0) {
      setError('Please select at least one browser');
      return;
    }

    if (platforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/start-testing', {
        url: url.trim(),
        testType,
        browsers,
        platforms,
        testCategories
      });

      const { test_id } = response.data;
      navigate(`/results/${test_id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start testing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTestDescription = () => {
    const categories = Object.entries(testCategories)
      .filter(([, enabled]) => enabled)
      .map(([category]) => category);
    
    return `This will perform ${categories.join(', ')} testing on ${browsers.join(', ')} 
            browser(s) across ${platforms.join(', ')} platform(s).`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
              Start Automated Testing
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Enter a Single Page Application (SPA) URL to begin comprehensive exploratory testing.
              Our AI-powered testing platform will analyze your application across multiple dimensions.
            </Typography>

            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Application URL"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                margin="normal"
                variant="outlined"
                helperText="Enter the complete URL including protocol (http:// or https://)"
              />

              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Test Type</InputLabel>
                    <Select
                      value={testType}
                      label="Test Type"
                      onChange={(e) => setTestType(e.target.value)}
                    >
                      <MenuItem value="quick">Quick Scan (5-10 min)</MenuItem>
                      <MenuItem value="comprehensive">Comprehensive (15-30 min)</MenuItem>
                      <MenuItem value="deep">Deep Analysis (30-60 min)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Browsers</InputLabel>
                    <Select
                      multiple
                      value={browsers}
                      label="Browsers"
                      onChange={handleBrowserChange}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem value="chrome">Chrome</MenuItem>
                      <MenuItem value="edge">Edge</MenuItem>
                      <MenuItem value="firefox">Firefox</MenuItem>
                      <MenuItem value="safari">Safari</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Platforms</InputLabel>
                    <Select
                      multiple
                      value={platforms}
                      label="Platforms"
                      onChange={handlePlatformChange}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem value="windows">Windows</MenuItem>
                      <MenuItem value="mac">Mac</MenuItem>
                      <MenuItem value="android">Android</MenuItem>
                      <MenuItem value="ios">iOS</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Testing Categories
                  </Typography>
                  <FormGroup row>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={testCategories.functional}
                          onChange={() => handleCategoryChange('functional')}
                          icon={<Assessment />}
                          checkedIcon={<Assessment />}
                        />
                      }
                      label="Functional Testing"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={testCategories.accessibility}
                          onChange={() => handleCategoryChange('accessibility')}
                          icon={<Accessibility />}
                          checkedIcon={<Accessibility />}
                        />
                      }
                      label="Accessibility Testing"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={testCategories.performance}
                          onChange={() => handleCategoryChange('performance')}
                          icon={<Speed />}
                          checkedIcon={<Speed />}
                        />
                      }
                      label="Performance Testing"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={testCategories.security}
                          onChange={() => handleCategoryChange('security')}
                          icon={<Security />}
                          checkedIcon={<Security />}
                        />
                      }
                      label="Security Testing"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={testCategories.usability}
                          onChange={() => handleCategoryChange('usability')}
                        />
                      }
                      label="Usability Testing"
                    />
                  </FormGroup>
                </Grid>
              </Grid>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                <Typography variant="body2" color="text.secondary">
                  {getTestDescription()}
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                onClick={handleStartTesting}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
                sx={{ mt: 3, px: 4, py: 1.5 }}
              >
                {loading ? 'Starting Test...' : 'Start Testing'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
              Functional Testing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tests UI elements, navigation, forms, and core functionality across different scenarios.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Accessibility sx={{ mr: 1, verticalAlign: 'middle' }} />
              Accessibility Testing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Evaluates WCAG compliance, keyboard navigation, screen reader compatibility, and more.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
              Performance Testing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Analyzes page load times, responsiveness, and overall performance metrics.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TestingDashboard;
