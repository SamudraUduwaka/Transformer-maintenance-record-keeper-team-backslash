import React from "react";
import { AppBar, Toolbar, Stack, Typography, Box, Avatar } from "@mui/material";

interface AppHeaderProps {
  title: string;
  drawerWidth: number;
  leftContent?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  drawerWidth,
  leftContent,
}) => {
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
          <Avatar src="./user.png" sx={{ width: 36, height: 36 }} />
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Typography variant="subtitle2" sx={{ lineHeight: 1 }}>
              Test User
            </Typography>
            <Typography variant="caption" color="text.secondary">
              testuser@gmail.com
            </Typography>
          </Box>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
