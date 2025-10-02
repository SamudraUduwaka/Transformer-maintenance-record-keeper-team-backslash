import React from "react";
import { Box } from "@mui/material";
import AppHeader from "./AppHeader";
import AppDrawer from "./AppDrawer";

interface AppLayoutProps {
  title: string;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  drawerWidth?: number;
  headerLeftContent?: React.ReactNode;
  drawerContent: React.ReactNode;
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  title,
  mobileOpen,
  setMobileOpen,
  drawerWidth = 200,
  headerLeftContent,
  drawerContent,
  children,
}) => {
  return (
    <Box sx={{ display: "flex" }}>
      <AppHeader
        title={title}
        drawerWidth={drawerWidth}
        leftContent={headerLeftContent}
      />
      <AppDrawer
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        drawerWidth={drawerWidth}
      >
        {drawerContent}
      </AppDrawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AppLayout;
