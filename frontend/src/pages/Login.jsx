import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Alert,
} from '@mui/material';
import axios from 'axios';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isRegistering ? '/api/users/register' : '/api/users/token';
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        isRegistering
          ? {
              username: formData.username,
              password: formData.password,
              email: formData.email,
            }
          : {
              username: formData.username,
              password: formData.password,
            }
      );

      if (isRegistering) {
        setIsRegistering(false);
        setError('Registration successful! Please login.');
      } else {
        localStorage.setItem('token', response.data.access_token);
        navigate('/');
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'An error occurred. Please try again.'
      );
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5">
            {isRegistering ? 'Register' : 'Sign In'}
          </Typography>
          {error && (
            <Alert severity={error.includes('successful') ? 'success' : 'error'} sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 1, width: '100%' }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
            />
            {isRegistering && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              {isRegistering ? 'Register' : 'Sign In'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => setIsRegistering(!isRegistering)}
              >
                {isRegistering
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Register"}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login; 