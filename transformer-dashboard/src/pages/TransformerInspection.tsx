import * as React from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Bolt as BoltIcon,
  List as ListIcon,
  MoreVert as MoreVertIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Image as ImageIcon,
  Add as AddIcon,
  Place as PlaceIcon,
  Visibility as VisibilityIcon,
  DeleteOutline as DeleteOutlineIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";

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
};

/* ================= Local row (UI) ================= */
type InspectionStatus = "In Progress" | "Pending" | "Completed";
type InspectionRow = {
  id: number;
  inspectionNo: string;
  inspectedDate: string;
  maintenanceDate?: string;
  status: InspectionStatus;
  favorite?: boolean;
  // for editing:
  inspectionTimeIso: string;
  branch: string;
  inspector: string;
  transformerNo: string;
};

/* ================= Tiny inline HTTP helper ================= */
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:8080/api";

async function http<T>(
  path: string,
  init?: RequestInit & { json?: any }
): Promise<T> {
  const headers = new Headers(init?.headers || {});
  if (init?.json !== undefined) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
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
function pickStatus(id: number): InspectionStatus {
  const arr: InspectionStatus[] = ["In Progress", "Pending", "Completed"];
  return arr[id % arr.length];
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
    status: pickStatus(dto.inspectionId),
    favorite: false,
    inspectionTimeIso: dto.inspectionTime,
    branch: dto.branch,
    inspector: dto.inspector,
    transformerNo: dto.transformerNo,
  };
}

/* ================= Theme ================= */
// const theme = createTheme({
//   palette: {
//     mode: "light",
//     primary: { main: "#4F46E5" },
//     secondary: { main: "#7C3AED" },
//     background: { default: "#F7F7FB" },
//     text: { primary: "#101828", secondary: "#667085" },
//   },
//   shape: { borderRadius: 16 },
//   components: {
//     MuiPaper: {
//       defaultProps: { elevation: 0 },
//       styleOverrides: { root: { borderRadius: 16 } },
//     },
//     MuiButton: {
//       styleOverrides: { root: { textTransform: "none", borderRadius: 14, fontWeight: 600 } },
//     },
//   },
// });

const drawerWidth = 260;

/* ---------------- Small UI helpers ---------------- */
const statusChip = (s: InspectionStatus) => {
  const map: Record<InspectionStatus, { color: string; label: string }> = {
    Completed: { color: "#16A34A", label: "Completed" },
    Pending: { color: "#F59E0B", label: "Pending" },
    "In Progress": { color: "#0EA5E9", label: "In Progress" },
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
      <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.2 }}>
        {bottom}
      </Typography>
    </Box>
  );
}

