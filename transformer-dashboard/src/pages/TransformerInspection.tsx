import * as React from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
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
  Toolbar,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Menu,
  MenuItem,
  Tabs,
  Tab,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  List as ListIcon,
  MoreVert as MoreVertIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Add as AddIcon,
  Place as PlaceIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useParams, useNavigate } from "react-router-dom";
import PowerLensBranding from "../components/PowerLensBranding";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import AddInspectionDialog from "../models/AddInspectionDialog";
import EditInspectionDialog, {
  type InspectionRow as EditInspectionRow,
} from "../models/EditInspectionDialog";
import DeleteInspectionConfirmationDialog from "../models/DeleteInspectionConfirmationDialog";

/* ================= Backend DTOs (inline, no shared files) ================= */
type TransformerType = "Bulk" | "Distribution" | string;

type TransformerDTO = {
  transformerNo: string;
  poleNo: number;
  region: string;
  type: TransformerType;
  createdAt?: string;
  updatedAt?: string;
};

type InspectionDTO = {
  inspectionId: number;
  inspectionTime: string; // "yyyy-MM-ddTHH:mm:ss"
  branch: string;
  inspector: string;
  createdAt?: string;
  updatedAt?: string;
  transformerNo: string;
  image?: {
    type: string;
    url: string;
  } | null;
};

/* ================= Local row (UI) ================= */
type ImageStatus = "baseline" | "maintenance" | "no image";
type InspectionRow = {
  id: number;
  inspectionNo: string;
  inspectedDate: string;
  maintenanceDate?: string;
  status: ImageStatus;
  favorite?: boolean;
  // for editing:
  inspectionTimeIso: string;
  branch: string;
  inspector: string;
  transformerNo: string;
};

type MaintenanceRecordRow = {
  id: number;
  maintenanceFormId: number;
  formNo: string;
  dateAdded: string;
  addedBy: string;
  inspectionId: number;
  inspectionNo: string;
  transformerNo: string;
};

type MaintenanceFormResponse = {
  maintenanceFormId?: number;
  inspectionId: number;
  transformerNo: string;
  thermalInspection?: Record<string, unknown>;
  maintenanceRecord?: Record<string, unknown>;
  workDataSheet?: Record<string, unknown>;
};

/* ================= Tiny inline HTTP helper ================= */
const API_BASE =
  (import.meta.env as { VITE_API_BASE_URL?: string }).VITE_API_BASE_URL ??
  "http://localhost:8080/api";

async function http<T>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const headers = new Headers(init?.headers || {});
  if (init?.json !== undefined) headers.set("Content-Type", "application/json");

  // Add authentication headers
  const authHeaders = authService.getAuthHeader();
  Object.entries(authHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  // Handle 204 or empty response bodies gracefully
  if (res.status === 204) return undefined as unknown as T;
  const text = await res.text();
  if (!text) return undefined as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/* ================= Helpers ================= */
function pad8(n: number | string) {
  return String(n).padStart(8, "0");
}
function toLocal(dt: string) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}
function determineImageStatus(dto: InspectionDTO): ImageStatus {
  // Determine image status based on the image field
  if (!dto.image || !dto.image.type) {
    return "no image";
  }

  // If the image type is explicitly baseline, return baseline
  if (dto.image.type === "baseline") {
    return "baseline";
  }

  // If the image type is thermal/maintenance, return maintenance
  if (dto.image.type === "thermal" || dto.image.type === "maintenance") {
    return "maintenance";
  }

  // Default fallback - treat any other image as maintenance
  return "maintenance";
}
function dtoToRow(dto: InspectionDTO): InspectionRow {
  return {
    id: dto.inspectionId,
    inspectionNo: pad8(dto.inspectionId),
    inspectedDate: toLocal(dto.inspectionTime),
    maintenanceDate:
      dto.updatedAt && dto.createdAt && dto.updatedAt !== dto.createdAt
        ? toLocal(dto.updatedAt)
        : "-",
    status: determineImageStatus(dto),
    favorite: false,
    inspectionTimeIso: dto.inspectionTime,
    branch: dto.branch,
    inspector: dto.inspector,
    transformerNo: dto.transformerNo,
  };
}

const drawerWidth = 200;

