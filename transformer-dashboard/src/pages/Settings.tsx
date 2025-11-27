import * as React from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  List as ListIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import PowerLensBranding from "../components/PowerLensBranding";
import { useAuth } from "../context/AuthContext";
import ConfirmationDialog from "../models/ConfirmationDialog";

const drawerWidth = 200;

export default function Settings() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // User details state
  const [userDetails, setUserDetails] = React.useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  // Password change state
  const [passwordData, setPasswordData] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleUserDetailsChange = (field: string, value: string) => {
    setUserDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveUserDetails = async () => {
    setConfirmDialog({
      open: true,
      title: "Update Profile",
      message: "Are you sure you want to update your profile details?",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setSaving(true);
        setMessage(null);

        try {
          // TODO: Add API call to update user details
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setMessage({ text: "Profile updated successfully!", type: "success" });
        } catch {
          setMessage({
            text: "Failed to update profile. Please try again.",
            type: "error",
          });
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({
        text: "New password and confirmation do not match.",
        type: "error",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({
        text: "Password must be at least 8 characters long.",
        type: "error",
      });
      return;
    }

    setConfirmDialog({
      open: true,
      title: "Change Password",
      message: "Are you sure you want to change your password?",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setSaving(true);
        setMessage(null);

        try {
          // TODO: Add API call to change password
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setMessage({ text: "Password changed successfully!", type: "success" });
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        } catch {
          setMessage({
            text: "Failed to change password. Please try again.",
            type: "error",
          });
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PowerLensBranding />
      <Divider />
      <List sx={{ p: 1 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate("/")}>
            <ListItemIcon>
              <ListIcon />
            </ListItemIcon>
            <ListItemText primary="Transformer" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate("/")}>
            <ListItemIcon>
              <SearchIcon />
            </ListItemIcon>
            <ListItemText primary="Inspections" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton selected>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
      <Box sx={{ flexGrow: 1 }} />
    </Box>
  );

  return (
    <>
      {/* AppBar */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
          ml: { sm: `${drawerWidth}px` },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          borderRadius: 0,
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <IconButton onClick={() => navigate(-1)} sx={{ color: "inherit" }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Settings
            </Typography>
          </Stack>

          <Box sx={{ flexGrow: 1 }} />

          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{ ml: 1 }}
          >
            {!isAuthenticated ? (
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  px: 2,
                  py: 0.5,
                  fontWeight: 600,
                }}
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
            ) : (
              <>
                <Avatar
                  src={user?.avatar || "./user.png"}
                  sx={{ width: 36, height: 36 }}
                />
                <Box sx={{ display: { xs: "none", md: "block" } }}>
                  <Typography variant="subtitle2" sx={{ lineHeight: 1 }}>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={logout}
                  title="Logout"
                  aria-label="logout"
                >
                  <LogoutIcon />
                </IconButton>
              </>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="sidebar"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRadius: 0,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRadius: 0,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: "flex", bgcolor: "background.default" }}>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            mt: 9,
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          <Box sx={{ mb: 5 }}>
            <Typography 
              variant="h3" 
              fontWeight={700}
              sx={{
                background: "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1,
              }}
            >
              Settings
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.1rem" }}>
              Manage your account settings and preferences
            </Typography>
          </Box>
          <Stack spacing={4}>
            {/* Message */}
            {message && (
              <Paper
                sx={{
                  p: 2.5,
                  bgcolor:
                    message.type === "success"
                      ? "success.light"
                      : "error.light",
                  color:
                    message.type === "success"
                      ? "success.contrastText"
                      : "error.contrastText",
                  borderRadius: 2,
                }}
              >
                <Typography fontWeight={600} sx={{ fontSize: "1.05rem" }}>{message.text}</Typography>
              </Paper>
            )}

            {/* Two Column Layout */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 4,
              }}
            >
              {/* User Details Section */}
              <Card 
                elevation={4}
                sx={{
                  borderRadius: 3,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 8,
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        bgcolor: "primary.light",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mr: 2,
                      }}
                    >
                      <SaveIcon sx={{ color: "primary.main", fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        Profile Information
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Update your personal details
                      </Typography>
                    </Box>
                  </Box>
                  <Stack spacing={3.5}>
                    <TextField
                      label="Full Name"
                      value={userDetails.name}
                      onChange={(e) =>
                        handleUserDetailsChange("name", e.target.value)
                      }
                      fullWidth
                      disabled={saving}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        },
                      }}
                    />
                    <TextField
                      label="Email Address"
                      type="email"
                      value={userDetails.email}
                      onChange={(e) =>
                        handleUserDetailsChange("email", e.target.value)
                      }
                      fullWidth
                      disabled={saving}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        },
                      }}
                    />
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={
                          saving ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <SaveIcon />
                          )
                        }
                        onClick={handleSaveUserDetails}
                        disabled={saving}
                        sx={{
                          textTransform: "none",
                          borderRadius: 2,
                          px: 4,
                          py: 1.5,
                          fontWeight: 700,
                          fontSize: "1rem",
                          boxShadow: 2,
                          "&:hover": {
                            boxShadow: 4,
                          },
                        }}
                      >
                        Save Changes
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Password Change Section */}
              <Card 
                elevation={4}
                sx={{
                  borderRadius: 3,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 8,
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        bgcolor: "warning.light",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mr: 2,
                      }}
                    >
                      <SaveIcon sx={{ color: "warning.main", fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        Change Password
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Update your account password
                      </Typography>
                    </Box>
                  </Box>
                  <Stack spacing={3.5}>
                    <TextField
                      label="Current Password"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        handlePasswordChange("currentPassword", e.target.value)
                      }
                      fullWidth
                      disabled={saving}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        },
                      }}
                    />
                    <TextField
                      label="New Password"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        handlePasswordChange("newPassword", e.target.value)
                      }
                      fullWidth
                      disabled={saving}
                      variant="outlined"
                      helperText="Password must be at least 8 characters long"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        },
                      }}
                    />
                    <TextField
                      label="Confirm New Password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        handlePasswordChange("confirmPassword", e.target.value)
                      }
                      fullWidth
                      disabled={saving}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        },
                      }}
                    />
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                      <Button
                        variant="contained"
                        color="warning"
                        size="large"
                        startIcon={
                          saving ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <SaveIcon />
                          )
                        }
                        onClick={handleChangePassword}
                        disabled={saving}
                        sx={{
                          textTransform: "none",
                          borderRadius: 2,
                          px: 4,
                          py: 1.5,
                          fontWeight: 700,
                          fontSize: "1rem",
                          boxShadow: 2,
                          "&:hover": {
                            boxShadow: 4,
                          },
                        }}
                      >
                        Change Password
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        isLoading={saving}
      />
    </>
  );
}
