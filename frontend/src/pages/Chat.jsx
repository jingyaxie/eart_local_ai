import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import {
  Send as SendIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';
import axios from 'axios';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const messagesEndRef = useRef(null);

  const models = [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  ];

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
    }
  }, [selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/chat/history`
      );
      setChatHistory(response.data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/chat/${chatId}/messages`
      );
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/chat/send`,
        {
          message: input,
          model: selectedModel,
          chat_id: selectedChat,
        }
      );

      setMessages((prev) => [...prev, response.data]);
      if (!selectedChat) {
        setSelectedChat(response.data.chat_id);
        fetchChatHistory();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setSelectedChat(null);
    setMessages([]);
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/chat/${chatId}`
      );
      if (selectedChat === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
      fetchChatHistory();
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Chat History Sidebar */}
      <Paper
        sx={{
          width: 300,
          borderRight: 1,
          borderColor: 'divider',
          overflow: 'auto',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleNewChat}
            sx={{ mb: 2 }}
          >
            New Chat
          </Button>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>AI Model</InputLabel>
            <Select
              value={selectedModel}
              label="AI Model"
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {models.map((model) => (
                <MenuItem key={model.value} value={model.value}>
                  {model.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <List>
          {chatHistory.map((chat) => (
            <React.Fragment key={chat.id}>
              <ListItem
                button
                selected={selectedChat === chat.id}
                onClick={() => setSelectedChat(chat.id)}
              >
                <ListItemText
                  primary={chat.title || 'New Chat'}
                  secondary={new Date(chat.created_at).toLocaleDateString()}
                />
                <IconButton
                  edge="end"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Chat Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent:
                  message.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  backgroundColor:
                    message.role === 'user'
                      ? 'primary.light'
                      : 'background.paper',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar
                    sx={{
                      bgcolor:
                        message.role === 'user'
                          ? 'primary.main'
                          : 'secondary.main',
                      mr: 1,
                    }}
                  >
                    {message.role === 'user' ? <PersonIcon /> : <BotIcon />}
                  </Avatar>
                  <Typography variant="subtitle2">
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </Typography>
                </Box>
                <Typography>{message.content}</Typography>
              </Paper>
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Grid container spacing={2}>
            <Grid item xs>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={loading}
              />
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                endIcon={<SendIcon />}
                onClick={handleSend}
                disabled={loading || !input.trim()}
                sx={{ height: '100%' }}
              >
                Send
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}

export default Chat; 