import * as React from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
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
  TextField,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import {
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  List as ListIcon,
  MoreVert as MoreVertIcon,
  Cloud as CloudIcon,
  WbSunny as SunnyIcon,
  Thunderstorm as RainIcon,
  Upload as UploadIcon,
  Visibility as VisibilityIcon,
  DeleteOutline as DeleteOutlineIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterFocusStrongIcon,
  Close as CloseIcon,
  Logout as LogoutIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PowerLensBranding from "../components/PowerLensBranding";
import ThermalImageAnalysis from "../components/ThermalImageAnalysis";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";

/* API Service */
const API_BASE_URL = "http://localhost:8080/api";

// ==== Cloudinary (UNSIGNED) helpers ====

const CLOUD_NAME = "ddleqtgrj"; //"djgapcqtj";
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
  transformerNo: string;
}) {
  const res = await fetch(`${API_BASE_URL}/images`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authService.getAuthHeader(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error(res.statusText || "Failed to save image metadata");
  return res.json();
}

async function fetchBaselineImage(transformerNo: string, weather: Weather) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/images/baseline?transformerNo=${encodeURIComponent(
        transformerNo
      )}&weatherCondition=${encodeURIComponent(weather)}`,
      {
        headers: {
          ...authService.getAuthHeader(),
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      url: data.imageUrl,
      updatedAt: data.updatedAt || new Date().toISOString(),
      by: data.uploadedBy || "Unknown",
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}

const drawerWidth = 200;

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

/* Local types */
type Weather = "Sunny" | "Cloudy" | "Rainy";
type BaselineImage = { url: string; updatedAt: string; by?: string };
type Baselines = Partial<Record<Weather, BaselineImage>>;
type ImageStatus = "baseline" | "maintenance" | "no image";

/* ----- Page ----- */
export default function InspectionDetails() {
  const { transformerNo = "AZ-8801", inspectionNo = "000123589" } = useParams();
  const inspectionId = Number(inspectionNo);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Smart back navigation function
  const handleBackNavigation = () => {
    // Check if we came from transformer inspection page
    const fromTransformerInspection =
      location.state?.from === "transformer-inspection";
    const transformerNo = location.state?.transformerNo;

    if (fromTransformerInspection && transformerNo) {
      // Navigate back to transformer inspection page
      navigate(`/${transformerNo}`);
    } else {
      // Navigate back to main dashboard with inspections view
      navigate("/?view=inspections");
    }
  };

  const [weather, setWeather] = React.useState<Weather>("Sunny");

  // Thermal upload dialog
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  // Progress overlay state
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const tickRef = React.useRef<number | null>(null);
  // After upload: prompt for percentage
  const [rulesetOpen, setRulesetOpen] = React.useState(false);
  const [percentage, setPercentage] = React.useState<string>("25");
  // Track dialog open state only (no separate awaiting flag needed now)
  // Track that backend upload/metadata is done; we'll show ruleset after progress hits 100
  const [uploadCompleted, setUploadCompleted] = React.useState(false);
  // Ref to analysis section for smooth scroll after saving
  const analysisRef = React.useRef<HTMLDivElement | null>(null);
  // Save threshold state and snackbar
  const [savingThreshold, setSavingThreshold] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", severity: "success" });
  // Latch to ensure the ruleset dialog opens only once per upload cycle
  const hasShownRulesetRef = React.useRef(false);

  // Centralized close that also resets the effect conditions
  const handleCloseRuleset = React.useCallback(() => {
    setRulesetOpen(false);
    // stop the uploading overlay and progress (inline to avoid order issues)
    if (tickRef.current) window.clearInterval(tickRef.current);
    setIsUploading(false);
    setProgress(0);
    // reset markers so the effect won't reopen the dialog
    setUploadCompleted(false);
    hasShownRulesetRef.current = false; // ready for next upload cycle
  }, []);

  // Baselines state
  const [baselines, setBaselines] = React.useState<Baselines>({
    Sunny: undefined,
    Cloudy: undefined,
    Rainy: undefined,
  });

  const [inspectionDetails, setInspectionDetails] = React.useState({
    poleNo: "",
    branch: "",
    inspectedBy: "",
    inspectedAt: "",
    createdAt: "",
    lastUpdated: "",
    image: {
      url: "",
      type: "",
      weatherCondition: "",
    },
  });

  type InspectionImage = {
    imageUrl: string;
    type: string;
    weatherCondition: string;
  };

  type Inspection = {
    image?: InspectionImage;
    branch?: string;
    inspector?: string;
    transformerNo?: string;
    transformer?: { transformerNo?: string };
  };

  /* Helper function to determine image status */
  const determineImageStatus = (inspection: Inspection | null): ImageStatus => {
    if (!inspection || !inspection.image) {
      return "no image";
    }

    if (inspection.image.type === "baseline") {
      return "baseline";
    }

    return "maintenance";
  };

  /* Helper function to render status chip */
  const renderStatusChip = (
    status: ImageStatus,
    size: "small" | "medium" = "medium"
  ) => {
    const statusConfig = {
      baseline: {
        label: "Baseline",
        color: "success" as const,
        borderColor: "#059669",
      },
      maintenance: {
        label: "Maintenance",
        color: "error" as const,
        borderColor: "#DC2626",
      },
      "no image": {
        label: "Pending",
        color: "default" as const,
        borderColor: "#e8a60dff",
      },
    };

    const config = statusConfig[status];
    const chipHeight = size === "small" ? 22 : 28;
    const fontSize = size === "small" ? 12 : 14;

    return (
      <Chip
        size={size}
        label={config.label}
        color={config.color}
        variant="outlined"
        sx={{
          height: chipHeight,
          fontSize: fontSize,
          fontWeight: 600,
          borderColor: config.borderColor,
          color: config.borderColor,
          bgcolor:
            size === "small"
              ? status === "baseline"
                ? "#F0FDF4"
                : status === "maintenance"
                ? "#FEF2F2"
                : "#F9FAFB"
              : "transparent",
        }}
      />
    );
  };

  /* ZoomableImage component with zoom and pan functionality */
  interface ZoomableImageProps {
    src: string;
    alt: string;
    style?: React.CSSProperties;
    maxHeight?: number;
  }

  const ZoomableImage: React.FC<ZoomableImageProps> = ({
    src,
    alt,
    style,
    maxHeight = 400,
  }) => {
    const [scale, setScale] = React.useState(1);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
    const containerRef = React.useRef<HTMLDivElement>(null);

    const handleZoomIn = () => {
      setScale((prev) => Math.min(prev * 1.2, 5));
    };

    const handleZoomOut = () => {
      setScale((prev) => Math.max(prev / 1.2, 0.5));
    };

    const handleReset = () => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        });
      }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging && scale > 1) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 / 1.1 : 1.1;
      setScale((prev) => Math.min(Math.max(prev * delta, 0.5), 5));
    };

    return (
      <Box sx={{ position: "relative", ...style }}>
        {/* Image Container */}
        <Box
          ref={containerRef}
          sx={{
            width: "100%",
            height: maxHeight,
            overflow: "hidden",
            borderRadius: 2,
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#f5f5f5",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <img
            src={src}
            alt={alt}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? "none" : "transform 0.2s ease",
              borderRadius: 12,
              objectFit: "contain",
              userSelect: "none",
              pointerEvents: "none",
            }}
            draggable={false}
          />
        </Box>

        {/* Zoom Controls */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            bgcolor: "rgba(255, 255, 255, 0.9)",
            borderRadius: 1,
            p: 0.5,
            boxShadow: 1,
          }}
        >
          <IconButton size="small" onClick={handleZoomIn} disabled={scale >= 5}>
            <ZoomInIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOutIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleReset}>
            <CenterFocusStrongIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Scale Indicator */}
        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            left: 8,
            bgcolor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {Math.round(scale * 100)}%
        </Box>
      </Box>
    );
  };

  const [inspection, setInspection] = React.useState<Inspection | null>(null);

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

  const [baselineImage, setBaselineImage] = React.useState<{
    url: string;
    updatedAt: string;
    by?: string;
  } | null>(null);

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

  const cancelUploadProgress = React.useCallback(() => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    setIsUploading(false);
    setProgress(0);
  }, []);

  const handleConfirmUpload = async () => {
    if (!file) return;
    setUploadOpen(false);
    startUploadProgress(); 

    try {
      // 1) Upload directly to Cloudinary (unsigned)
      const data = await uploadUnsignedToCloudinary(file); // -> { secure_url, ... }

      // 2) Persist URL in backend
      await saveImageMetadata({
        imageUrl: data.secure_url,
        type: "thermal",
        weatherCondition: weather,
        inspectionId,
        transformerNo,
      });

      // 3) Cleanup local preview/file
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
      setFile(null);
      setPreview(null);
      // Mark upload completed; ruleset will open once progress UI reaches 100
      setUploadCompleted(true);
    } catch (e) {
      console.error(e);
      alert((e as Error).message || "Upload failed");
      cancelUploadProgress();
    }
  };

  const handleCloseUpload = () => setUploadOpen(false);

  async function saveThreshold() {
    const val = Math.max(0, Math.min(100, Number(percentage) || 0));
    try {
      setSavingThreshold(true);
      const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/inference/config/class-threshold`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authService.getAuthHeader(),
        },
        body: JSON.stringify({ percentage: val }),
      });
      if (!res.ok && res.status !== 204) {
        throw new Error(`Failed: ${res.status} ${res.statusText}`);
      }
      setSnackbar({ open: true, message: `Ruleset saved: ${val}%`, severity: "success" });
      // Refresh inspection details to pick up new image URL and then scroll to analysis
      try {
        const res2 = await fetch(`${API_BASE_URL}/inspections/${inspectionNo}`, {
          headers: {
            ...authService.getAuthHeader(),
          },
        });
        if (res2.ok) {
          const data = await res2.json();
          setInspection(data);
          // Smooth scroll to analysis section
          setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
        }
      } catch { console.warn('Failed to refresh inspection after saving threshold'); }
    } catch (err) {
      setSnackbar({ open: true, message: `Failed to update threshold: ${(err as Error).message}` , severity: "error"});
    } finally {
      setSavingThreshold(false);
      // Close dialog and reset the upload flags so effect doesn't reopen
      handleCloseRuleset();
    }
  }

  React.useEffect(() => {
    if (inspectionDetails.image && inspectionDetails.image.weatherCondition) {
      setWeather(inspectionDetails.image.weatherCondition as Weather);
    }
  }, [inspectionDetails.image]);

  React.useEffect(() => {
    async function getInspection() {
      if (!inspectionNo) return;
      try {
        const res = await fetch(`${API_BASE_URL}/inspections/${inspectionNo}`, {
          headers: {
            ...authService.getAuthHeader(),
          },
        });
        if (!res.ok) throw new Error("Failed to fetch inspection");
        const data = await res.json();
        setInspection(data);
      } catch (e) {
        console.error(e);
      }
    }
    getInspection();
  }, [inspectionNo]);

  React.useEffect(() => {
    async function getBaselineImage() {
      if (!transformerNo || !weather) return;
      const image = await fetchBaselineImage(transformerNo, weather);
      setBaselineImage(image);
    }
    getBaselineImage();
  }, [transformerNo, weather]);

  // Fetch transformer details by transformerNo
  React.useEffect(() => {
    async function fetchInspectionDetails() {
      if (!transformerNo) return;
      try {
        const res1 = await fetch(
          `${API_BASE_URL}/transformers/${encodeURIComponent(transformerNo)}`,
          {
            headers: {
              ...authService.getAuthHeader(),
            },
          }
        );
        if (!res1.ok) throw new Error("Failed to fetch transformer details");
        const transformerData = await res1.json();
        const res2 = await fetch(
          `${API_BASE_URL}/inspections/${encodeURIComponent(inspectionNo)}`,
          {
            headers: {
              ...authService.getAuthHeader(),
            },
          }
        );
        if (!res2.ok) throw new Error("Failed to fetch inspection details");
        const inspectionData = await res2.json();
        setInspectionDetails({
          poleNo: transformerData.poleNo,
          branch: inspectionData.branch,
          inspectedBy: inspectionData.inspector,
          inspectedAt: inspectionData.inspectionTime
            ? format(
                new Date(inspectionData.inspectionTime),
                "yyyy-MM-dd HH:mm"
              )
            : "",
          createdAt: inspectionData.createdAt
            ? format(new Date(inspectionData.createdAt), "yyyy-MM-dd HH:mm")
            : "",
          lastUpdated: inspectionData.updatedAt
            ? format(new Date(inspectionData.updatedAt), "yyyy-MM-dd HH:mm")
            : "",
          image: inspectionData.image || {
            url: "",
            type: "",
            weatherCondition: "",
          },
        });
      } catch (e) {
        console.error(e);
      }
    }
    fetchInspectionDetails();
  }, [transformerNo, inspectionNo]);

  // When progress finishes, show ruleset if upload done; don't reload automatically
  React.useEffect(() => {
    if (!isUploading || progress < 100) return;
    if (rulesetOpen) return;
    if (uploadCompleted && !hasShownRulesetRef.current) {
      hasShownRulesetRef.current = true; // latch so it won't reopen
      setPercentage("25");
      setRulesetOpen(true);
      // Keep the uploading overlay visible at 100% until user saves the ruleset
    }
  }, [isUploading, progress, uploadCompleted, rulesetOpen]);
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
        transformerNo,
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

      // 5) Reload the page to reflect the new baseline image
      window.location.reload();
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
          // Ignore
        }
        delete copy[w];
        return copy;
      });
    }
  };
  const viewBaseline = (w: Weather) => {
    const url = baselineImage?.url; 
    if (!url) return;
    setViewer({ open: true, url, weather: w });
  };

  /* Drawer */
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
          <ListItemButton onClick={() => navigate("/?view=inspections")}>
            <ListItemIcon>
              <SearchIcon />
            </ListItemIcon>
            <ListItemText primary="Inspections" />
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
          <Stack direction="row" spacing={1.25} alignItems="center">
            <IconButton
              onClick={handleBackNavigation}
              sx={{ color: "inherit" }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Inspection Details
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
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            ) : (
              <>
                <Avatar src={user?.avatar || "./user.png"} sx={{ width: 36, height: 36 }} />
                <Box sx={{ display: { xs: "none", md: "block" } }}>
                  <Typography variant="subtitle2" sx={{ lineHeight: 1 }}>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={logout} title="Logout">
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
            <Paper
              elevation={3}
              sx={{ p: 2.25, borderRadius: 1, position: "relative" }}
            >
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

                  {/* Updated section with both inspection date and last updated */}
                  <Stack direction="row" spacing={3} sx={{ mt: 0.5 }}>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          textAlign: "left",
                          fontWeight: 600,
                        }}
                      >
                        Inspected At
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.primary"
                        sx={{ display: "block", textAlign: "left" }}
                      >
                        {inspectionDetails.inspectedAt}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          textAlign: "left",
                          fontWeight: 600,
                        }}
                      >
                        Last Updated
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.primary"
                        sx={{ display: "block", textAlign: "left" }}
                      >
                        {inspectionDetails.lastUpdated
                          ? inspectionDetails.lastUpdated
                          : inspectionDetails.createdAt}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 1.25 }}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <StatPill top={transformerNo} bottom="Transformer No" />
                    <StatPill top={inspectionDetails.poleNo} bottom="Pole No" />
                    <StatPill top={inspectionDetails.branch} bottom="Branch" />
                    <StatPill
                      top={inspectionDetails.inspectedBy}
                      bottom="Inspected By"
                    />
                  </Stack>
                </Box>

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
                    {renderStatusChip(determineImageStatus(inspection))}
                  </Box>
                </Stack>
              </Stack>

              {/* Baseline Image Small Card - Bottom Right Corner (inline style) */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 16,
                  right: 16,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  bgcolor: "#EEF0F6",
                  borderRadius: 3,
                  px: 1,
                  py: 0.75,
                }}
              >
                {baselineImage ? (
                  <>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.75,
                      }}
                    >
                      {weather === "Sunny" && (
                        <SunnyIcon sx={{ fontSize: 16 }} />
                      )}
                      {weather === "Cloudy" && (
                        <CloudIcon sx={{ fontSize: 16 }} />
                      )}
                      {weather === "Rainy" && (
                        <RainIcon sx={{ fontSize: 16 }} />
                      )}
                      <Typography
                        sx={{ fontWeight: 700, fontSize: 14, color: "#344054" }}
                      >
                        Baseline Image
                      </Typography>
                    </Box>

                    <IconButton
                      onClick={() => viewBaseline(weather)}
                      size="small"
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: "white",
                        border: (t) => `1px solid ${t.palette.divider}`,
                      }}
                    >
                      <VisibilityIcon
                        fontSize="inherit"
                        sx={{ fontSize: 16, color: "#344054" }}
                      />
                    </IconButton>

                    <IconButton
                      onClick={() => deleteBaseline(weather)}
                      size="small"
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: "white",
                        border: (t) => `1px solid ${t.palette.divider}`,
                        color: "error.main",
                      }}
                    >
                      <DeleteOutlineIcon
                        fontSize="inherit"
                        sx={{ fontSize: 16 }}
                      />
                    </IconButton>
                  </>
                ) : (
                  <Button
                    onClick={() => openUploadFor(weather)}
                    variant="contained"
                    size="small"
                    sx={{
                      px: 2,
                      py: 0.75,
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  >
                    Upload Baseline Image
                  </Button>
                )}
              </Box>
            </Paper>

            {/* Action Buttons */}
            <Paper elevation={1} sx={{ p: 1.5, borderRadius: 1 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<DescriptionIcon />}
                  onClick={() => navigate(`/digital-form/${transformerNo}/${inspectionId}`)}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                  }}
                >
                  Digital Form
                </Button>
                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                  }}
                >
                  Refresh
                </Button>
              </Stack>
            </Paper>

            {inspection?.image ? (
              /* ===== Baseline + Thermal (if exists) ===== */
              inspection.image.type === "thermal" ? (
                // Thermal analysis with intelligent bounding boxes
                <div ref={analysisRef}>
                  <ThermalImageAnalysis
                    thermalImageUrl={inspection.image.imageUrl}
                    baselineImageUrl={baselineImage?.url || ""}
                    transformerNo={inspection.transformerNo || inspection.transformer?.transformerNo || transformerNo}
                    inspectionId={inspectionId} // Pass inspectionId prop
                  />
                </div>
              ) : (
                // Baseline only
                <Paper sx={{ p: 2.5 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Baseline Image ({weather})
                  </Typography>
                  <Box mt={2}>
                    {inspection.image.imageUrl ? (
                      <ZoomableImage
                        src={inspection.image.imageUrl}
                        alt="Baseline"
                        style={{ width: "100%" }}
                        maxHeight={200}
                      />
                    ) : (
                      <Typography color="text.secondary">
                        No baseline image available
                      </Typography>
                    )}
                  </Box>
                </Paper>
              )
            ) : isUploading ? (
              /* -------- FULL-WIDTH PROGRESS OVERLAY (replaces Baseline + Thermal + Progress) -------- */
              <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  Maintenance Image
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
                    Maintenance image uploading.
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Maintenance image is being uploaded and Reviewed.
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

                  {/* Show Cancel button only while uploading is in progress (<100%) */}
                  {progress < 100 && (
                    <Button
                      onClick={cancelUploadProgress}
                      sx={{ mt: 3, borderRadius: 999 }}
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
              </Paper>
            ) : (
              <>
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
                        Maintenance Image
                      </Typography>
                      {renderStatusChip(
                        determineImageStatus(inspection),
                        "small"
                      )}
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 2, textAlign: "left" }}
                    >
                      Upload a maintenance image of the transformer to identify
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
                      disabled={!baselineImage} // only enabled when baseline exists for selected weather
                    >
                      Upload Maintenance Image
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
                            {renderStatusChip(
                              determineImageStatus(inspection),
                              "small"
                            )}
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
            Upload Maintenance Image
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
                <ZoomableImage
                  src={preview}
                  alt="preview"
                  style={{ width: "100%" }}
                  maxHeight={200}
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

      {/* ===== Error Ruleset (Temperature Difference) ===== */}
      <Dialog
        open={rulesetOpen}
        onClose={handleCloseRuleset}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={800} fontSize={18} color="text.primary">
            Error Ruleset
          </Typography>
          <IconButton size="small" onClick={handleCloseRuleset}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "#FBFBFE" }}>
          <Stack spacing={1.5}>
            <Typography fontWeight={700}>Temperature Rules</Typography>
            <Typography variant="body2" color="text.secondary">
              Confident threshold for fault detection.
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <TextField
                size="small"
                value={percentage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPercentage(e.target.value.replace(/[^0-9.]/g, ""))
                }
                inputProps={{ inputMode: 'decimal', pattern: '[0-9.]*' }}
                sx={{ width: 120 }}
              />
              <Typography color="text.secondary">%</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={handleCloseRuleset}>Cancel</Button>
          <Button variant="contained" onClick={saveThreshold} disabled={savingThreshold} startIcon={savingThreshold ? <CircularProgress size={16} /> : undefined}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

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
              <ZoomableImage
                src={managePreview}
                alt="baseline preview"
                style={{ width: "100%" }}
                maxHeight={280}
              />
            ) : baselines[manageWeather as Weather]?.url ? (
              <ZoomableImage
                src={baselines[manageWeather as Weather]!.url}
                alt="current baseline"
                style={{ width: "100%" }}
                maxHeight={280}
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
            <ZoomableImage
              src={viewer.url}
              alt="baseline"
              style={{ width: "100%" }}
              maxHeight={window.innerHeight * 0.7}
            />
          ) : (
            <Typography>No image</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewer({ open: false })}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
