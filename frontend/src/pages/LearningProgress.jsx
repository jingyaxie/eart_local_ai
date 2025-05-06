import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';

const LearningProgress = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [students, setStudents] = useState([]);
  const [progressData, setProgressData] = useState({
    overall: {
      completed: 0,
      inProgress: 0,
      notStarted: 0
    },
    courses: [],
    recentActivities: [],
    milestones: []
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchStudents();
    fetchProgressData();
  }, [selectedStudent]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students');
      setStudents(response.data);
    } catch (err) {
      enqueueSnackbar('Failed to fetch students', { variant: 'error' });
    }
  };

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/learning/progress', {
        params: { student_id: selectedStudent !== 'all' ? selectedStudent : undefined }
      });
      setProgressData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch progress data');
      enqueueSnackbar('Failed to fetch progress data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderOverallProgress = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Completed Courses
            </Typography>
            <Typography variant="h4">
              {progressData.overall.completed}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(progressData.overall.completed / 
                (progressData.overall.completed + 
                 progressData.overall.inProgress + 
                 progressData.overall.notStarted)) * 100}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              In Progress
            </Typography>
            <Typography variant="h4">
              {progressData.overall.inProgress}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(progressData.overall.inProgress / 
                (progressData.overall.completed + 
                 progressData.overall.inProgress + 
                 progressData.overall.notStarted)) * 100}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Not Started
            </Typography>
            <Typography variant="h4">
              {progressData.overall.notStarted}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(progressData.overall.notStarted / 
                (progressData.overall.completed + 
                 progressData.overall.inProgress + 
                 progressData.overall.notStarted)) * 100}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderCourseProgress = () => (
    <Paper sx={{ p: 2, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Course Progress
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Course</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Last Activity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {progressData.courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>{course.name}</TableCell>
                <TableCell>
                  {course.status === 'completed' ? (
                    <CheckCircleIcon color="success" />
                  ) : course.status === 'in_progress' ? (
                    <AssignmentIcon color="primary" />
                  ) : (
                    <SchoolIcon color="disabled" />
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={course.progress}
                      />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="textSecondary">
                        {`${Math.round(course.progress)}%`}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{new Date(course.lastActivity).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  const renderRecentActivities = () => (
    <Paper sx={{ p: 2, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Recent Activities
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Activity</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {progressData.recentActivities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>{activity.description}</TableCell>
                <TableCell>{activity.courseName}</TableCell>
                <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Typography
                    color={
                      activity.status === 'completed'
                        ? 'success.main'
                        : activity.status === 'in_progress'
                        ? 'primary.main'
                        : 'text.secondary'
                    }
                  >
                    {activity.status}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  const renderMilestones = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Learning Milestones
      </Typography>
      <Grid container spacing={2}>
        {progressData.milestones.map((milestone) => (
          <Grid item xs={12} md={4} key={milestone.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {milestone.title}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {milestone.description}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={milestone.progress}
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {`${Math.round(milestone.progress)}% Complete`}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Learning Progress
          </Typography>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select Student</InputLabel>
            <Select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              label="Select Student"
            >
              <MenuItem value="all">All Students</MenuItem>
              {students.map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {renderOverallProgress()}
        {renderCourseProgress()}
        {renderRecentActivities()}
        {renderMilestones()}
      </Box>
    </Container>
  );
};

export default LearningProgress; 