/* ================= Page ================= */
export default function TransformerInspection() {
  const { transformerNo = "AZ-8801" } = useParams();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = React.useState(false);

  // backend data
  const [transformer, setTransformer] = React.useState<TransformerDTO | null>(null);
  const [rows, setRows] = React.useState<InspectionRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // paging
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const shown = React.useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage]
  );

  // menu state
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [menuRowId, setMenuRowId] = React.useState<number | null>(null);

  // add dialog
  const [addOpen, setAddOpen] = React.useState(false);
  const [branch, setBranch] = React.useState("");
  const [tNo, setTNo] = React.useState(transformerNo || "");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [inspector, setInspector] = React.useState("");

  // edit dialog
  const [editOpen, setEditOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<number | null>(null);
  const [editBranch, setEditBranch] = React.useState("");
  const [editTNo, setEditTNo] = React.useState("");
  const [editInspector, setEditInspector] = React.useState("");
  const [editDate, setEditDate] = React.useState("");
  const [editTime, setEditTime] = React.useState("");

  // delete dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);

  const canConfirmAdd =
    branch.trim() && tNo.trim() && date && time && inspector.trim();
  const canConfirmEdit =
    editBranch.trim() &&
    editTNo.trim() &&
    editDate &&
    editTime &&
    editInspector.trim();

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

        // prefill add dialog defaults
        setBranch(t.region || "");
        setTNo(t.transformerNo || transformerNo);
      } catch (e: any) {
        setError(e?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, [transformerNo]);

  /* ---------- Add inspection ---------- */
  const handleOpenAdd = () => setAddOpen(true);
  const handleCloseAdd = () => setAddOpen(false);

  const handleConfirmAdd = async () => {
    if (!canConfirmAdd) return;
    try {
      const inspectionTime = new Date(`${date}T${time}`)
        .toISOString()
        .split(".")[0];
      const payload = {
        branch: branch.trim(),
        transformerNo: tNo.trim(),
        inspector: inspector.trim(),
        inspectionTime,
      };
      const created = await http<InspectionDTO>("/inspections", {
        method: "POST",
        json: payload,
      });
      setRows((prev) => [dtoToRow(created), ...prev]);
      setAddOpen(false);
      navigate(`/${encodeURIComponent(tNo)}/${pad8(created.inspectionId)}`);
    } catch (e: any) {
      setError(e?.message || "Failed to create inspection");
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

  const handleStartEdit = (id: number) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    setEditId(row.id);
    setEditBranch(row.branch);
    setEditTNo(row.transformerNo);
    setEditInspector(row.inspector);

    // parse original ISO to date/time fields
    const d = new Date(row.inspectionTimeIso);
    setEditDate(d.toISOString().slice(0, 10)); // yyyy-mm-dd
    setEditTime(d.toTimeString().slice(0, 5)); // HH:mm

    setEditOpen(true);
    closeRowMenu();
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditId(null);
    setEditBranch("");
    setEditTNo("");
    setEditInspector("");
    setEditDate("");
    setEditTime("");
  };

  const handleConfirmEdit = async () => {
    if (!canConfirmEdit || editId == null) return;
    try {
      const inspectionTime = new Date(`${editDate}T${editTime}`)
        .toISOString()
        .split(".")[0];

      // Use PUT to avoid Map<...> cast issues in your PATCH service
      const payload: Partial<InspectionDTO> = {
        branch: editBranch.trim(),
        transformerNo: editTNo.trim(),
        inspector: editInspector.trim(),
        inspectionTime,
      };
      const updated = await http<InspectionDTO>(`/inspections/${editId}`, {
        method: "PUT",
        json: payload,
      });

      setRows((prev) => prev.map((r) => (r.id === editId ? dtoToRow(updated) : r)));
      handleCloseEdit();
    } catch (e: any) {
      setError(e?.message || "Failed to update inspection");
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
        // If we’re now past the end, move back a page
        if (page > 0 && page * rowsPerPage >= next.length) {
          setPage(page - 1);
        }
        return next;
      });

      handleCloseDelete();
    } catch (e: any) {
      setError(e?.message || "Failed to delete inspection");
    }
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
    // <ThemeProvider theme={theme}>
    //   <CssBaseline />
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
        }}
      >
        <Toolbar sx={{ minHeight: 72 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <IconButton onClick={() => setMobileOpen(!mobileOpen)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Transformers
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
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="sidebar">
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
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 1 }, mt: 9, ml: { sm: `${drawerWidth}px` } }}>
          {/* error */}
          {error && (
            <Paper sx={{ p: 2, mb: 2, border: (t) => `1px solid ${t.palette.error.light}`, bgcolor: "#FFF5F5" }}>
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
                <Stack direction="row" alignItems="stretch" sx={{ width: "100%" }}>
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
                        <Box sx={{ width: 10, height: 10, bgcolor: "#FFFFFF", borderRadius: "50%" }} />
                      </Box>

                      <Typography variant="h6" fontWeight={800}>
                        {transformer?.transformerNo ?? transformerNo}
                      </Typography>

                      {/* Region */}
                      {transformer?.region && (
                        <Typography sx={{ ml: 3, fontSize: 14, color: "text.secondary" }}>
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
                        sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
                      >
                        <PlaceIcon sx={{ fontSize: 16, color: "#EF4444" }} />
                        {transformer.region}
                      </Typography>
                    )}

                    {/* Row 3 */}
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                      {transformer?.poleNo !== undefined && <StatPill top={transformer.poleNo} bottom="Pole No" />}
                      {transformer?.type && <StatPill top={transformer.type} bottom="Type" />}
                      {transformer?.createdAt && <StatPill top={toLocal(transformer.createdAt)} bottom="Created" />}
                    </Stack>
                  </Box>

                  {/* Right block */}
                  <Stack
                    direction="column"
                    alignItems="flex-end"
                    justifyContent="space-between"
                    sx={{ alignSelf: "stretch", minWidth: 330, py: 0.5 }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap", lineHeight: 1.25 }}>
                      Last Inspected Date: {rows[0]?.inspectedDate ?? "-"}
                    </Typography>

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
                        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#344054" }}>
                          Baseline Image
                        </Typography>
                      </Box>

                      <IconButton
                        onClick={() => alert("Preview baseline")}
                        size="small"
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: "white",
                          border: (t) => `1px solid ${t.palette.divider}`,
                        }}
                      >
                        <VisibilityIcon fontSize="inherit" sx={{ fontSize: 16, color: "#344054" }} />
                      </IconButton>

                      <IconButton
                        onClick={() => alert("Delete baseline")}
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
                  </Stack>
                </Stack>
              </Paper>

              {/* ===== Table ===== */}
              <Paper elevation={3} sx={{ p: 2.5, borderRadius: 2 }}>
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
                      background: "linear-gradient(180deg, #4F46E5 0%, #2E26C3 100%)",
                      boxShadow: "0 8px 18px rgba(79,70,229,0.35)",
                      "&:hover": {
                        background: "linear-gradient(180deg, #4338CA 0%, #2A21B8 100%)",
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
                        <TableCell>Maintenance Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shown.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell width={48}>
                            <IconButton size="small">
                              {row.favorite ? <StarIcon color="secondary" /> : <StarBorderIcon color="disabled" />}
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Typography fontWeight={600}>{row.inspectionNo}</Typography>
                          </TableCell>
                          <TableCell>{row.inspectedDate}</TableCell>
                          <TableCell>{row.maintenanceDate ?? "-"}</TableCell>
                          <TableCell>{statusChip(row.status)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() =>
                                  navigate(
                                    `/${encodeURIComponent(row.transformerNo)}/${encodeURIComponent(
                                      row.inspectionNo
                                    )}`
                                  )
                                }
                              >
                                View
                              </Button>
                              <IconButton size="small" onClick={(e) => openRowMenu(e, row.id)}>
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

      {/* ---------- Add Inspection Dialog ---------- */}
      <Dialog open={addOpen} onClose={handleCloseAdd} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography fontWeight={700} fontSize="1.25rem">
            Add Inspection
          </Typography>
          <IconButton onClick={handleCloseAdd} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: "#FBFBFE" }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Branch" fullWidth value={branch} onChange={(e) => setBranch(e.target.value)} />
            <TextField label="Transformer No" fullWidth value={tNo} onChange={(e) => setTNo(e.target.value)} />
            <TextField label="Inspector" fullWidth value={inspector} onChange={(e) => setInspector(e.target.value)} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Date of Inspection"
                type="date"
                fullWidth
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Time"
                type="time"
                fullWidth
                value={time}
                onChange={(e) => setTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="contained"
            onClick={handleConfirmAdd}
            disabled={!canConfirmAdd}
            sx={{
              mr: 1,
              borderRadius: 999,
              px: 3,
              py: 1,
              fontWeight: 700,
              textTransform: "none",
              background: "linear-gradient(180deg, #4F46E5 0%, #2E26C3 100%)",
              color: "#fff",
            }}
          >
            Confirm
          </Button>
          <Button onClick={handleCloseAdd} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- Edit Inspection Dialog ---------- */}
      <Dialog open={editOpen} onClose={handleCloseEdit} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography fontWeight={700} fontSize="1.25rem">
            Edit Inspection
          </Typography>
          <IconButton onClick={handleCloseEdit} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: "#FBFBFE" }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Branch" fullWidth value={editBranch} onChange={(e) => setEditBranch(e.target.value)} />
            <TextField label="Transformer No" fullWidth value={editTNo} onChange={(e) => setEditTNo(e.target.value)} />
            <TextField
              label="Inspector"
              fullWidth
              value={editInspector}
              onChange={(e) => setEditInspector(e.target.value)}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Date of Inspection"
                type="date"
                fullWidth
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Time"
                type="time"
                fullWidth
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="contained"
            onClick={handleConfirmEdit}
            disabled={!canConfirmEdit}
            sx={{
              mr: 1,
              borderRadius: 999,
              px: 3,
              py: 1,
              fontWeight: 700,
              textTransform: "none",
              background: "linear-gradient(180deg, #4F46E5 0%, #2E26C3 100%)",
              color: "#fff",
            }}
          >
            Save Changes
          </Button>
          <Button onClick={handleCloseEdit} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- Delete Confirmation Dialog ---------- */}
      <Dialog
        open={deleteOpen}
        onClose={handleCloseDelete}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography fontWeight={700} fontSize="1.25rem">
            Confirm Delete
          </Typography>
          <IconButton onClick={handleCloseDelete} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Typography>Are you sure you want to delete this inspection? This action cannot be undone.</Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="contained" color="error" onClick={handleConfirmDelete} sx={{ mr: 1 }}>
            Delete
          </Button>
          <Button onClick={handleCloseDelete} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      </>
    //</ThemeProvider>
  );
}
