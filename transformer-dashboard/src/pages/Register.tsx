import * as React from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PowerLensBranding from '../components/PowerLensBranding';

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <PowerLensBranding />
              <Typography variant="h5" fontWeight="bold" mt={2}>
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign up to get started
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Sign Up'}
                </Button>
              </Stack>
            </form>

            <Typography variant="body2" textAlign="center">
              Already have an account?{' '}
              <Link
                component="button"
                onClick={() => navigate('/login')}
                sx={{ cursor: 'pointer' }}
              >
                Sign In
              </Link>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
