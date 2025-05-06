import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Tooltip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import axios from 'axios';

function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    notifications: true,
    preferences: true,
    ai: true,
    advanced: false,
  });
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      chat: true,
      digest: false,
      digestFrequency: 'daily',
      quietHours: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      fontSize: 'medium',
      compactMode: false,
    },
    ai: {
      defaultModel: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      stopSequences: [],
      systemPrompt: '',
    },
    advanced: {
      cacheEnabled: true,
      cacheSize: 1000,
      autoSave: true,
      autoSaveInterval: 5,
      debugMode: false,
      analyticsEnabled: true,
      performanceMode: 'balanced',
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/users/settings`
      );
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (type) => (event) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [type]: event.target.checked,
      },
    });
  };

  const handlePreferenceChange = (type) => (event) => {
    setSettings({
      ...settings,
      preferences: {
        ...settings.preferences,
        [type]: event.target.value,
      },
    });
  };

  const handleAIChange = (type) => (event) => {
    setSettings({
      ...settings,
      ai: {
        ...settings.ai,
        [type]: event.target.value,
      },
    });
  };

  const handleAdvancedChange = (type) => (event) => {
    setSettings({
      ...settings,
      advanced: {
        ...settings.advanced,
        [type]: event.target.checked,
      },
    });
  };

  const handleSliderChange = (section, type) => (event, newValue) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [type]: newValue,
      },
    });
  };

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/users/settings`,
        settings
      );
      setSuccess('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const renderSectionHeader = (title, section) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
      }}
      onClick={() => toggleSection(section)}
    >
      <Typography variant="h6">{title}</Typography>
      {expandedSections[section] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            {renderSectionHeader('Notifications', 'notifications')}
            <Collapse in={expandedSections.notifications}>
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.email}
                      onChange={handleNotificationChange('email')}
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.push}
                      onChange={handleNotificationChange('push')}
                    />
                  }
                  label="Push Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.chat}
                      onChange={handleNotificationChange('chat')}
                    />
                  }
                  label="Chat Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.digest}
                      onChange={handleNotificationChange('digest')}
                    />
                  }
                  label="Email Digest"
                />
                {settings.notifications.digest && (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Digest Frequency</InputLabel>
                    <Select
                      value={settings.notifications.digestFrequency}
                      onChange={handleNotificationChange('digestFrequency')}
                      label="Digest Frequency"
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                )}
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.quietHours}
                      onChange={handleNotificationChange('quietHours')}
                    />
                  }
                  label="Quiet Hours"
                />
                {settings.notifications.quietHours && (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Start Time"
                        value={settings.notifications.quietHoursStart}
                        onChange={handleNotificationChange('quietHoursStart')}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="End Time"
                        value={settings.notifications.quietHoursEnd}
                        onChange={handleNotificationChange('quietHoursEnd')}
                      />
                    </Grid>
                  </Grid>
                )}
              </Box>
            </Collapse>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            {renderSectionHeader('Preferences', 'preferences')}
            <Collapse in={expandedSections.preferences}>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Theme</InputLabel>
                    <Select
                      value={settings.preferences.theme}
                      onChange={handlePreferenceChange('theme')}
                      label="Theme"
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="system">System</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={settings.preferences.language}
                      onChange={handlePreferenceChange('language')}
                      label="Language"
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Spanish</MenuItem>
                      <MenuItem value="fr">French</MenuItem>
                      <MenuItem value="de">German</MenuItem>
                      <MenuItem value="zh">Chinese</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={settings.preferences.timezone}
                      onChange={handlePreferenceChange('timezone')}
                      label="Timezone"
                    >
                      <MenuItem value="UTC">UTC</MenuItem>
                      <MenuItem value="EST">EST</MenuItem>
                      <MenuItem value="PST">PST</MenuItem>
                      <MenuItem value="GMT">GMT</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Date Format</InputLabel>
                    <Select
                      value={settings.preferences.dateFormat}
                      onChange={handlePreferenceChange('dateFormat')}
                      label="Date Format"
                    >
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Time Format</InputLabel>
                    <Select
                      value={settings.preferences.timeFormat}
                      onChange={handlePreferenceChange('timeFormat')}
                      label="Time Format"
                    >
                      <MenuItem value="12h">12-hour</MenuItem>
                      <MenuItem value="24h">24-hour</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Font Size</InputLabel>
                    <Select
                      value={settings.preferences.fontSize}
                      onChange={handlePreferenceChange('fontSize')}
                      label="Font Size"
                    >
                      <MenuItem value="small">Small</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="large">Large</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.preferences.compactMode}
                        onChange={handlePreferenceChange('compactMode')}
                      />
                    }
                    label="Compact Mode"
                  />
                </Grid>
              </Grid>
            </Collapse>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            {renderSectionHeader('AI Settings', 'ai')}
            <Collapse in={expandedSections.ai}>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Default Model</InputLabel>
                    <Select
                      value={settings.ai.defaultModel}
                      onChange={handleAIChange('defaultModel')}
                      label="Default Model"
                    >
                      <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                      <MenuItem value="gpt-4">GPT-4</MenuItem>
                      <MenuItem value="claude-2">Claude 2</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ px: 2 }}>
                    <Typography gutterBottom>Temperature</Typography>
                    <Slider
                      value={settings.ai.temperature}
                      onChange={handleSliderChange('ai', 'temperature')}
                      min={0}
                      max={1}
                      step={0.1}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Tokens"
                    value={settings.ai.maxTokens}
                    onChange={handleAIChange('maxTokens')}
                    inputProps={{
                      min: 100,
                      max: 4000,
                      step: 100,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ px: 2 }}>
                    <Typography gutterBottom>Top P</Typography>
                    <Slider
                      value={settings.ai.topP}
                      onChange={handleSliderChange('ai', 'topP')}
                      min={0}
                      max={1}
                      step={0.1}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ px: 2 }}>
                    <Typography gutterBottom>Frequency Penalty</Typography>
                    <Slider
                      value={settings.ai.frequencyPenalty}
                      onChange={handleSliderChange('ai', 'frequencyPenalty')}
                      min={-2}
                      max={2}
                      step={0.1}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ px: 2 }}>
                    <Typography gutterBottom>Presence Penalty</Typography>
                    <Slider
                      value={settings.ai.presencePenalty}
                      onChange={handleSliderChange('ai', 'presencePenalty')}
                      min={-2}
                      max={2}
                      step={0.1}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="System Prompt"
                    value={settings.ai.systemPrompt}
                    onChange={handleAIChange('systemPrompt')}
                    helperText="Custom instructions for the AI model"
                  />
                </Grid>
              </Grid>
            </Collapse>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            {renderSectionHeader('Advanced Settings', 'advanced')}
            <Collapse in={expandedSections.advanced}>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.advanced.cacheEnabled}
                        onChange={handleAdvancedChange('cacheEnabled')}
                      />
                    }
                    label="Enable Cache"
                  />
                  {settings.advanced.cacheEnabled && (
                    <TextField
                      fullWidth
                      type="number"
                      label="Cache Size (MB)"
                      value={settings.advanced.cacheSize}
                      onChange={handleAdvancedChange('cacheSize')}
                      sx={{ mt: 2 }}
                      inputProps={{
                        min: 100,
                        max: 10000,
                        step: 100,
                      }}
                    />
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.advanced.autoSave}
                        onChange={handleAdvancedChange('autoSave')}
                      />
                    }
                    label="Auto Save"
                  />
                  {settings.advanced.autoSave && (
                    <TextField
                      fullWidth
                      type="number"
                      label="Auto Save Interval (minutes)"
                      value={settings.advanced.autoSaveInterval}
                      onChange={handleAdvancedChange('autoSaveInterval')}
                      sx={{ mt: 2 }}
                      inputProps={{
                        min: 1,
                        max: 60,
                        step: 1,
                      }}
                    />
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.advanced.debugMode}
                        onChange={handleAdvancedChange('debugMode')}
                      />
                    }
                    label="Debug Mode"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.advanced.analyticsEnabled}
                        onChange={handleAdvancedChange('analyticsEnabled')}
                      />
                    }
                    label="Enable Analytics"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Performance Mode</InputLabel>
                    <Select
                      value={settings.advanced.performanceMode}
                      onChange={handleAdvancedChange('performanceMode')}
                      label="Performance Mode"
                    >
                      <MenuItem value="balanced">Balanced</MenuItem>
                      <MenuItem value="performance">High Performance</MenuItem>
                      <MenuItem value="battery">Battery Saver</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Collapse>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
}

export default Settings; 