import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Chat as ChatIcon,
  Category as CategoryIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';

const KnowledgeBase = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState('default');
  const [newKnowledgeBaseName, setNewKnowledgeBaseName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // 生成唯一的会话ID
  const conversationId = React.useMemo(() => 
    `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  useEffect(() => {
    fetchKnowledgeBases();
    fetchFiles();
  }, [selectedKnowledgeBase]);

  const fetchKnowledgeBases = async () => {
    try {
      const response = await axios.get('/api/knowledge/list');
      setKnowledgeBases(response.data.knowledge_bases);
    } catch (err) {
      enqueueSnackbar('Failed to fetch knowledge bases', { variant: 'error' });
    }
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/knowledge/', {
        params: { collection_name: selectedKnowledgeBase }
      });
      setFiles(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch knowledge base files');
      enqueueSnackbar('Failed to fetch knowledge base files', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKnowledgeBase = async () => {
    if (!newKnowledgeBaseName.trim()) return;

    try {
      await axios.post('/api/knowledge/create', {
        collection_name: newKnowledgeBaseName
      });
      enqueueSnackbar('Knowledge base created successfully', { variant: 'success' });
      setCreateDialogOpen(false);
      setNewKnowledgeBaseName('');
      fetchKnowledgeBases();
    } catch (err) {
      enqueueSnackbar('Failed to create knowledge base', { variant: 'error' });
    }
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('collection_name', selectedKnowledgeBase);
      if (category) {
        formData.append('category', category);
      }

      await axios.post('/api/knowledge/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      enqueueSnackbar('File uploaded successfully', { variant: 'success' });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setCategory('');
      fetchFiles();
    } catch (err) {
      setError('Failed to upload file');
      enqueueSnackbar('Failed to upload file', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`/api/knowledge/${fileId}`, {
        params: { collection_name: selectedKnowledgeBase }
      });
      enqueueSnackbar('File deleted successfully', { variant: 'success' });
      fetchFiles();
    } catch (err) {
      setError('Failed to delete file');
      enqueueSnackbar('Failed to delete file', { variant: 'error' });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await axios.get('/api/knowledge/search', {
        params: {
          query: searchQuery,
          collection_name: selectedKnowledgeBase
        }
      });
      setSearchResults(response.data.results);
      setError(null);
    } catch (err) {
      setError('Search failed');
      enqueueSnackbar('Search failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatQuery.trim()) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/knowledge/chat', {
        query: chatQuery,
        conversation_id: conversationId,
        collection_name: selectedKnowledgeBase
      });

      setChatHistory(prev => [...prev, {
        query: chatQuery,
        answer: response.data.answer,
        sources: response.data.sources
      }]);
      setChatQuery('');
      setError(null);
    } catch (err) {
      setError('Chat failed');
      enqueueSnackbar('Chat failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderFileList = (items) => (
    <List>
      {items.map((file) => (
        <ListItem key={file.id}>
          <ListItemText
            primary={file.title}
            secondary={
              <>
                <Typography component="span" variant="body2" color="textPrimary">
                  Category: {file.category}
                </Typography>
                <br />
                <Typography component="span" variant="body2" color="textSecondary">
                  Created: {new Date(file.created_at).toLocaleString()}
                </Typography>
              </>
            }
          />
          <ListItemSecondaryAction>
            <IconButton edge="end" onClick={() => handleDelete(file.id)}>
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Knowledge Base
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Knowledge Base</InputLabel>
                    <Select
                      value={selectedKnowledgeBase}
                      onChange={(e) => setSelectedKnowledgeBase(e.target.value)}
                      label="Knowledge Base"
                    >
                      {knowledgeBases.map((kb) => (
                        <MenuItem key={kb.name} value={kb.name}>
                          {kb.name} ({kb.stats.count} documents)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    New Knowledge Base
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    Upload Document
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ChatIcon />}
                    onClick={() => setChatDialogOpen(true)}
                  >
                    Chat with Knowledge Base
                  </Button>
                </Box>
              </Box>

              <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
                <Tab icon={<CategoryIcon />} label="Files" />
                <Tab icon={<SearchIcon />} label="Search" />
              </Tabs>

              <Box sx={{ mt: 2 }}>
                {currentTab === 0 ? (
                  loading ? (
                    <CircularProgress />
                  ) : error ? (
                    <Alert severity="error">{error}</Alert>
                  ) : (
                    renderFileList(files)
                  )
                ) : (
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        label="Search Query"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Button
                        variant="contained"
                        onClick={handleSearch}
                        disabled={loading}
                      >
                        Search
                      </Button>
                    </Box>
                    {loading ? (
                      <CircularProgress />
                    ) : error ? (
                      <Alert severity="error">{error}</Alert>
                    ) : (
                      renderFileList(searchResults)
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              accept=".pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload">
              <Button variant="outlined" component="span">
                Select File
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {selectedFile.name}
              </Typography>
            )}
            <TextField
              fullWidth
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || loading}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Knowledge Base Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Knowledge Base</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Knowledge Base Name"
            value={newKnowledgeBaseName}
            onChange={(e) => setNewKnowledgeBaseName(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateKnowledgeBase}
            variant="contained"
            disabled={!newKnowledgeBaseName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog
        open={chatDialogOpen}
        onClose={() => setChatDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chat with Knowledge Base</DialogTitle>
        <DialogContent>
          <Box sx={{ height: 400, overflow: 'auto', mb: 2 }}>
            {chatHistory.map((chat, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="primary">
                  You: {chat.query}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {chat.answer}
                </Typography>
                {chat.sources && chat.sources.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Sources:
                    </Typography>
                    {chat.sources.map((source, idx) => (
                      <Chip
                        key={idx}
                        label={source.metadata.title}
                        size="small"
                        sx={{ mr: 1, mt: 1 }}
                      />
                    ))}
                  </Box>
                )}
                <Divider sx={{ mt: 2 }} />
              </Box>
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              label="Ask a question"
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChat()}
            />
            <Button
              variant="contained"
              onClick={handleChat}
              disabled={!chatQuery.trim() || loading}
            >
              Send
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChatDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default KnowledgeBase; 