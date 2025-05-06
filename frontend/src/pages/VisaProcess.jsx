import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Rating,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  VideoCall as VideoCallIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';

const VisaProcess = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [checklist, setChecklist] = useState([]);
  const [mockInterviews, setMockInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openInterviewDialog, setOpenInterviewDialog] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
  const { enqueueSnackbar } = useSnackbar();

  const steps = [
    '准备阶段',
    '申请材料',
    '预约面签',
    '模拟面签',
    '正式面签',
    '签证结果'
  ];

  useEffect(() => {
    fetchChecklist();
    fetchMockInterviews();
    fetchApplicationStatus();
  }, []);

  const fetchApplicationStatus = async () => {
    try {
      const response = await axios.get('/api/visa/application-status');
      setApplicationStatus(response.data);
      // 根据完成步骤更新当前步骤
      const completedSteps = response.data.completed_steps;
      const currentStepIndex = steps.findIndex(step => 
        !completedSteps.includes(step.toLowerCase().replace(/\s+/g, '_'))
      );
      setActiveStep(currentStepIndex >= 0 ? currentStepIndex : steps.length - 1);
    } catch (err) {
      enqueueSnackbar('Failed to fetch application status', { variant: 'error' });
    }
  };

  const fetchChecklist = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/visa/checklist', {
        params: { category: selectedCategory !== 'all' ? selectedCategory : undefined }
      });
      setChecklist(response.data);
    } catch (err) {
      enqueueSnackbar('Failed to fetch checklist', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMockInterviews = async () => {
    try {
      const response = await axios.get('/api/visa/mock-interviews');
      setMockInterviews(response.data);
    } catch (err) {
      enqueueSnackbar('Failed to fetch mock interviews', { variant: 'error' });
    }
  };

  const handleChecklistItemToggle = async (itemId) => {
    try {
      await axios.put(`/api/visa/checklist/${itemId}/toggle`);
      fetchChecklist();
      fetchApplicationStatus(); // 更新申请状态
    } catch (err) {
      enqueueSnackbar('Failed to update checklist item', { variant: 'error' });
    }
  };

  const handleStartMockInterview = (interview) => {
    setSelectedInterview(interview);
    setOpenInterviewDialog(true);
  };

  const handleCloseInterviewDialog = () => {
    setOpenInterviewDialog(false);
    setSelectedInterview(null);
    setFeedback({ rating: 0, comment: '' });
  };

  const handleSubmitFeedback = async () => {
    try {
      await axios.post(`/api/visa/mock-interviews/${selectedInterview.id}/feedback`, {
        rating: feedback.rating,
        feedback: feedback.comment
      });
      enqueueSnackbar('Feedback submitted successfully', { variant: 'success' });
      handleCloseInterviewDialog();
    } catch (err) {
      enqueueSnackbar('Failed to submit feedback', { variant: 'error' });
    }
  };

  const renderApplicationStatus = () => (
    <Paper sx={{ p: 2, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        申请状态
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                当前进度
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(applicationStatus?.completed_steps.length / steps.length) * 100} 
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="textSecondary">
                已完成 {applicationStatus?.completed_steps.length} / {steps.length} 个步骤
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                下一步
              </Typography>
              <Typography variant="body1">
                {applicationStatus?.current_step}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                截止日期: {new Date(applicationStatus?.next_deadline).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );

  const renderChecklist = () => (
    <Paper sx={{ p: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          签证申请清单
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>类别</InputLabel>
          <Select
            value={selectedCategory}
            label="类别"
            onChange={(e) => setSelectedCategory(e.target.value)}
            size="small"
          >
            <MenuItem value="all">全部</MenuItem>
            <MenuItem value="documents">文档准备</MenuItem>
            <MenuItem value="appointment">预约</MenuItem>
            <MenuItem value="interview">面签</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <List>
        {checklist.map((item) => (
          <ListItem 
            key={item.id}
            sx={{
              bgcolor: item.completed ? 'action.hover' : 'transparent',
              borderRadius: 1,
              mb: 1
            }}
          >
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={item.completed}
                onChange={() => handleChecklistItemToggle(item.id)}
              />
            </ListItemIcon>
            <ListItemText
              primary={item.title}
              secondary={
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    {item.description}
                  </Typography>
                  {item.deadline && (
                    <Typography variant="caption" color="error">
                      截止日期: {new Date(item.deadline).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              }
            />
            <Chip
              label={item.category}
              color="primary"
              size="small"
              sx={{ ml: 1 }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  const renderMockInterviews = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        模拟面签
      </Typography>
      <Grid container spacing={2}>
        {mockInterviews.map((interview) => (
          <Grid item xs={12} md={4} key={interview.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {interview.title}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {interview.description}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={<ScheduleIcon />}
                    label={`时长: ${interview.duration}分钟`}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    icon={<SchoolIcon />}
                    label={interview.level}
                    size="small"
                  />
                </Box>
                <Button
                  variant="contained"
                  startIcon={<VideoCallIcon />}
                  onClick={() => handleStartMockInterview(interview)}
                  sx={{ mt: 2 }}
                >
                  开始模拟面签
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );

  const renderInterviewDialog = () => (
    <Dialog
      open={openInterviewDialog}
      onClose={handleCloseInterviewDialog}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        模拟面签 - {selectedInterview?.title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            面签准备
          </Typography>
          <List>
            {selectedInterview?.preparationSteps.map((step, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={step} />
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            常见问题
          </Typography>
          <List>
            {selectedInterview?.commonQuestions.map((question, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <AssignmentIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={question.question}
                  secondary={question.answer}
                />
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            面试反馈
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography component="legend">评分</Typography>
            <Rating
              value={feedback.rating}
              onChange={(event, newValue) => {
                setFeedback(prev => ({ ...prev, rating: newValue }));
              }}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="反馈意见"
              value={feedback.comment}
              onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
              sx={{ mt: 2 }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseInterviewDialog}>关闭</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            window.open(selectedInterview?.interviewUrl, '_blank');
          }}
        >
          开始视频面试
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleSubmitFeedback}
          disabled={!feedback.rating}
        >
          提交反馈
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          签证申请流程
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderApplicationStatus()}
        {renderChecklist()}
        {renderMockInterviews()}
        {renderInterviewDialog()}
      </Box>
    </Container>
  );
};

export default VisaProcess; 