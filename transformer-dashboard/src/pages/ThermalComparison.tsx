// src/pages/ThermalComparison.tsx
import * as React from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Chip,
  CssBaseline,
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
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
  Button,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Bolt as BoltIcon,
  List as ListIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";

/* ----- Theme (same vibe as InspectionDetails) ----- */
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4F46E5" },
    secondary: { main: "#7C3AED" },
    background: { default: "#F7F7FB" },
    text: { primary: "#101828", secondary: "#667085" },
    success: { main: "#16A34A" },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { borderRadius: 16 } } },
    MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 14, fontWeight: 600 } } },
  },
});

const drawerWidth = 260;

/* Small pill used in the header */
function StatPill({ top, bottom }: { top: string | number; bottom: string }) {
  return (
    <Box
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: 3,
        bgcolor: "#EEF0F6",
        minWidth: 108,
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1 }}>{top}</Typography>
      <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.2 }}>{bottom}</Typography>
    </Box>
  );
}

export default function ThermalComparison() {
  const { transformerNo = "AZ-0001", inspectionNo = "00123589" } = useParams();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const inspectedAt = "Mon(21), May, 2023 12:55pm";
  const lastUpdated = "Mon(21), May, 2023 12:55pm";

  // Images (replace with your real URLs)
  const BASELINE_URL =
    "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1400&auto=format&fit=crop";
  const CURRENT_URL =
    "https://images.unsplash.com/photo-1520975930418-8a6c0f4e1d0e?q=80&w=1400&auto=format&fit=crop";

  /* Drawer content */
  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 2 }}>
        <BoltIcon />
        <Typography variant="h6" fontWeight={800}>
          Oversight
        </Typography>
      </Stack>
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
          <ListItemButton>
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
    <ThemeProvider theme={theme}>
      <CssBaseline />

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
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <IconButton onClick={() => setMobileOpen((v) => !v)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Transformer
            </Typography>
          </Stack>

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title="Notifications">
            <IconButton>
              <Badge color="secondary" variant="dot">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ ml: 1 }}>
            <Avatar src="https://i.pravatar.cc/64?img=1" sx={{ width: 36, height: 36 }} />
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Typography variant="subtitle2" sx={{ lineHeight: 1 }}>
                Olivera Queen
              </Typography>
              <Typography variant="caption" color="text.secondary">
                olivera@gmail.com
              </Typography>
            </Box>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", sm: "none" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: "none", sm: "block" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main */}
      <Box sx={{ display: "flex", bgcolor: "background.default" }}>
        <Box
          component="main"
          sx={{ flexGrow: 1, p: { xs: 2, sm: 1 }, mt: 8, ml: { sm: `${drawerWidth}px` } }}
        >
          <Stack spacing={2}>
            {/* Header card */}
            <Paper elevation={3} sx={{ p: 2.25, borderRadius: 1 }}>
              <Stack direction="row" alignItems="stretch" sx={{ width: "100%" }}>
                {/* Left */}
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1.25}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        bgcolor: "#1F1C4F",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Box sx={{ width: 10, height: 10, bgcolor: "#FFFFFF", borderRadius: "50%" }} />
                    </Box>
                    <Typography variant="h6" fontWeight={800}>
                      {inspectionNo}
                    </Typography>
                    <IconButton size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", textAlign: "left" }}>
                    {inspectedAt}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1.25 }} flexWrap="wrap" useFlexGap>
                    <StatPill top={transformerNo} bottom="Transformer No" />
                    <StatPill top="EN-122-A" bottom="Pole No" />
                    <StatPill top="Nugegoda" bottom="Branch" />
                    <StatPill top="A-110" bottom="Inspected By" />
                  </Stack>
                </Box>

                {/* Right */}
                <Stack direction="column" alignItems="flex-end" justifyContent="space-between" sx={{ alignSelf: "stretch", minWidth: 350, py: 0.5 }}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                      Last updated: {lastUpdated}
                    </Typography>
                    <Chip label="Inspection in progress" color="success" variant="outlined" sx={{ height: 28, fontWeight: 700, borderColor: "success.light", color: "success.main" }} />
                  </Stack>
                  {/* baseline pill (as shown in screenshot) */}
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1.25,
                      py: 0.75,
                      bgcolor: "#EEF0F6",
                      borderRadius: 3,
                    }}
                  >
                    <ImageIcon fontSize="small" sx={{ color: "#475569" }} />
                    <Typography variant="body2" fontWeight={700} sx={{ color: "#344054" }}>
                      Baseline Image
                    </Typography>
                    <IconButton size="small" sx={{ width: 26, height: 26 }}>
                      <SearchIcon fontSize="inherit" sx={{ fontSize: 18, color: "#475569" }} />
                    </IconButton>
                  </Box>
                </Stack>
              </Stack>
            </Paper>

            {/* ===== Comparison Section ===== */}
            <Paper elevation={3} sx={{ p: 2.25, borderRadius: 1, position: "relative" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Thermal Image Comparison
                </Typography>
                <IconButton size="small">
                  <SearchIcon />
                </IconButton>
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                {/* Baseline image */}
                <Box
                  sx={{
                    position: "relative",
                    flex: 1,
                    borderRadius: 1,
                    overflow: "hidden",
                    aspectRatio: "4 / 3",
                    bgcolor: "transparent",
                  }}
                >
                  <img
                    src={BASELINE_URL}
                    alt="Baseline"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                  <Chip
                    size="small"
                    label="Baseline"
                    sx={{ position: "absolute", top: 10, left: 10, fontWeight: 700, bgcolor: "rgba(17,24,39,0.75)", color: "white" }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ position: "absolute", bottom: 10, left: 10, color: "white", bgcolor: "rgba(17,24,39,0.65)", px: 0.75, py: 0.25, borderRadius: 1 }}
                  >
                    1/6/2025 9:10:08 PM
                  </Typography>
                </Box>

                {/* Current image with annotations */}
                <Box
                  sx={{
                    position: "relative",
                    flex: 1,
                    borderRadius: 1,
                    overflow: "hidden",
                    aspectRatio: "4 / 3",
                    bgcolor: "transparent",
                  }}
                >
                  <img
                    src={CURRENT_URL}
                    alt="Current"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                  <Chip
                    size="small"
                    label="Current"
                    sx={{ position: "absolute", top: 10, left: 10, fontWeight: 700, bgcolor: "rgba(17,24,39,0.75)", color: "white" }}
                  />
                  <Chip
                    size="small"
                    label="Anomaly Detected"
                    color="error"
                    sx={{ position: "absolute", top: 10, right: 10, fontWeight: 700 }}
                  />

                  {/* demo red boxes */}
                  <Box sx={{ position: "absolute", left: "27%", top: "42%", width: 160, height: 110, border: "2px solid #EF4444", borderRadius: 1 }} />
                  <Box sx={{ position: "absolute", left: "56%", bottom: "14%", width: 210, height: 90, border: "2px solid #EF4444", borderRadius: 1 }} />

                  <Typography
                    variant="caption"
                    sx={{ position: "absolute", bottom: 10, left: 10, color: "white", bgcolor: "rgba(17,24,39,0.65)", px: 0.75, py: 0.25, borderRadius: 1 }}
                  >
                    5/7/2025 8:34:21 PM
                  </Typography>
                </Box>
              </Stack>

              {/* Annotation tools bar (bottom-right) */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  mt: 2,
                  ml: "auto",
                  width: "fit-content",
                  borderRadius: 999,
                  px: 1,
                  py: 0.5,
                  bgcolor: "#F3F4F6",
                }}
              >
                <Typography variant="body2" sx={{ px: 1, color: "#334155" }}>
                  Annotation Tools
                </Typography>
                <Button size="small" variant="outlined">Box</Button>
                <Button size="small" variant="outlined">Line</Button>
                <Button size="small" variant="outlined">Clear</Button>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
