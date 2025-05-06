import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import axios from 'axios';

function Progress() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalItems: 0,
    completedItems: 0,
    completionRate: 0,
  });
  const [schoolProgress, setSchoolProgress] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      const [statsResponse, schoolsResponse, activityResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/checklists/stats/summary`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/checklists/schools/progress`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/checklists/activity`),
      ]);

      setStats(statsResponse.data);
      setSchoolProgress(schoolsResponse.data);
      setRecentActivity(activityResponse.data);
    } catch (error) {
      console.error('Error fetching progress data:', error);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Progress Overview
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Overall Progress */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Overall Progress
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Completion Rate
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Box sx={{ flexGrow: 1, mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={stats.completionRate}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {stats.completionRate}%
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total Schools
                </Typography>
                <Typography variant="h4">{stats.totalSchools}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total Items
                </Typography>
                <Typography variant="h4">{stats.totalItems}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Completed Items
                </Typography>
                <Typography variant="h4">{stats.completedItems}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              {recentActivity.map((activity, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      {activity.type === 'completion' ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <AssignmentIcon />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.description}
                      secondary={new Date(activity.timestamp).toLocaleString()}
                    />
                  </ListItem>
                  {index < recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* School Progress */}
      <Typography variant="h5" gutterBottom>
        School Progress
      </Typography>
      <Grid container spacing={3}>
        {schoolProgress.map((school) => (
          <Grid item xs={12} md={6} key={school.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SchoolIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">{school.name}</Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Progress
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Box sx={{ flexGrow: 1, mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={school.completionRate}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {school.completionRate}%
                    </Typography>
                  </Box>
                </Box>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Items
                    </Typography>
                    <Typography variant="h6">{school.totalItems}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                    <Typography variant="h6">{school.completedItems}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Progress; 