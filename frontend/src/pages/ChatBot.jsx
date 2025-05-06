import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Drawer,
  Card,
  CardContent,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as SmartToyIcon,
  History as HistoryIcon,
  Book as BookIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const messagesEndRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchSessions();
    fetchStudentProfile();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      const response = await axios.get('/api/chatbot/sessions', {
        params: { user_id: 1 } // 这里应该使用实际的用户ID
      });
      setSessions(response.data);
    } catch (err) {
      enqueueSnackbar('Failed to fetch chat sessions', { variant: 'error' });
    }
  };

  const fetchStudentProfile = async () => {
    try {
      const response = await axios.get('/api/chatbot/student-profile/1'); // 这里应该使用实际的用户ID
      setStudentProfile(response.data);
    } catch (err) {
      enqueueSnackbar('Failed to fetch student profile', { variant: 'error' });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    // 添加用户消息到列表
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    try {
      const response = await axios.post('/api/chatbot/chat', {
        message: userMessage,
        session_id: sessionId,
        context: {
          user_id: 1 // 这里应该使用实际的用户ID
        }
      });

      // 如果是新会话，更新会话ID
      if (!sessionId) {
        setSessionId(response.data.session_id);
      }

      // 添加助手响应到列表
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.message,
        knowledge_references: response.data.knowledge_references,
        timestamp: new Date()
      }]);

      // 更新会话列表
      fetchSessions();
    } catch (err) {
      enqueueSnackbar('Failed to send message', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (message) => (
    <ListItem
      alignItems="flex-start"
      sx={{
        flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
        mb: 2
      }}
    >
      <ListItemAvatar>
        <Avatar>
          {message.role === 'user' ? <PersonIcon /> : <SmartToyIcon />}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2">
              {message.role === 'user' ? '你' : '学习助手'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {new Date(message.timestamp).toLocaleTimeString()}
            </Typography>
          </Box>
        }
        secondary={
          <Box>
            <Typography
              component="span"
              variant="body1"
              color="text.primary"
              sx={{ whiteSpace: 'pre-wrap' }}
            >
              {message.content}
            </Typography>
            {message.knowledge_references && message.knowledge_references.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  参考来源：
                </Typography>
                {message.knowledge_references.map((ref, index) => (
                  <Chip
                    key={index}
                    icon={<BookIcon />}
                    label={ref.title}
                    size="small"
                    sx={{ mr: 1, mt: 0.5 }}
                  />
                ))}
              </Box>
            )}
          </Box>
        }
      />
    </ListItem>
  );

  const renderDrawer = () => (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
    >
      <Box sx={{ width: 300, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          学习助手
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {studentProfile && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                学习档案
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                学习风格：{studentProfile.learning_style}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                兴趣领域：
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {studentProfile.interests?.map((interest, index) => (
                  <Chip key={index} label={interest} size="small" />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        <Typography variant="subtitle1" gutterBottom>
          历史会话
        </Typography>
        <List>
          {sessions.map((session) => (
            <ListItem
              key={session.id}
              button
              selected={session.id === sessionId}
              onClick={() => {
                setSessionId(session.id);
                setDrawerOpen(false);
              }}
            >
              <ListItemText
                primary={session.title}
                secondary={new Date(session.created_at).toLocaleDateString()}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <Container maxWidth="md">
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            学习助手
          </Typography>
          <IconButton onClick={() => setDrawerOpen(true)}>
            <HistoryIcon />
          </IconButton>
        </Box>

        <Paper
          elevation={3}
          sx={{
            flex: 1,
            mb: 2,
            overflow: 'auto',
            p: 2,
            bgcolor: 'background.default'
          }}
        >
          <List>
            {messages.map((message, index) => (
              <React.Fragment key={index}>
                {renderMessage(message)}
                {index < messages.length - 1 && <Divider />}
              </React.Fragment>
            ))}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </List>
        </Paper>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入你的问题..."
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            发送
          </Button>
        </Box>
      </Box>

      {renderDrawer()}
    </Container>
  );
};

export default ChatBot; 