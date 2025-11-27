import React from "react";
import {
  AppBar,
  Toolbar,
  Stack,
  Typography,
  Box,
  Avatar,
  IconButton,
  Button,
} from "@mui/material";
import { Logout as LogoutIcon, Menu as MenuIcon } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface AppHeaderProps {
  title: string;
  drawerWidth: number;
  leftContent?: React.ReactNode;
  onMenuClick?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  drawerWidth,
  leftContent,
  onMenuClick,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
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
        {onMenuClick && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Stack direction="row" spacing={1.25} alignItems="center">
          {leftContent}
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {title}
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
                borderColor: "primary.main",
                color: "primary.main",
                "&:hover": {
                  borderColor: "primary.dark",
                  bgcolor: "primary.50",
                },
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
                sx={{ ml: 1 }}
                title="Logout"
              >
                <LogoutIcon />
              </IconButton>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