const formatFieldLabel = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatFieldValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (value.length === 0) return "-";
    return value
      .map((item) =>
        typeof item === "object" && item !== null
          ? JSON.stringify(item)
          : String(item)
      )
      .join("; ");
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

const mapObjectToRows = (obj?: Record<string, unknown>) => {
  if (!obj) return [] as string[][];
  const rows: string[][] = [];

  Object.entries(obj).forEach(([key, value]) => {
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((item) => typeof item === "object" && item !== null)
    ) {
      value.forEach((item, index) => {
        Object.entries(item as Record<string, unknown>).forEach(
          ([nestedKey, nestedValue]) => {
            rows.push([
              `${formatFieldLabel(key)} #${index + 1} - ${formatFieldLabel(
                nestedKey
              )}`,
              formatFieldValue(nestedValue),
            ]);
          }
        );
      });
      return;
    }

    rows.push([formatFieldLabel(key), formatFieldValue(value)]);
  });

  return rows;
};

/* ---------------- Small UI helpers ---------------- */
const statusChip = (s: ImageStatus) => {
  const map: Record<ImageStatus, { color: string; label: string }> = {
    baseline: { color: "#059669", label: "Baseline" },
    maintenance: { color: "#DC2626", label: "Maintenance" },
    "no image": { color: "#6B7280", label: "No Image" },
  };
  const i = map[s];
  return (
    <Box
      sx={{
        display: "inline-flex",
        px: 1,
        py: 0.25,
        borderRadius: 2,
        border: (t) => `1px solid ${t.palette.divider}`,
        color: i.color,
        fontSize: 12,
        fontWeight: 600,
        bgcolor: "common.white",
      }}
    >
      {i.label}
    </Box>
  );
};

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

