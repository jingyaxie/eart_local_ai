import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  MenuItem,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import {
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  Audiotrack as AudiotrackIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';

function UploadFile() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [category, setCategory] = useState('');
  const [batchSize, setBatchSize] = useState(5);

  const categories = [
    'Course Materials',
    'Assignments',
    'Portfolio',
    'Visa Documents',
    'Other',
  ];

  const onDrop = useCallback((acceptedFiles) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
    setError('');
    setSuccess('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const handleRemoveFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(files);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFiles(items);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Split files into batches
      const batches = [];
      for (let i = 0; i < files.length; i += batchSize) {
        batches.push(files.slice(i, i + batchSize));
      }

      // Upload each batch
      for (const batch of batches) {
        const uploadPromises = batch.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          if (category) {
            formData.append('category', category);
          }

          const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/media/upload`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              onUploadProgress: (progressEvent) => {
                const progress = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                setUploadProgress((prev) => ({
                  ...prev,
                  [file.name]: progress,
                }));
              },
            }
          );

          return response.data;
        });

        await Promise.all(uploadPromises);
      }

      setSuccess('Files uploaded successfully');
      setFiles([]);
      setUploadProgress({});
    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon />;
    } else if (file.type.startsWith('audio/')) {
      return <AudiotrackIcon />;
    } else {
      return <DescriptionIcon />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Upload Files
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
        <Grid item xs={12} md={6}>
          <Paper
            {...getRootProps()}
            sx={{
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'divider',
            }}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive
                ? 'Drop the files here'
                : 'Drag and drop files here, or click to select files'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supported file types: Images, Audio, PDF, Word documents
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Settings
            </Typography>
            <TextField
              fullWidth
              select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="">None</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              type="number"
              label="Batch Size"
              value={batchSize}
              onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{
                min: 1,
                max: 10,
              }}
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              fullWidth
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {files.length > 0 && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Selected Files
          </Typography>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="files">
              {(provided) => (
                <List {...provided.droppableProps} ref={provided.innerRef}>
                  {files.map((file, index) => (
                    <Draggable
                      key={file.name}
                      draggableId={file.name}
                      index={index}
                    >
                      {(provided) => (
                        <ListItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <DragIndicatorIcon sx={{ mr: 2, color: 'text.secondary' }} />
                          <ListItemText
                            primary={file.name}
                            secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                          />
                          <ListItemSecondaryAction>
                            {uploadProgress[file.name] !== undefined && (
                              <Box sx={{ width: 100, mr: 2 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={uploadProgress[file.name]}
                                  sx={{ height: 8, borderRadius: 4 }}
                                />
                              </Box>
                            )}
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveFile(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </List>
              )}
            </Droppable>
          </DragDropContext>
        </Paper>
      )}

      {uploading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}

export default UploadFile; 