import * as React from "react";
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PowerLensBranding from "../components/PowerLensBranding";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
  });
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
          <Stack spacing={3}>
            <Box sx={{ textAlign: "center" }}>
              <PowerLensBranding />
              <Typography variant="h5" fontWeight="bold" mt={2}>
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to your account
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
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
                  autoComplete="current-password"
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : "Sign In"}
                </Button>
              </Stack>
            </form>

            <Typography variant="body2" textAlign="center">
              Don't have an account?{" "}
              <Link
                component="button"
                onClick={() => navigate("/register")}
                sx={{ cursor: "pointer" }}
              >
                Sign Up
              </Link>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}