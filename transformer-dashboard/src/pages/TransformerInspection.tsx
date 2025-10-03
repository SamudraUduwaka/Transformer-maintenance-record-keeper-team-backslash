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
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import PowerLensBranding from "../components/PowerLensBranding";
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

  const [mobileOpen, setMobileOpen] = React.useState(false);

  // backend data
  const [transformer, setTransformer] = React.useState<TransformerDTO | null>(
    null
  );
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
  const [creating, setCreating] = React.useState(false);

  // edit dialog
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingInspection, setEditingInspection] =
    React.useState<EditInspectionRow | null>(null);
  const [saving, setSaving] = React.useState(false);

  // delete dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);

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
    })();
  }, [transformerNo]);

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
      // Use PUT to avoid Map<...> cast issues in your PATCH service
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
        // If we’re now past the end, move back a page
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
