import React from 'react';
import { Box, Drawer, Divider } from '@mui/material';
import PowerLensBranding from './PowerLensBranding';

interface AppDrawerProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  drawerWidth: number;
  children: React.ReactNode;
}

const AppDrawer: React.FC<AppDrawerProps> = ({ 
  mobileOpen, 
  setMobileOpen, 
  drawerWidth, 
  children 
}) => {
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PowerLensBranding />
      <Divider />
      {children}
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: (t) => `1px solid ${t.palette.divider}`,
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
            borderRight: (t) => `1px solid ${t.palette.divider}`,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default AppDrawer;