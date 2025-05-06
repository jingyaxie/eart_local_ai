import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Description as DescriptionIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalStorage: 0,
    activeCourses: 0,
    pendingTasks: 0,
    recentActivities: [],
    storageUsage: {
      used: 0,
      total: 0,
    },
    courseProgress: [],
    taskCompletion: {
      completed: 0,
      total: 0,
    },
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/dashboard`
      );
      setStats(response.data);
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
      setError('加载仪表板数据失败');
    } finally {
      setLoading(false);
    }
  };

  const formatStorageSize = (bytes) => {
    const sizes = ['字节', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 字节';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          仪表板
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
        >
          刷新
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">存储空间</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {formatStorageSize(stats.totalStorage)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(stats.storageUsage.used / stats.storageUsage.total) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                已使用 {formatStorageSize(stats.storageUsage.used)} / {formatStorageSize(stats.storageUsage.total)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">文件</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {stats.totalFiles}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                已上传文件总数
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">课程</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {stats.activeCourses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                活跃课程数
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">任务</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {stats.pendingTasks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                待处理任务数
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="课程进度"
              action={
                <IconButton>
                  <TimelineIcon />
                </IconButton>
              }
            />
            <CardContent>
              <List>
                {stats.courseProgress.map((course) => (
                  <React.Fragment key={course.id}>
                    <ListItem>
                      <ListItemText
                        primary={course.name}
                        secondary={`完成度 ${course.progress}%`}
                      />
                      <LinearProgress
                        variant="determinate"
                        value={course.progress}
                        sx={{ width: 100, height: 8, borderRadius: 4 }}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="任务完成情况"
              action={
                <IconButton>
                  <CheckCircleIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  总体进度
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(stats.taskCompletion.completed / stats.taskCompletion.total) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  已完成 {stats.taskCompletion.completed} / {stats.taskCompletion.total} 个任务
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="最近活动"
              action={
                <IconButton>
                  <TimelineIcon />
                </IconButton>
              }
            />
            <CardContent>
              <List>
                {stats.recentActivities.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          {activity.type === 'upload' && <DescriptionIcon />}
                          {activity.type === 'course' && <SchoolIcon />}
                          {activity.type === 'task' && <AssignmentIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.description}
                        secondary={new Date(activity.timestamp).toLocaleString()}
                      />
                      {activity.trend === 'up' && <TrendingUpIcon color="success" />}
                      {activity.trend === 'down' && <TrendingDownIcon color="error" />}
                    </ListItem>
                    {index < stats.recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 