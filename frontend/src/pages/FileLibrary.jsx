import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  CardMedia,
  Autocomplete,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Paper,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  Label as LabelIcon,
  GetApp as GetAppIcon,
  Publish as PublishIcon,
  Share as ShareIcon,
  History as HistoryIcon,
  Comment as CommentIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Storage as StorageIcon,
  Restore as RestoreIcon,
  MoreVert as MoreVertIcon,
  Link as LinkIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import axios from 'axios';

function FileLibrary() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fileType, setFileType] = useState('all');
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState(0);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState({
    dateRange: {
      start: '',
      end: '',
    },
    sizeRange: {
      min: '',
      max: '',
    },
    tags: [],
  });
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [shareSettings, setShareSettings] = useState({
    access: 'private',
    expiry: '',
    password: '',
  });
  const [fileStats, setFileStats] = useState({
    views: 0,
    downloads: 0,
    shares: 0,
    comments: 0,
    lastAccessed: null,
  });

  const fileTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'image', label: 'Images' },
    { value: 'audio', label: 'Audio' },
    { value: 'document', label: 'Documents' },
  ];

  useEffect(() => {
    fetchFiles();
    fetchCategories();
    fetchTags();
  }, [fileType, category, selectedTags]);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/media/files`,
        {
          params: {
            file_type: fileType !== 'all' ? fileType : undefined,
            category: category !== 'all' ? category : undefined,
          },
        }
      );
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/media/categories`
      );
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/media/tags`
      );
      setTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchVersions = async (fileId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/media/files/${fileId}/versions`
      );
      setVersions(response.data);
    } catch (error) {
      console.error('Error fetching versions:', error);
      setError('Failed to load file versions');
    }
  };

  const fetchComments = async (fileId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/media/files/${fileId}/comments`
      );
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    }
  };

  const fetchFileStats = async (fileId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/media/files/${fileId}/stats`
      );
      setFileStats(response.data);
    } catch (error) {
      console.error('Error fetching file stats:', error);
      setError('Failed to load file statistics');
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/media/files/${fileId}`
      );
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file');
    }
  };

  const handleDownload = async (file) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/media/files/${file.id}/download`,
        {
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file');
    }
  };

  const handleEdit = (file) => {
    setSelectedFile(file);
    setEditCategory(file.category || '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/media/files/${selectedFile.id}`,
        {
          category: editCategory,
        }
      );
      setEditDialogOpen(false);
      fetchFiles();
    } catch (error) {
      console.error('Error updating file:', error);
      setError('Failed to update file');
    }
  };

  const handlePreview = (file) => {
    setSelectedFile(file);
    setPreviewOpen(true);
    fetchFileStats(file.id);
  };

  const renderPreview = () => {
    if (!selectedFile) return null;

    const fileType = selectedFile.file_type.toLowerCase();
    const fileUrl = `${process.env.REACT_APP_API_URL}/api/media/files/${selectedFile.id}/preview`;

    return (
      <Box sx={{ width: '100%' }}>
        <Tabs value={previewTab} onChange={(e, newValue) => setPreviewTab(newValue)}>
          <Tab label="Preview" />
          <Tab label="Versions" />
          <Tab label="Comments" />
          <Tab label="Statistics" />
        </Tabs>

        <Box sx={{ mt: 2 }}>
          {previewTab === 0 && (
            <Box>
              {fileType.includes('image') ? (
                <CardMedia
                  component="img"
                  image={fileUrl}
                  alt={selectedFile.filename}
                  sx={{ maxHeight: '70vh', objectFit: 'contain' }}
                />
              ) : fileType.includes('audio') ? (
                <audio controls style={{ width: '100%' }}>
                  <source src={fileUrl} type={selectedFile.mime_type} />
                  Your browser does not support the audio element.
                </audio>
              ) : fileType.includes('pdf') ? (
                <iframe
                  src={fileUrl}
                  style={{ width: '100%', height: '70vh', border: 'none' }}
                  title={selectedFile.filename}
                />
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Preview not available for this file type
                </Typography>
              )}
            </Box>
          )}

          {previewTab === 1 && (
            <List>
              {versions.map((version) => (
                <ListItem key={version.id}>
                  <ListItemAvatar>
                    <Avatar>
                      <HistoryIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`Version ${version.version}`}
                    secondary={`Created: ${new Date(version.created_at).toLocaleString()}`}
                  />
                  <Button
                    startIcon={<RestoreIcon />}
                    onClick={() => handleVersionRestore(selectedFile.id, version.id)}
                  >
                    Restore
                  </Button>
                </ListItem>
              ))}
            </List>
          )}

          {previewTab === 2 && (
            <Box>
              <List>
                {comments.map((comment) => (
                  <ListItem key={comment.id}>
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={comment.user}
                      secondary={
                        <>
                          <Typography component="span" variant="body2">
                            {comment.content}
                          </Typography>
                          <br />
                          <Typography component="span" variant="caption" color="text.secondary">
                            {new Date(comment.created_at).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Add Comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button
                  variant="contained"
                  onClick={() => handleAddComment(selectedFile.id)}
                  sx={{ mt: 1 }}
                >
                  Post Comment
                </Button>
              </Box>
            </Box>
          )}

          {previewTab === 3 && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Usage Statistics
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Views"
                          secondary={fileStats.views}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Downloads"
                          secondary={fileStats.downloads}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Shares"
                          secondary={fileStats.shares}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Comments"
                          secondary={fileStats.comments}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Last Accessed
                    </Typography>
                    <Typography variant="body1">
                      {fileStats.lastAccessed
                        ? new Date(fileStats.lastAccessed).toLocaleString()
                        : 'Never'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const handleTagAdd = async (fileId, tag) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/media/files/${fileId}/tags`,
        { tag }
      );
      fetchFiles();
      fetchTags();
    } catch (error) {
      console.error('Error adding tag:', error);
      setError('Failed to add tag');
    }
  };

  const handleTagRemove = async (fileId, tag) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/media/files/${fileId}/tags/${tag}`
      );
      fetchFiles();
    } catch (error) {
      console.error('Error removing tag:', error);
      setError('Failed to remove tag');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/media/export`,
        {
          fileIds: selectedFiles.map(file => file.id),
          format: 'zip',
        },
        {
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'exported_files.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Error exporting files:', error);
      setError('Failed to export files');
    }
  };

  const handleImport = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/media/import`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      fetchFiles();
      setImportDialogOpen(false);
    } catch (error) {
      console.error('Error importing files:', error);
      setError('Failed to import files');
    }
  };

  const handleVersionRestore = async (fileId, versionId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/media/files/${fileId}/versions/${versionId}/restore`
      );
      fetchFiles();
      setVersionDialogOpen(false);
    } catch (error) {
      console.error('Error restoring version:', error);
      setError('Failed to restore version');
    }
  };

  const handleAddComment = async (fileId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/media/files/${fileId}/comments`,
        { content: newComment }
      );
      setNewComment('');
      fetchComments(fileId);
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    }
  };

  const handleShare = async (fileId) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/media/files/${fileId}/share`,
        shareSettings
      );
      // Handle share response (e.g., copy link to clipboard)
      setShareDialogOpen(false);
    } catch (error) {
      console.error('Error sharing file:', error);
      setError('Failed to share file');
    }
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => file.tags?.includes(tag));
    const matchesDateRange = (!advancedSearch.dateRange.start || new Date(file.created_at) >= new Date(advancedSearch.dateRange.start)) &&
      (!advancedSearch.dateRange.end || new Date(file.created_at) <= new Date(advancedSearch.dateRange.end));
    const matchesSizeRange = (!advancedSearch.sizeRange.min || file.size >= advancedSearch.sizeRange.min * 1024 * 1024) &&
      (!advancedSearch.sizeRange.max || file.size <= advancedSearch.sizeRange.max * 1024 * 1024);

    return matchesSearch && matchesTags && matchesDateRange && matchesSizeRange;
  });

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
          File Library
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<PublishIcon />}
            onClick={() => setImportDialogOpen(true)}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={() => setExportDialogOpen(true)}
            disabled={selectedFiles.length === 0}
          >
            Export
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Search Files"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            label="File Type"
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
          >
            {fileTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Autocomplete
            multiple
            options={tags}
            value={selectedTags}
            onChange={(_, newValue) => setSelectedTags(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filter by Tags"
                placeholder="Select tags"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  color="primary"
                  variant="outlined"
                />
              ))
            }
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {filteredFiles.map((file) => (
          <Grid item xs={12} sm={6} md={4} key={file.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" noWrap>
                  {file.filename}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    label={file.file_type}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  {file.category && (
                    <Chip
                      label={file.category}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </Stack>
                <Box sx={{ mt: 1 }}>
                  {file.tags?.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      onDelete={() => handleTagRemove(file.id, tag)}
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                  <Tooltip title="Add Tag">
                    <IconButton
                      size="small"
                      onClick={() => {
                        const tag = prompt('Enter tag name:');
                        if (tag) handleTagAdd(file.id, tag);
                      }}
                    >
                      <LabelIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Uploaded: {new Date(file.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Tooltip title="Preview">
                  <IconButton
                    size="small"
                    onClick={() => handlePreview(file)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download">
                  <IconButton
                    size="small"
                    onClick={() => handleDownload(file)}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(file)}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedFile(file);
                      setShareDialogOpen(true);
                    }}
                  >
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Versions">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedFile(file);
                      fetchVersions(file.id);
                      setVersionDialogOpen(true);
                    }}
                  >
                    <HistoryIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Comments">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedFile(file);
                      fetchComments(file.id);
                      setCommentDialogOpen(true);
                    }}
                  >
                    <Badge badgeContent={file.comments?.length || 0} color="primary">
                      <CommentIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Statistics">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedFile(file);
                      fetchFileStats(file.id);
                      setStatsDialogOpen(true);
                    }}
                  >
                    <BarChartIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(file.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit File Category</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Category"
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            sx={{ mt: 2 }}
          >
            <MenuItem value="">None</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedFile?.filename}
        </DialogTitle>
        <DialogContent>
          {renderPreview()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
        <DialogTitle>Import Files</DialogTitle>
        <DialogContent>
          <input
            type="file"
            multiple
            onChange={handleImport}
            style={{ display: 'none' }}
            id="import-files"
          />
          <label htmlFor="import-files">
            <Button
              variant="contained"
              component="span"
              fullWidth
              sx={{ mt: 2 }}
            >
              Select Files to Import
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Files</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Selected files will be exported as a ZIP archive.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedFiles.length} files selected
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExport} variant="contained">
            Export
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={versionDialogOpen}
        onClose={() => setVersionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>File Versions</DialogTitle>
        <DialogContent>
          <List>
            {versions.map((version) => (
              <ListItem key={version.id}>
                <ListItemAvatar>
                  <Avatar>
                    <HistoryIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`Version ${version.version}`}
                  secondary={`Created: ${new Date(version.created_at).toLocaleString()}`}
                />
                <Button
                  startIcon={<RestoreIcon />}
                  onClick={() => handleVersionRestore(selectedFile.id, version.id)}
                >
                  Restore
                </Button>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share File</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Access Level</InputLabel>
                <Select
                  value={shareSettings.access}
                  onChange={(e) => setShareSettings({
                    ...shareSettings,
                    access: e.target.value,
                  })}
                  label="Access Level"
                >
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="password">Password Protected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {shareSettings.access === 'password' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={shareSettings.password}
                  onChange={(e) => setShareSettings({
                    ...shareSettings,
                    password: e.target.value,
                  })}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Expiry Date"
                type="datetime-local"
                value={shareSettings.expiry}
                onChange={(e) => setShareSettings({
                  ...shareSettings,
                  expiry: e.target.value,
                })}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => handleShare(selectedFile.id)} variant="contained">
            Share
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Comments</DialogTitle>
        <DialogContent>
          <List>
            {comments.map((comment) => (
              <ListItem key={comment.id}>
                <ListItemAvatar>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={comment.user}
                  secondary={
                    <>
                      <Typography component="span" variant="body2">
                        {comment.content}
                      </Typography>
                      <br />
                      <Typography component="span" variant="caption" color="text.secondary">
                        {new Date(comment.created_at).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Add Comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={() => handleAddComment(selectedFile.id)}
              sx={{ mt: 1 }}
            >
              Post Comment
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={statsDialogOpen}
        onClose={() => setStatsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>File Statistics</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Usage Statistics
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Views"
                      secondary={fileStats.views}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Downloads"
                      secondary={fileStats.downloads}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Shares"
                      secondary={fileStats.shares}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Comments"
                      secondary={fileStats.comments}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Last Accessed
                </Typography>
                <Typography variant="body1">
                  {fileStats.lastAccessed
                    ? new Date(fileStats.lastAccessed).toLocaleString()
                    : 'Never'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FileLibrary; 