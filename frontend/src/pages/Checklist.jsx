import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Grid,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import axios from 'axios';

function Checklist() {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [formData, setFormData] = useState({
    school_name: '',
    items: [{ title: '', is_completed: false }],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/checklists`
      );
      setChecklists(response.data);
    } catch (error) {
      console.error('Error fetching checklists:', error);
      setError('Failed to load checklists');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (checklist = null) => {
    if (checklist) {
      setEditingChecklist(checklist);
      setFormData({
        school_name: checklist.school_name,
        items: checklist.items,
      });
    } else {
      setEditingChecklist(null);
      setFormData({
        school_name: '',
        items: [{ title: '', is_completed: false }],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingChecklist(null);
    setFormData({
      school_name: '',
      items: [{ title: '', is_completed: false }],
    });
    setError('');
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { title: '', is_completed: false }],
    });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.school_name.trim()) {
        setError('School name is required');
        return;
      }

      if (formData.items.some((item) => !item.title.trim())) {
        setError('All checklist items must have a title');
        return;
      }

      if (editingChecklist) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/checklists/${editingChecklist.id}`,
          formData
        );
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/checklists`,
          formData
        );
      }

      handleCloseDialog();
      fetchChecklists();
    } catch (error) {
      console.error('Error saving checklist:', error);
      setError('Failed to save checklist');
    }
  };

  const handleDeleteChecklist = async (id) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/checklists/${id}`
      );
      fetchChecklists();
    } catch (error) {
      console.error('Error deleting checklist:', error);
      setError('Failed to delete checklist');
    }
  };

  const handleToggleItem = async (checklistId, itemIndex) => {
    try {
      const checklist = checklists.find((c) => c.id === checklistId);
      const newItems = [...checklist.items];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        is_completed: !newItems[itemIndex].is_completed,
      };

      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/checklists/${checklistId}`,
        {
          school_name: checklist.school_name,
          items: newItems,
        }
      );

      fetchChecklists();
    } catch (error) {
      console.error('Error updating checklist item:', error);
      setError('Failed to update checklist item');
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h4">Application Checklists</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Checklist
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {checklists.map((checklist) => (
          <Grid item xs={12} md={6} key={checklist.id}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon sx={{ mr: 1 }} />
                <Typography variant="h6">{checklist.school_name}</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog(checklist)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteChecklist(checklist.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              <List>
                {checklist.items.map((item, index) => (
                  <ListItem key={index}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={item.is_completed}
                          onChange={() =>
                            handleToggleItem(checklist.id, index)
                          }
                        />
                      }
                      label={item.title}
                    />
                    {item.is_completed && (
                      <Chip
                        label="Completed"
                        color="success"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingChecklist ? 'Edit Checklist' : 'New Checklist'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="School Name"
              value={formData.school_name}
              onChange={(e) =>
                setFormData({ ...formData, school_name: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Checklist Items
            </Typography>

            {formData.items.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  label={`Item ${index + 1}`}
                  value={item.title}
                  onChange={(e) =>
                    handleItemChange(index, 'title', e.target.value)
                  }
                />
                <IconButton
                  color="error"
                  onClick={() => handleRemoveItem(index)}
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              sx={{ mt: 1 }}
            >
              Add Item
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingChecklist ? 'Save Changes' : 'Create Checklist'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Checklist; 