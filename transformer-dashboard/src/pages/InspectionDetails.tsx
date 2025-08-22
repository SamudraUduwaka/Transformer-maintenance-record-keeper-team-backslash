// src/pages/InspectionDetails.tsx
import * as React from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Bolt as BoltIcon,
  List as ListIcon,
  MoreVert as MoreVertIcon,
  Image as ImageIcon,
  Visibility as VisibilityIcon,
  DeleteOutline as DeleteOutlineIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";

/* ----- Theme ----- */
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

/* Helpers */
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

function BaselineGroup({ onView, onDelete }: { onView: () => void; onDelete: () => void }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        bgcolor: "#EEF0F6",
        borderRadius: 3,
        px: 1,
        py: 0.75,
      }}
    >
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
        <ImageIcon sx={{ fontSize: 18, color: "#667085" }} />
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#344054" }}>Baseline Image</Typography>
      </Box>

      <IconButton size="small" sx={{ width: 28, height: 28, bgcolor: "white", border: (t) => `1px solid ${t.palette.divider}` }}>
        <VisibilityIcon fontSize="inherit" sx={{ fontSize: 16, color: "#344054" }} />
      </IconButton>

      <IconButton
        size="small"
        sx={{
          width: 28,
          height: 28,
          bgcolor: "white",
          border: (t) => `1px solid ${t.palette.divider}`,
          color: "error.main",
        }}
      >
        <DeleteOutlineIcon fontSize="inherit" sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}

