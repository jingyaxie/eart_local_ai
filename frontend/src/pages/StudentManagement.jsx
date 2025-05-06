import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    averageProgress: 0,
    completionRate: 0
  });
  const { enqueueSnackbar } = useSnackbar();

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: 'active',
    level: 'beginner',
    notes: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchStats();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/students');
      setStudents(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch students');
      enqueueSnackbar('Failed to fetch students', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/students/stats');
      setStats(response.data);
    } catch (err) {
      enqueueSnackbar('Failed to fetch statistics', { variant: 'error' });
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (student = null) => {
    if (student) {
      setFormData({
        name: student.name,
        email: student.email,
        status: student.status,
        level: student.level,
        notes: student.notes
      });
      setSelectedStudent(student);
    } else {
      setFormData({
        name: '',
        email: '',
        status: 'active',
        level: 'beginner',
        notes: ''
      });
      setSelectedStudent(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStudent(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedStudent) {
        await axios.put(`/api/students/${selectedStudent.id}`, formData);
        enqueueSnackbar('Student updated successfully', { variant: 'success' });
      } else {
        await axios.post('/api/students', formData);
        enqueueSnackbar('Student added successfully', { variant: 'success' });
      }
      handleCloseDialog();
      fetchStudents();
      fetchStats();
    } catch (err) {
      enqueueSnackbar('Operation failed', { variant: 'error' });
    }
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await axios.delete(`/api/students/${studentId}`);
        enqueueSnackbar('Student deleted successfully', { variant: 'success' });
        fetchStudents();
        fetchStats();
      } catch (err) {
        enqueueSnackbar('Failed to delete student', { variant: 'error' });
      }
    }
  };

  const renderStats = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Students
            </Typography>
            <Typography variant="h4">
              {stats.totalStudents}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Students
            </Typography>
            <Typography variant="h4">
              {stats.activeStudents}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Average Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={stats.averageProgress}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="textSecondary">
                  {`${Math.round(stats.averageProgress)}%`}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Completion Rate
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={stats.completionRate}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="textSecondary">
                  {`${Math.round(stats.completionRate)}%`}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Student Management
        </Typography>

        {renderStats()}

        <Paper sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Student
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={student.status}
                          color={student.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{student.level}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={student.progress}
                            />
                          </Box>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="textSecondary">
                              {`${Math.round(student.progress)}%`}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(student)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(student.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={students.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>

      {/* Add/Edit Student Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedStudent ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                label="Level"
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={4}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedStudent ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentManagement; 