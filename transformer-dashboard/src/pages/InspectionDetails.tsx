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
  Cloud as CloudIcon,
  WbSunny as SunnyIcon,
  Thunderstorm as RainIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";

/* API Service */
const API_BASE_URL = 'http://localhost:8080/api';

// ==== Cloudinary (UNSIGNED) helpers ====

const CLOUD_NAME = "djgapcqtj";
const UNSIGNED_PRESET = "transformer_images_upload_unsigned";

async function uploadUnsignedToCloudinary(file: File) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UNSIGNED_PRESET); // preset enforces folder/limits

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
  const resp = await fetch(url, { method: "POST", body: form });
  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(`Cloudinary upload failed: ${resp.status} ${err}`);
  }
  // contains secure_url, public_id, resource_type, etc.
  return resp.json() as Promise<{
    secure_url: string;
    public_id: string;
    resource_type: string;
  }>;
}

async function saveImageMetadata(body: {
  imageUrl: string;
  type: string; // "thermal" | "baseline"
  weatherCondition: string; // "Sunny" | "Cloudy" | "Rainy"
  inspectionId: number;
}) {
  const res = await fetch(`${API_BASE_URL}/images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(res.statusText || "Failed to save image metadata");
  return res.json();
}

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
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { borderRadius: 16 } },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", borderRadius: 14, fontWeight: 600 },
      },
    },
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
      <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1 }}>
        {top}
      </Typography>
      <Typography
        sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.2 }}
      >
        {bottom}
      </Typography>
    </Box>
  );
}

// function BaselineGroup({ onView, onDelete }: { onView: () => void; onDelete: () => void }) {
//   return (
//     <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, bgcolor: "#EEF0F6", borderRadius: 3, px: 1, py: 0.75 }}>
//       <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
//         <ImageIcon sx={{ fontSize: 18, color: "#667085" }} />
//         <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#344054" }}>Baseline Image</Typography>
//       </Box>
//       <IconButton size="small" sx={{ width: 28, height: 28, bgcolor: "white", border: (t) => `1px solid ${t.palette.divider}` }} onClick={onView}>
//         <VisibilityIcon fontSize="inherit" sx={{ fontSize: 16, color: "#344054" }} />
//       </IconButton>
//       <IconButton size="small" onClick={onDelete} sx={{ width: 28, height: 28, bgcolor: "white", border: (t) => `1px solid ${t.palette.divider}`, color: "error.main" }}>
//         <DeleteOutlineIcon fontSize="inherit" sx={{ fontSize: 16 }} />
//       </IconButton>
//     </Box>
//   );
// }

/* Local types */
type Weather = "Sunny" | "Cloudy" | "Rainy";
type BaselineImage = { url: string; updatedAt: string; by?: string };
type Baselines = Partial<Record<Weather, BaselineImage>>;

/* ----- Page ----- */
export default function InspectionDetails() {
  const { transformerNo = "AZ-8801", inspectionNo = "000123589" } = useParams();

  // Adjust this if your route param isn't the DB primary key.
  //const inspectionId = Number(inspectionNo);
  const inspectionId = 1; // hardcoded for now

  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const inspectedAt = "Mon(21), May, 2023 12:55pm";
  const lastUpdated = "Mon(21), May, 2023 12:55pm";
  const [weather, setWeather] = React.useState<Weather>("Sunny");

  // Thermal upload dialog
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  // Progress overlay state
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const tickRef = React.useRef<number | null>(null);

  // Baselines state
  const [baselines, setBaselines] = React.useState<Baselines>({
    Sunny: {
      url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
      updatedAt: new Date().toISOString(),
      by: "Olivera",
    },
  });

  // Manage per-weather baseline dialogs
  const [manageWeather, setManageWeather] = React.useState<Weather | null>(
    null
  );
  const [managePreview, setManagePreview] = React.useState<string | null>(null);
  const [manageFile, setManageFile] = React.useState<File | null>(null);
  const [viewer, setViewer] = React.useState<{
    open: boolean;
    url?: string;
    weather?: Weather;
  }>({ open: false });

  /* ---------- Thermal upload handlers ---------- */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f ?? null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const startUploadProgress = () => {
    setIsUploading(true);
    setProgress(0);
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (tickRef.current) window.clearInterval(tickRef.current);
          return 100;
        }
        return p + 2; // simulate
      });
    }, 120);
  };

  const cancelUploadProgress = () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    setIsUploading(false);
    setProgress(0);
  };

  // const handleConfirmUpload = () => {
  //   setUploadOpen(false);
  //   startUploadProgress(); // show overlay and begin progress
  // };

  const handleConfirmUpload = async () => {
    if (!file) return;
    setUploadOpen(false);
    startUploadProgress(); // keep your overlay/progress UI

    try {
      // 1) Upload directly to Cloudinary (unsigned)
      const data = await uploadUnsignedToCloudinary(file); // -> { secure_url, ... }

      // 2) Persist URL in backend
      await saveImageMetadata({
        imageUrl: data.secure_url,
        type: "thermal",
        weatherCondition: weather,
        inspectionId,
      });

      // 3) Cleanup local preview/file
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
      setFile(null);
      setPreview(null);
      // Your existing effect will navigate once progress reaches 100%
    } catch (e) {
      console.error(e);
      alert((e as Error).message || "Upload failed");
      cancelUploadProgress();
    }
  };

  const handleCloseUpload = () => setUploadOpen(false);

  // When progress finishes, go to comparison page
  React.useEffect(() => {
    if (!isUploading || progress < 100) return;

    const t = setTimeout(() => {
      navigate(`/${transformerNo}/${inspectionNo}/comparison`, {
        replace: true,
        state: { weather },
      });
    }, 650);

    return () => clearTimeout(t);
  }, [isUploading, progress, transformerNo, inspectionNo, navigate, weather]);

  React.useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  /* ---------- Baseline handlers ---------- */
  const openUploadFor = (w: Weather) => {
    setManageWeather(w);
    if (managePreview) URL.revokeObjectURL(managePreview);
    setManageFile(null);
    setManagePreview(null);
  };
  const closeUploadFor = () => {
    setManageWeather(null);
    if (managePreview) URL.revokeObjectURL(managePreview);
    setManagePreview(null);
    setManageFile(null);
  };
  const onPickBaselineFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setManageFile(f);
    if (managePreview) URL.revokeObjectURL(managePreview);
    setManagePreview(f ? URL.createObjectURL(f) : null);
  };
  // const confirmBaselineUpload = () => {
  //   if (!manageWeather || !managePreview) return;
  //   setBaselines((b) => ({
  //     ...b,
  //     [manageWeather]: { url: managePreview, updatedAt: new Date().toISOString(), by: "You" },
  //   }));
  //   setManageWeather(null);
  // };

  const confirmBaselineUpload = async () => {
    if (!manageWeather || !manageFile) return;
    try {
      // 1) Upload to Cloudinary (unsigned)
      const data = await uploadUnsignedToCloudinary(manageFile);

      // 2) Save URL in DB
      await saveImageMetadata({
        imageUrl: data.secure_url,
        type: "baseline",
        weatherCondition: manageWeather,
        inspectionId,
      });

      // 3) Reflect actual Cloudinary URL in UI
      setBaselines((b) => ({
        ...b,
        [manageWeather]: {
          url: data.secure_url,
          updatedAt: new Date().toISOString(),
          by: "You",
        },
      }));

      // 4) Cleanup & close
      if (managePreview?.startsWith("blob:"))
        URL.revokeObjectURL(managePreview);
      setManagePreview(null);
      setManageFile(null);
      setManageWeather(null);
    } catch (e) {
      console.error(e);
      alert((e as Error).message || "Baseline upload failed");
    }
  };

  const deleteBaseline = (w: Weather) => {
    if (!baselines[w]) return;
    if (window.confirm(`Delete ${w} baseline image? This cannot be undone.`)) {
      setBaselines((b) => {
        const copy = { ...b };
        try {
          if (copy[w]?.url?.startsWith("blob:"))
            URL.revokeObjectURL(copy[w]!.url);
        } catch {
          // Intentionally left blank: ignore errors when revoking object URL
        }
        delete copy[w];
        return copy;
      });
    }
  };
  const viewBaseline = (w: Weather) => {
    const url = baselines[w]?.url;
    if (!url) return;
    setViewer({ open: true, url, weather: w });
  };

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
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{ ml: 1 }}
          >
            <Avatar
              src="https://i.pravatar.cc/64?img=1"
              sx={{ width: 36, height: 36 }}
            />
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
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
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
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main */}
      <Box sx={{ display: "flex", bgcolor: "background.default" }}>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 1 },
            mt: 8,
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          <Stack spacing={2}>
            {/* ===== Header ===== */}
            <Paper elevation={3} sx={{ p: 2.25, borderRadius: 1 }}>
              <Stack
                direction="row"
                alignItems="stretch"
                sx={{ width: "100%" }}
              >
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
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          bgcolor: "#FFFFFF",
                          borderRadius: "50%",
                        }}
                      />
                    </Box>
                    <Typography variant="h6" fontWeight={800}>
                      {inspectionNo}
                    </Typography>
                    <IconButton size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: "block", textAlign: "left" }}
                  >
                    {inspectedAt}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 1.25 }}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <StatPill top={transformerNo} bottom="Transformer No" />
                    <StatPill top="EN-122-A" bottom="Pole No" />
                    <StatPill top="Nugegoda" bottom="Branch" />
                    <StatPill top="A-110" bottom="Inspected By" />
                  </Stack>
                </Box>

                {/* Right */}
                <Stack
                  direction="column"
                  alignItems="flex-end"
                  justifyContent="space-between"
                  sx={{ alignSelf: "stretch", minWidth: 350, py: 0.5 }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Chip
                      label="In progress"
                      color="success"
                      variant="outlined"
                      sx={{
                        height: 28,
                        fontWeight: 700,
                        borderColor: "success.light",
                        color: "success.main",
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    Last updated: {lastUpdated}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            {/* ===== CONTENT AREA ===== */}
            {isUploading ? (
              /* -------- FULL-WIDTH PROGRESS OVERLAY (replaces Baseline + Thermal + Progress) -------- */
              <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
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
                  <Typography fontWeight={700}>
                    Thermal image uploading.
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Thermal image is being uploaded and Reviewed.
                  </Typography>
                  <Box
                    sx={{ mt: 3, mx: "auto", width: { xs: "100%", sm: "70%" } }}
                  >
                    <Box
                      sx={{ height: 8, borderRadius: 999, bgcolor: "#E5E7EB" }}
                    >
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
                    <Box
                      sx={{
                        mt: 0.5,
                        textAlign: "right",
                        color: "text.secondary",
                        fontSize: 12,
                      }}
                    >
                      {progress}%
                    </Box>
                  </Box>
                  <Button
                    onClick={cancelUploadProgress}
                    sx={{ mt: 3, borderRadius: 999 }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Paper>
            ) : (
              <>
                {/* ===== Baseline Images card ===== */}
                <Paper elevation={3} sx={{ p: 2.25, borderRadius: 1 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 1 }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ImageIcon sx={{ color: "primary.main" }} />
                      <Typography variant="subtitle1" fontWeight={800}>
                        Baseline Images
                      </Typography>
                    </Stack>
                    <Chip
                      size="small"
                      label={`Selected Weather: ${weather}`}
                      sx={{ bgcolor: "#EEF0F6", fontWeight: 600 }}
                    />
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={2}
                    justifyContent="space-between"
                    sx={{ width: "100%" }}
                  >
                    {(["Sunny", "Cloudy", "Rainy"] as const).map((w) => {
                      const item = baselines[w];
                      const available = Boolean(item?.url);
                      const Icon =
                        w === "Sunny"
                          ? SunnyIcon
                          : w === "Cloudy"
                          ? CloudIcon
                          : RainIcon;

                      return (
                        <Paper
                          key={w}
                          variant="outlined"
                          sx={{
                            width: 240,
                            height: 240,
                            flex: 1,
                            p: 1.5,
                            borderRadius: 1.5,
                            borderStyle: available ? "solid" : "dashed",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mb: 1 }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Icon fontSize="small" />
                              <Typography fontWeight={700}>{w}</Typography>
                            </Stack>
                            <Chip
                              size="small"
                              label={available ? "Available" : "Not set"}
                              color={available ? "success" : "default"}
                              variant="outlined"
                            />
                          </Stack>

                          <Box
                            sx={{
                              flexGrow: 1,
                              borderRadius: 1.5,
                              overflow: "hidden",
                              bgcolor: "#F3F4F6",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mb: 1,
                              height: 140,
                            }}
                          >
                            {available ? (
                              <img
                                src={item!.url}
                                alt={`${w} baseline`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                            ) : (
                              <Stack
                                alignItems="center"
                                spacing={0.5}
                                sx={{ color: "text.secondary" }}
                              >
                                <UploadIcon fontSize="small" />
                                <Typography variant="caption">
                                  No image uploaded
                                </Typography>
                              </Stack>
                            )}
                          </Box>

                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            {!available ? (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => openUploadFor(w)}
                              >
                                Upload
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => viewBaseline(w)}
                                >
                                  View
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => deleteBaseline(w)}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Paper>

                {/* ===== Thermal Image card + Progress steps (normal view) ===== */}
                <Stack
                  direction={{ xs: "column", lg: "row" }}
                  spacing={2}
                  alignItems="stretch"
                >
                  {/* Thermal Image */}
                  <Paper
                    elevation={3}
                    sx={{ p: 2.5, borderRadius: 2, flex: 1 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Thermal Image
                      </Typography>
                      <Chip
                        size="small"
                        label="Pending"
                        sx={{
                          height: 22,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#F59E0B",
                          bgcolor: "#FFF7ED",
                        }}
                      />
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 2, textAlign: "left" }}
                    >
                      Upload a thermal image of the transformer to identify
                      potential issues.
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        Weather Condition
                      </Typography>
                      <FormControl size="small" fullWidth sx={{ mt: 1.5 }}>
                        <Select
                          value={weather}
                          onChange={(e) =>
                            setWeather(e.target.value as Weather)
                          }
                        >
                          <MenuItem value="Sunny">Sunny</MenuItem>
                          <MenuItem value="Cloudy">Cloudy</MenuItem>
                          <MenuItem value="Rainy">Rainy</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        mt: 3,
                        borderRadius: 999,
                        py: 1.1,
                        fontWeight: 700,
                      }}
                      onClick={() => setUploadOpen(true)}
                      disabled={!baselines[weather]?.url} // only enabled when baseline exists for selected weather
                    >
                      Upload Thermal Image
                    </Button>
                  </Paper>

                  {/* Progress steps (kept for normal view) */}
                  <Paper
                    elevation={3}
                    sx={{ p: 2.5, borderRadius: 2, flex: 1, minWidth: 360 }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{ mb: 2 }}
                    >
                      Progress
                    </Typography>
                    <Stack spacing={2.5}>
                      {[
                        "Thermal Image Upload",
                        "AI Analysis",
                        "Thermal Image Review",
                        "Report Generation",
                      ].map((step, idx) => (
                        <Box key={step}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Box
                                sx={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: "50%",
                                  bgcolor: "#E9EAF3",
                                  display: "grid",
                                  placeItems: "center",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#6B7280",
                                }}
                              >
                                {idx + 1}
                              </Box>
                              <Typography variant="body2" fontWeight={600}>
                                {step}
                              </Typography>
                            </Stack>
                            <Chip
                              size="small"
                              label="Pending"
                              sx={{
                                height: 22,
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#F59E0B",
                                bgcolor: "#FFF7ED",
                              }}
                            />
                          </Stack>
                          <Box
                            sx={{
                              mt: 1,
                              height: 6,
                              borderRadius: 999,
                              bgcolor: "#EAEAF2",
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Stack>
              </>
            )}
          </Stack>
        </Box>
      </Box>

      {/* ===== Upload Thermal Image Dialog ===== */}
      <Dialog
        open={uploadOpen}
        onClose={handleCloseUpload}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 1.5,
            boxShadow: "0 10px 36px rgba(15,23,42,0.22)",
          },
        }}
      >
        <DialogTitle sx={{ px: 3, py: 1.75 }}>
          <Typography variant="h6" fontWeight={700}>
            Upload Thermal Image
          </Typography>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ px: 3, pt: 1.25, pb: 1.5, bgcolor: "#FBFBFE", minHeight: 300 }}
        >
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
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1.25,
                }}
              >
                <img
                  src={preview}
                  alt="preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 200,
                    borderRadius: 10,
                    objectFit: "contain",
                  }}
                />
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
                <Button
                  component="label"
                  variant="outlined"
                  size="medium"
                  sx={{
                    mt: 2,
                    px: 4,
                    py: 0.85,
                    fontSize: 14,
                    borderRadius: 999,
                  }}
                >
                  Select image
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.25 }}>
          <Button
            onClick={handleCloseUpload}
            size="medium"
            sx={{ px: 2.25, py: 0.6, fontSize: 14 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="medium"
            onClick={handleConfirmUpload}
            disabled={!file}
            sx={{
              px: 2.75,
              py: 0.75,
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 999,
            }}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Manage Baseline Upload Dialog ===== */}
      <Dialog
        open={Boolean(manageWeather)}
        onClose={closeUploadFor}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            {baselines[manageWeather as Weather] ? "Replace" : "Upload"}{" "}
            {manageWeather ?? ""} Baseline
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "#FBFBFE" }}>
          <Box
            sx={{
              my: 1,
              p: 2,
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 2,
              textAlign: "center",
              bgcolor: "white",
            }}
          >
            {managePreview ? (
              <img
                src={managePreview}
                alt="baseline preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: 280,
                  borderRadius: 10,
                  objectFit: "contain",
                }}
              />
            ) : baselines[manageWeather as Weather]?.url ? (
              <img
                src={baselines[manageWeather as Weather]!.url}
                alt="current baseline"
                style={{
                  maxWidth: "100%",
                  maxHeight: 280,
                  borderRadius: 10,
                  objectFit: "contain",
                }}
              />
            ) : (
              <Typography color="text.secondary">No image selected</Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadIcon />}
              >
                Choose image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={onPickBaselineFile}
                />
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.25 }}>
          <Button onClick={closeUploadFor}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!manageFile && !managePreview}
            onClick={confirmBaselineUpload}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Baseline Viewer ===== */}
      <Dialog
        open={viewer.open}
        onClose={() => setViewer({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography fontWeight={700}>
            View {viewer.weather} Baseline
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {viewer.url ? (
            <img
              src={viewer.url}
              alt="baseline"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: 8,
              }}
            />
          ) : (
            <Typography>No image</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewer({ open: false })}>Close</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
