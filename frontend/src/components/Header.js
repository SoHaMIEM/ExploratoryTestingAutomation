import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box,
  Chip
} from '@mui/material';
import { BugReport, Assessment } from '@mui/icons-material';

const Header = () => {
  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Automated Exploratory Testing Platform
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