/* ----- Page ----- */
export default function InspectionDetails() {
  const { transformerNo = "AZ-8801", inspectionNo = "000123589" } = useParams();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const inspectedAt = "Mon(21), May, 2023 12:55pm";
  const lastUpdated = "Mon(21), May, 2023 12:55pm";

  const [weather, setWeather] = React.useState("Sunny");

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  // Uploading / comparison states
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [showCompare, setShowCompare] = React.useState(false);
  const tickRef = React.useRef<number | null>(null);

  // placeholder baseline image
  const BASELINE_URL =
    "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1200&auto=format&fit=crop";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f ?? null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleConfirmUpload = () => {
    setUploadOpen(false);
    setIsUploading(true);
    setShowCompare(false);
    setProgress(0);
    if (tickRef.current) window.clearInterval(tickRef.current);
    // simulate upload
    tickRef.current = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (tickRef.current) window.clearInterval(tickRef.current);
          return 100;
        }
        return p + 2;
      });
    }, 120);
  };

  const handleCancelUpload = () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    setIsUploading(false);
    setShowCompare(false);
    setProgress(0);
  };

  React.useEffect(() => {
    if (isUploading && progress >= 100) {
      const t = setTimeout(() => {
        setIsUploading(false);
        setShowCompare(true);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [isUploading, progress]);

  const handleCloseUpload = () => setUploadOpen(false);

  /* Drawer */
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
            <IconButton onClick={() => setMobileOpen(!mobileOpen)}>
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
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 1 }, mt: 8, ml: { sm: `${drawerWidth}px` } }}>
          <Stack spacing={2}>
            {/* ===== Header ===== */}
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
                    <Chip label="In progress" color="success" variant="outlined" sx={{ height: 28, fontWeight: 700, borderColor: "success.light", color: "success.main" }} />
                  </Stack>
                  <BaselineGroup onView={() => {}} onDelete={() => {}} />
                </Stack>
              </Stack>
            </Paper>

            {/* ===== Content area ===== */}
            {isUploading ? (
              <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, textAlign: "left" }}>
                  Thermal Image
                </Typography>
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                    p: { xs: 3, sm: 6 },
                    textAlign: "center",
                    bgcolor: "white",
                  }}
                >
                  <Typography fontWeight={700}>Thermal image uploading.</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Thermal image is being uploaded and Reviewed.
                  </Typography>

                  <Box sx={{ mt: 3, mx: "auto", width: { xs: "100%", sm: "70%" } }}>
                    <Box sx={{ height: 8, borderRadius: 999, bgcolor: "#E5E7EB" }}>
                      <Box
                        sx={{
                          height: "100%",
                          width: `${progress}%`,
                          bgcolor: "primary.main",
                          borderRadius: 999,
                          transition: "width 200ms linear",
                        }}
                      />
                    </Box>
                    <Box sx={{ mt: 0.5, textAlign: "right", color: "text.secondary", fontSize: 12 }}>{progress}%</Box>
                  </Box>

                  <Button onClick={handleCancelUpload} sx={{ mt: 3, borderRadius: 999 }}>
                    Cancel
                  </Button>
                </Box>
              </Paper>
            ) : showCompare ? (
              // ===== Comparison view (no black strip) =====
              <Paper elevation={3} sx={{ p: 2.5, borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Thermal Image Comparison
                  </Typography>
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  {/* Baseline */}
                  <Box
                    sx={{
                      position: "relative",
                      flex: 1,
                      borderRadius: 1,
                      overflow: "hidden",
                      aspectRatio: "4 / 3",
                      p: 0,
                      bgcolor: "transparent",
                    }}
                  >
                    <img
                      src={BASELINE_URL}
                      alt="Baseline"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1.5,
                        fontSize: 12,
                        fontWeight: 700,
                        bgcolor: "rgba(17, 24, 39, 0.7)",
                        color: "white",
                      }}
                    >
                      Baseline
                    </Box>
                  </Box>

                  {/* Current (uploaded) */}
                  <Box
                    sx={{
                      position: "relative",
                      flex: 1,
                      borderRadius: 1,
                      overflow: "hidden",
                      aspectRatio: "4 / 3",
                      p: 0,
                      bgcolor: "transparent",
                    }}
                  >
                    <img
                      src={preview ?? BASELINE_URL}
                      alt="Current"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1.5,
                        fontSize: 12,
                        fontWeight: 700,
                        bgcolor: "rgba(17, 24, 39, 0.7)",
                        color: "white",
                      }}
                    >
                      Current
                    </Box>

                    {/* Example: anomaly badge + demo boxes */}
                    <Chip
                      size="small"
                      label="Anomaly Detected"
                      color="error"
                      sx={{ position: "absolute", top: 10, right: 10, fontWeight: 700 }}
                    />
                    <Box sx={{ position: "absolute", left: "55%", top: "42%", width: 120, height: 90, border: "2px solid #EF4444", borderRadius: 1 }} />
                    <Box sx={{ position: "absolute", left: "62%", bottom: "12%", width: 180, height: 80, border: "2px solid #EF4444", borderRadius: 1 }} />
                  </Box>
                </Stack>
              </Paper>
            ) : (
              // Normal two-column layout (before upload)
              <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems="stretch">
                {/* Thermal Image */}
                <Paper elevation={3} sx={{ p: 2.5, borderRadius: 2, flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Thermal Image
                    </Typography>
                    <Chip size="small" label="Pending" sx={{ height: 22, fontSize: 12, fontWeight: 600, color: "#F59E0B", bgcolor: "#FFF7ED" }} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "left" }}>
                    Upload a thermal image of the transformer to identify potential issues.
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Weather Condition
                    </Typography>
                    <FormControl size="small" fullWidth sx={{ mt: 1.5 }}>
                      <Select value={weather} onChange={(e) => setWeather(e.target.value)}>
                        <MenuItem value="Sunny">Sunny</MenuItem>
                        <MenuItem value="Cloudy">Cloudy</MenuItem>
                        <MenuItem value="Rainy">Rainy</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, borderRadius: 999, py: 1.1, fontWeight: 700 }}
                    onClick={() => setUploadOpen(true)}
                  >
                    Upload thermal image
                  </Button>
                </Paper>

                {/* Progress steps */}
                <Paper elevation={3} sx={{ p: 2.5, borderRadius: 2, flex: 1, minWidth: 360 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                    Progress
                  </Typography>
                  <Stack spacing={2.5}>
                    {["Thermal Image Upload", "AI Analysis", "Thermal Image Review", "Report Generation"].map((step, idx) => (
                      <Box key={step}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: "#E9EAF3", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "#6B7280" }}>
                              {idx + 1}
                            </Box>
                            <Typography variant="body2" fontWeight={600}>
                              {step}
                            </Typography>
                          </Stack>
                          <Chip size="small" label="Pending" sx={{ height: 22, fontSize: 12, fontWeight: 600, color: "#F59E0B", bgcolor: "#FFF7ED" }} />
                        </Stack>
                        <Box sx={{ mt: 1, height: 6, borderRadius: 999, bgcolor: "#EAEAF2" }} />
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Stack>
            )}
          </Stack>
        </Box>
      </Box>

      {/* ===== Upload Image Dialog ===== */}
      <Dialog
        open={uploadOpen}
        onClose={handleCloseUpload}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 1.5, boxShadow: "0 10px 36px rgba(15,23,42,0.22)" },
        }}
      >
        <DialogTitle sx={{ px: 3, py: 1.75 }}>
          <Typography variant="h6" fontWeight={700}>
            Upload Thermal Image
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, pt: 1.25, pb: 1.5, bgcolor: "#FBFBFE", minHeight: 300 }}>
          <Box
            sx={{
              my: 2,
              p: 2,
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 2,
              textAlign: "center",
              bgcolor: "white",
            }}
          >
            {preview ? (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.25 }}>
                <img src={preview} alt="preview" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 10, objectFit: "contain" }} />
                <Typography variant="body2" color="text.secondary">
                  {file?.name}
                </Typography>
                <Button
                  size="medium"
                  onClick={() => {
                    setFile(null);
                    if (preview) URL.revokeObjectURL(preview);
                    setPreview(null);
                  }}
                  sx={{ px: 2.25, py: 0.65, fontSize: 14 }}
                >
                  Choose another file
                </Button>
              </Box>
            ) : (
              <>
                <Typography variant="body1" gutterBottom fontWeight={600}>
                  Drag & drop an image here
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  or click the button below to browse your device
                </Typography>
                <Button component="label" variant="outlined" size="medium" sx={{ mt: 2, px: 4, py: 0.85, fontSize: 14, borderRadius: 999 }}>
                  Select image
                  <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                </Button>
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.25 }}>
          <Button onClick={handleCloseUpload} size="medium" sx={{ px: 2.25, py: 0.6, fontSize: 14 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            size="medium"
            onClick={handleConfirmUpload}
            disabled={!file}
            sx={{ px: 2.75, py: 0.75, fontSize: 14, fontWeight: 700, borderRadius: 999 }}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
