import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Chat as ChatIcon,
  Book as BookIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';

function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalItems: 0,
    completedItems: 0,
    completionRate: 0,
  });
  const [recentChats, setRecentChats] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, chatsResponse, tasksResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/checklists/stats/summary`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/chat/history?limit=5`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/checklists/upcoming`),
        ]);

        setStats(statsResponse.data);
        setRecentChats(chatsResponse.data);
        setUpcomingTasks(tasksResponse.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back!
      </Typography>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography color="text.secondary" gutterBottom>
              Total Schools
            </Typography>
            <Typography variant="h4" component="div">
              {stats.totalSchools}
            </Typography>
            <SchoolIcon sx={{ color: 'primary.main', mt: 1 }} />
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography color="text.secondary" gutterBottom>
              Total Items
            </Typography>
            <Typography variant="h4" component="div">
              {stats.totalItems}
            </Typography>
            <AssignmentIcon sx={{ color: 'primary.main', mt: 1 }} />
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography color="text.secondary" gutterBottom>
              Completed Items
            </Typography>
            <Typography variant="h4" component="div">
              {stats.completedItems}
            </Typography>
            <CheckCircleIcon sx={{ color: 'success.main', mt: 1 }} />
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography color="text.secondary" gutterBottom>
              Completion Rate
            </Typography>
            <Typography variant="h4" component="div">
              {stats.completionRate}%
            </Typography>
            <BookIcon sx={{ color: 'primary.main', mt: 1 }} />
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity and Upcoming Tasks */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Chats
              </Typography>
              <List>
                {recentChats.map((chat) => (
                  <React.Fragment key={chat.id}>
                    <ListItem>
                      <ListItemIcon>
                        <ChatIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={chat.title}
                        secondary={new Date(chat.created_at).toLocaleDateString()}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary">
                View All Chats
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Tasks
              </Typography>
              <List>
                {upcomingTasks.map((task) => (
                  <React.Fragment key={task.id}>
                    <ListItem>
                      <ListItemIcon>
                        {task.is_completed ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <WarningIcon color="warning" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={`Due: ${new Date(
                          task.due_date
                        ).toLocaleDateString()}`}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary">
                View All Tasks
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default StudentDashboard; 