/* ================= Page ================= */
export default function TransformerInspection() {
  const { transformerNo = "AZ-8801" } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);

  // backend data
  const [transformer, setTransformer] = React.useState<TransformerDTO | null>(
    null
  );
  const [rows, setRows] = React.useState<InspectionRow[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = React.useState<MaintenanceRecordRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // paging
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const shown = React.useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage]
  );

  // maintenance records paging
  const [maintenancePage, setMaintenancePage] = React.useState(0);
  const [maintenanceRowsPerPage, setMaintenanceRowsPerPage] = React.useState(10);
  const shownMaintenance = React.useMemo(
    () => maintenanceRecords.slice(maintenancePage * maintenanceRowsPerPage, maintenancePage * maintenanceRowsPerPage + maintenanceRowsPerPage),
    [maintenanceRecords, maintenancePage, maintenanceRowsPerPage]
  );

  // menu state
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [menuRowId, setMenuRowId] = React.useState<number | null>(null);

  // add dialog
  const [addOpen, setAddOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  // edit dialog
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingInspection, setEditingInspection] =
    React.useState<EditInspectionRow | null>(null);
  const [saving, setSaving] = React.useState(false);

  // delete dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [maintenanceMenuAnchor, setMaintenanceMenuAnchor] =
    React.useState<null | HTMLElement>(null);
  const [maintenanceMenuRecordId, setMaintenanceMenuRecordId] =
    React.useState<number | null>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);

  // load maintenance records
  const loadMaintenanceRecords = React.useCallback(async () => {
    try {
      // First get all inspections for this transformer
      const allInspections = await http<InspectionDTO[]>(`/inspections`);
      const transformerInspections = allInspections.filter(
        (i) => i.transformerNo === transformerNo
      );

      // Fetch maintenance forms for each inspection
      const records: MaintenanceRecordRow[] = [];
      for (const inspection of transformerInspections) {
        try {
          const maintenanceForm = await http<{
            maintenanceFormId?: number;
            inspectionId: number;
            transformerNo: string;
            createdAt?: string;
            thermalInspection?: {
              inspectedBy?: string;
              inspectionDate?: string;
            };
          }>(`/inspections/${inspection.inspectionId}/maintenance-form`);

          if (maintenanceForm) {
            records.push({
              id: inspection.inspectionId,
              maintenanceFormId: maintenanceForm.maintenanceFormId || inspection.inspectionId,
              formNo: maintenanceForm.maintenanceFormId ? pad8(maintenanceForm.maintenanceFormId) : pad8(inspection.inspectionId),
              dateAdded: maintenanceForm.createdAt ? toLocal(maintenanceForm.createdAt) : inspection.createdAt ? toLocal(inspection.createdAt) : '-',
              addedBy: maintenanceForm.thermalInspection?.inspectedBy || inspection.inspector || 'N/A',
              inspectionId: inspection.inspectionId,
              inspectionNo: pad8(inspection.inspectionId),
              transformerNo: inspection.transformerNo,
            });
          }
        } catch {
          // If no maintenance form exists for this inspection, skip it
          console.log(`No maintenance form for inspection ${inspection.inspectionId}`);
        }
      }

      // Sort by inspection ID descending
      records.sort((a, b) => b.id - a.id);
      setMaintenanceRecords(records);
    } catch (err) {
      console.error('Failed to load maintenance records:', err);
      setMaintenanceRecords([]);
    }
  }, [transformerNo]);

  // load data
  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // transformer
        const t = await http<TransformerDTO>(
          `/transformers/${encodeURIComponent(transformerNo)}`
        );
        setTransformer(t);

        // inspections (filter by transformerNo)
        const all = await http<InspectionDTO[]>(`/inspections`);
        const mine = all
          .filter((i) => i.transformerNo === transformerNo)
          .sort((a, b) => b.inspectionId - a.inspectionId);
        setRows(mine.map(dtoToRow));
      } catch {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
      
      // Load maintenance records
      await loadMaintenanceRecords();
    })();
  }, [transformerNo, loadMaintenanceRecords]);

  /* ---------- Add inspection ---------- */
  const handleOpenAdd = () => setAddOpen(true);
  const handleCloseAdd = () => setAddOpen(false);

  const handleConfirmAdd = async (inspectionData: {
    branch: string;
    transformerNo: string;
    inspector: string;
    inspectionTime: string;
  }) => {
    try {
      setCreating(true);
      const created = await http<InspectionDTO>("/inspections", {
        method: "POST",
        json: inspectionData,
      });
      setRows((prev) => [dtoToRow(created), ...prev]);
      setAddOpen(false);
      navigate(
        `/${encodeURIComponent(inspectionData.transformerNo)}/${pad8(
          created.inspectionId
        )}`,
        {
          state: {
            from: "transformer-inspection",
            transformerNo: inspectionData.transformerNo,
          },
        }
      );
    } catch {
      setError("Failed to create inspection");
      throw new Error("Failed to create inspection"); // Re-throw so dialog can handle error state
    } finally {
      setCreating(false);
    }
  };

  /* ---------- Edit inspection ---------- */
  const openRowMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    setMenuAnchor(e.currentTarget);
    setMenuRowId(id);
  };
  const closeRowMenu = () => {
    setMenuAnchor(null);
    setMenuRowId(null);
  };

  const openMaintenanceMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    recordId: number
  ) => {
    setMaintenanceMenuAnchor(e.currentTarget);
    setMaintenanceMenuRecordId(recordId);
  };

  const closeMaintenanceMenu = () => {
    setMaintenanceMenuAnchor(null);
    setMaintenanceMenuRecordId(null);
  };

  const handleDownloadMaintenancePdf = async () => {
    if (maintenanceMenuRecordId == null) return;
    const record = maintenanceRecords.find(
      (r) => r.id === maintenanceMenuRecordId
    );
    setIsDownloading(true);
    try {
      const maintenanceForm = await http<MaintenanceFormResponse>(
        `/inspections/${maintenanceMenuRecordId}/maintenance-form`
      );

      if (!maintenanceForm) {
        setError("No maintenance form found for this inspection");
        return;
      }

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const titleY = 40;
      doc.setFontSize(16);
      doc.text("Digital Maintenance Record", 40, titleY);
      doc.setFontSize(11);
      const metaStartY = titleY + 20;
      doc.text(
        `Transformer: ${
          maintenanceForm.transformerNo || record?.transformerNo || "-"
        }`,
        40,
        metaStartY
      );
      doc.text(
        `Inspection #: ${record?.inspectionNo || pad8(maintenanceForm.inspectionId)}`,
        40,
        metaStartY + 15
      );
      doc.text(
        `Form #: ${
          record?.formNo ||
          pad8(maintenanceForm.maintenanceFormId ?? maintenanceForm.inspectionId)
        }`,
        40,
        metaStartY + 30
      );

      const sections = [
        {
          title: "Thermal Image Inspection",
          rows: mapObjectToRows(maintenanceForm.thermalInspection),
        },
        {
          title: "Maintenance Record",
          rows: mapObjectToRows(maintenanceForm.maintenanceRecord),
        },
        {
          title: "Work + Data Sheet",
          rows: mapObjectToRows(maintenanceForm.workDataSheet),
        },
      ].filter((section) => section.rows.length > 0);

      let nextSectionY = metaStartY + 50;

      if (sections.length === 0) {
        doc.setFontSize(12);
        doc.text("No data available", 40, nextSectionY);
      } else {
        sections.forEach((section) => {
          doc.setFontSize(13);
          doc.text(section.title, 40, nextSectionY);
          autoTable(doc, {
            startY: nextSectionY + 10,
            head: [["Field", "Value"]],
            body: section.rows,
            styles: {
              fontSize: 10,
              cellPadding: 4,
              halign: "left",
              valign: "top",
            },
            headStyles: {
              fillColor: [38, 70, 83],
              halign: "left",
            },
            columnStyles: {
              0: { cellWidth: 180 },
              1: { cellWidth: 320 },
            },
            margin: { left: 40, right: 40 },
          });

          const finalY =
            (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
              ?.finalY ?? nextSectionY + 20;
          nextSectionY = finalY + 24;
        });
      }

      const fileName = `Digital-Maintenance-${
        record?.formNo ||
        pad8(maintenanceForm.maintenanceFormId ?? maintenanceForm.inspectionId)
      }.pdf`;
      doc.save(fileName);
      closeMaintenanceMenu();
    } catch (downloadError) {
      console.error(downloadError);
      setError("Failed to download maintenance record PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStartEdit = (id: number) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    // Convert the local InspectionRow to the format expected by EditInspectionDialog
    const editData: EditInspectionRow = {
      id: row.id,
      transformerNo: row.transformerNo,
      inspectionNo: row.inspectionNo,
      inspectedDate: row.inspectedDate,
      maintenanceDate: row.maintenanceDate || "-",
      status: row.status,
      branch: row.branch,
      inspector: row.inspector,
      inspectionTime: row.inspectionTimeIso, // Map inspectionTimeIso to inspectionTime
    };
    setEditingInspection(editData);
    setEditOpen(true);
    closeRowMenu();
  };

  const handleConfirmEdit = async (
    id: number,
    inspectionData: {
      branch: string;
      transformerNo: string;
      inspector: string;
      inspectionTime: string;
    }
  ) => {
    try {
      setSaving(true);
      const updated = await http<InspectionDTO>(`/inspections/${id}`, {
        method: "PUT",
        json: inspectionData,
      });

      setRows((prev) => prev.map((r) => (r.id === id ? dtoToRow(updated) : r)));
      setEditOpen(false);
      setEditingInspection(null);
    } catch {
      setError("Failed to update inspection");
      throw new Error("Failed to update inspection"); // Re-throw so dialog can handle error state
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Delete inspection ---------- */
  const handleOpenDelete = (id: number) => {
    setDeleteId(id);
    setDeleteOpen(true);
    closeRowMenu();
  };
  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setDeleteId(null);
  };
  const handleConfirmDelete = async () => {
    if (deleteId == null) return;
    try {
      await http<void>(`/inspections/${deleteId}`, { method: "DELETE" });

      setRows((prev) => {
        const next = prev.filter((r) => r.id !== deleteId);
        if (page > 0 && page * rowsPerPage >= next.length) {
          setPage(page - 1);
        }
        return next;
      });

      handleCloseDelete();
    } catch {
      setError("Failed to delete inspection");
    }
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
          <ListItemButton onClick={() => navigate("/")}>
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
            <IconButton onClick={() => navigate("/")} sx={{ color: "inherit" }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Transformer Inspections
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
                <IconButton size="small" onClick={logout} title="Logout" aria-label="logout">
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

      {/* Main */}
      <Box sx={{ display: "flex", bgcolor: "background.default" }}>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 1 },
            mt: 9,
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          {/* error */}
          {error && (
            <Paper
              sx={{
                p: 2,
                mb: 2,
                border: (t) => `1px solid ${t.palette.error.light}`,
                bgcolor: "#FFF5F5",
              }}
            >
              <Typography color="error">{error}</Typography>
            </Paper>
          )}

          {/* loading */}
          {loading ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography>Loading…</Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {/* ===== Header ===== */}
              <Paper elevation={3} sx={{ p: 2.25, borderRadius: 1 }}>
                <Stack
                  direction="row"
                  alignItems="stretch"
                  sx={{ width: "100%" }}
                >
                  {/* Left block */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    {/* Row 1 */}
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
                        {transformer?.transformerNo ?? transformerNo}
                      </Typography>

                      {/* Region */}
                      {transformer?.region && (
                        <Typography
                          sx={{ ml: 3, fontSize: 14, color: "text.secondary" }}
                        >
                          {transformer.region}
                        </Typography>
                      )}

                      <IconButton size="small">
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Stack>

                    {/* Row 2 */}
                    {transformer?.region && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        <PlaceIcon sx={{ fontSize: 16, color: "#EF4444" }} />
                        {transformer.region}
                      </Typography>
                    )}

                    {/* Row 3 */}
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ mt: 1.5 }}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {transformer?.poleNo !== undefined && (
                        <StatPill top={transformer.poleNo} bottom="Pole No" />
                      )}
                      {transformer?.type && (
                        <StatPill top={transformer.type} bottom="Type" />
                      )}
                      {transformer?.createdAt && (
                        <StatPill
                          top={toLocal(transformer.createdAt)}
                          bottom="Created"
                        />
                      )}
                    </Stack>
                  </Box>

                  {/* Right block */}
                  <Stack
                    direction="column"
                    alignItems="flex-end"
                    justifyContent="space-between"
                    sx={{ alignSelf: "stretch", minWidth: 330, py: 0.5 }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: "nowrap", lineHeight: 1.25 }}
                    >
                      Last Inspected Date: {rows[0]?.inspectedDate ?? "-"}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>

              {/* ===== Split View with Tabs ===== */}
              <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {/* Tabs Header */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                  <Tabs 
                    value={activeTab} 
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    sx={{
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        minHeight: 56,
                        px: 3,
                      },
                    }}
                  >
                    <Tab label="Transformer Inspections" />
                    <Tab label="Digital Maintenance Records" />
                  </Tabs>
                </Box>

                {/* Tab Panel 1: Transformer Inspections */}
                {activeTab === 0 && (
                  <Box sx={{ p: 2.5 }}>
                    <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
                      <Typography variant="h6" fontWeight={800} sx={{ pl: 2 }}>
                        Transformer Inspections
                      </Typography>
                      <Box sx={{ flexGrow: 1 }} />
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAdd}
                        sx={{
                          borderRadius: 999,
                          px: 2.5,
                          py: 0.9,
                          fontWeight: 700,
                          textTransform: "none",
                          background:
                            "linear-gradient(180deg, #4F46E5 0%, #2E26C3 100%)",
                          boxShadow: "0 8px 18px rgba(79,70,229,0.35)",
                          "&:hover": {
                            background:
                              "linear-gradient(180deg, #4338CA 0%, #2A21B8 100%)",
                            boxShadow: "0 10px 22px rgba(79,70,229,0.45)",
                          },
                        }}
                      >
                        Add Inspection
                      </Button>
                    </Stack>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell width={48} />
                            <TableCell>Inspection No</TableCell>
                            <TableCell>Inspected Date</TableCell>
                            <TableCell>Image Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {shown.map((row) => (
                            <TableRow key={row.id} hover>
                              <TableCell width={48}>
                                <IconButton size="small">
                                  {row.favorite ? (
                                    <StarIcon color="secondary" />
                                  ) : (
                                    <StarBorderIcon color="disabled" />
                                  )}
                                </IconButton>
                              </TableCell>
                              <TableCell>
                                <Typography fontWeight={600}>
                                  {row.inspectionNo}
                                </Typography>
                              </TableCell>
                              <TableCell>{row.inspectedDate}</TableCell>
                              <TableCell>{statusChip(row.status)}</TableCell>
                              <TableCell align="right">
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  justifyContent="flex-end"
                                >
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() =>
                                      navigate(
                                        `/${encodeURIComponent(
                                          row.transformerNo
                                        )}/${encodeURIComponent(row.inspectionNo)}`,
                                        {
                                          state: {
                                            from: "transformer-inspection",
                                            transformerNo: row.transformerNo,
                                          },
                                        }
                                      )
                                    }
                                  >
                                    View
                                  </Button>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => openRowMenu(e, row.id)}
                                  >
                                    <MoreVertIcon />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}

                          {shown.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6}>
                                <Box sx={{ p: 4, textAlign: "center" }}>
                                  <Typography>No inspections yet</Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <TablePagination
                      component="div"
                      count={rows.length}
                      page={page}
                      onPageChange={(_e, p) => setPage(p)}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                      }}
                      rowsPerPageOptions={[5, 10, 20, 50]}
                    />
                  </Box>
                )}

                {/* Tab Panel 2: Digital Maintenance Records */}
                {activeTab === 1 && (
                  <Box sx={{ p: 2.5 }}>
                    <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
                      <Typography variant="h6" fontWeight={800} sx={{ pl: 2 }}>
                        Digital Maintenance Records
                      </Typography>
                      <Box sx={{ flexGrow: 1 }} />
                    </Stack>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>No</TableCell>
                            <TableCell>Date Added</TableCell>
                            <TableCell>Added By</TableCell>
                            <TableCell>Inspection ID</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {shownMaintenance.map((record) => (
                            <TableRow key={record.id} hover>
                              <TableCell>
                                <Typography fontWeight={600}>
                                  {record.formNo}
                                </Typography>
                              </TableCell>
                              <TableCell>{record.dateAdded}</TableCell>
                              <TableCell>{record.addedBy}</TableCell>
                              <TableCell>{record.inspectionNo}</TableCell>
                              <TableCell align="right">
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  justifyContent="flex-end"
                                >
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => {
                                      // Navigate to digital maintenance form
                                      navigate(
                                        `/digital-form/${encodeURIComponent(record.transformerNo)}/${record.inspectionId}`
                                      );
                                    }}
                                  >
                                    View
                                  </Button>
                                  <IconButton
                                    size="small"
                                    onClick={(event) =>
                                      openMaintenanceMenu(event, record.id)
                                    }
                                    disabled={isDownloading}
                                  >
                                    <MoreVertIcon />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}

                          {shownMaintenance.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6}>
                                <Box sx={{ p: 4, textAlign: "center" }}>
                                  <Typography>No maintenance records found</Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <TablePagination
                      component="div"
                      count={maintenanceRecords.length}
                      page={maintenancePage}
                      onPageChange={(_e, p) => setMaintenancePage(p)}
                      rowsPerPage={maintenanceRowsPerPage}
                      onRowsPerPageChange={(e) => {
                        setMaintenanceRowsPerPage(parseInt(e.target.value, 10));
                        setMaintenancePage(0);
                      }}
                      rowsPerPageOptions={[5, 10, 20, 50]}
                    />
                  </Box>
                )}
              </Paper>
            </Stack>
          )}
        </Box>
      </Box>

      {/* Row actions menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeRowMenu}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{ sx: { mt: 1, minWidth: 160, borderRadius: 2 } }}
      >
        <MenuItem
          onClick={() => {
            if (menuRowId != null) handleStartEdit(menuRowId);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuRowId != null) handleOpenDelete(menuRowId);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={maintenanceMenuAnchor}
        open={Boolean(maintenanceMenuAnchor)}
        onClose={closeMaintenanceMenu}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{ sx: { mt: 1, minWidth: 200, borderRadius: 2 } }}
      >
        <MenuItem
          onClick={handleDownloadMaintenancePdf}
          disabled={isDownloading}
        >
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={isDownloading ? "Preparing PDF..." : "Download PDF"}
          />
        </MenuItem>
      </Menu>

      {/* ---------- Add Inspection Dialog ---------- */}
      <AddInspectionDialog
        open={addOpen}
        onClose={handleCloseAdd}
        onConfirm={handleConfirmAdd}
        isCreating={creating}
        defaultTransformerNo={transformerNo}
        defaultBranch={transformer?.region}
      />

      {/* ---------- Edit Inspection Dialog ---------- */}
      <EditInspectionDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleConfirmEdit}
        inspectionData={editingInspection}
        isSaving={saving}
      />

      {/* ---------- Delete Confirmation Dialog ---------- */}
      <DeleteInspectionConfirmationDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await handleConfirmDelete();
        }}
        inspectionId={deleteId}
        isDeleting={saving}
      />
    </>
  );
}
