import * as React from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

/* Props controlled by Dashboard */
type Props = {
  view?: "transformers" | "inspections";
  onChangeView?: (v: "transformers" | "inspections") => void;
};

/* Types matching backend DTOs */
type InspectionStatus = "In Progress" | "Pending" | "Completed";

type InspectionDTO = {
  inspectionId: number;
  inspectionTime: string; // ISO string from backend
  branch: string;
  inspector: string;
  createdAt: string;
  updatedAt: string;
  transformerNo: string;
};

type InspectionRow = {
  id: number;
  transformerNo: string;
  inspectionNo: string;
  inspectedDate: string;
  maintenanceDate: string; // always string, never undefined
  status: InspectionStatus;
  branch: string;
  inspector: string;
  inspectionTime: string; // Keep original ISO string for editing
};

/* API Service */
const API_BASE_URL = "http://localhost:8080/api";

const inspectionService = {
  async getAllInspections(): Promise<InspectionDTO[]> {
    const response = await fetch(`${API_BASE_URL}/inspections`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async createInspection(
    inspectionData: Partial<InspectionDTO>
  ): Promise<InspectionDTO> {
    // Format the date for backend (remove milliseconds and timezone)
    const formattedData = {
      ...inspectionData,
      inspectionTime: inspectionData.inspectionTime
        ? new Date(inspectionData.inspectionTime).toISOString().split(".")[0]
        : "",
    };

    const response = await fetch(`${API_BASE_URL}/inspections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formattedData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async updateInspection(
    id: number,
    updates: Partial<InspectionDTO>
  ): Promise<InspectionDTO> {
    // Format the date for backend if it's being updated
    if (updates.inspectionTime) {
      updates.inspectionTime = new Date(updates.inspectionTime)
        .toISOString()
        .split(".")[0];
    }

    const response = await fetch(`${API_BASE_URL}/inspections/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async deleteInspection(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/inspections/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },
};

/* Helper to convert DTO to display row */
const convertDTOToRow = (dto: InspectionDTO): InspectionRow => {
  // Generate random status for display purposes since backend doesn't have status field
  const statuses: InspectionStatus[] = ["In Progress", "Pending", "Completed"];
  const status = statuses[dto.inspectionId % statuses.length];

  // Format dates
  const inspectedDate = new Date(dto.inspectionTime).toLocaleString();
  const maintenanceDate =
    dto.updatedAt !== dto.createdAt
      ? new Date(dto.updatedAt).toLocaleString()
      : "Not yet";

  return {
    id: dto.inspectionId,
    transformerNo: dto.transformerNo || `AZ-${8800 + dto.inspectionId}`,
    inspectionNo: dto.inspectionId.toString().padStart(8, "0"),
    inspectedDate,
    maintenanceDate,
    status,
    branch: dto.branch,
    inspector: dto.inspector,
    inspectionTime: dto.inspectionTime,
  };
};

/* Sort helpers */
type Order = "asc" | "desc";
function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}
function getComparator<Key extends PropertyKey>(
  order: Order,
  orderBy: Key
): (
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string }
) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
function stableSort<T>(
  array: readonly T[],
  comparator: (a: T, b: T) => number
) {
  const stabilized = array.map((el, idx) => [el, idx] as const);
  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
}

/* Status chip */
const statusChip = (s: InspectionStatus) => {
  const map: Record<
    InspectionStatus,
    { color: "success" | "warning" | "info"; label: string }
  > = {
    Completed: { color: "success", label: "Completed" },
    Pending: { color: "warning", label: "Pending" },
    "In Progress": { color: "info", label: "In Progress" },
  };
  const i = map[s];
  return (
    <Chip size="small" variant="outlined" color={i.color} label={i.label} />
  );
};

/* Match your drawer width so the fixed AppBar lines up */
const drawerWidth = 260;

export default function Inspections({
  view = "inspections",
  onChangeView,
}: Props) {
  const navigate = useNavigate();

  // State
  const [inspections, setInspections] = React.useState<InspectionDTO[]>([]);
  const [rows, setRows] = React.useState<InspectionRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<InspectionStatus | "All">("All");
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] =
    React.useState<keyof InspectionRow>("transformerNo");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  /* -------- Add Inspection dialog state -------- */
  const [addOpen, setAddOpen] = React.useState(false);
  const [branch, setBranch] = React.useState("");
  const [transformerNo, setTransformerNo] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [inspector, setInspector] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  /* -------- Edit state -------- */
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editBranch, setEditBranch] = React.useState("");
  const [editTransformerNo, setEditTransformerNo] = React.useState("");
  const [editDate, setEditDate] = React.useState("");
  const [editTime, setEditTime] = React.useState("");
  const [editInspector, setEditInspector] = React.useState("");
  const [editStatus, setEditStatus] =
    React.useState<InspectionStatus>("Pending");
  const [saving, setSaving] = React.useState(false);

  /* -------- Delete state -------- */
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  /* -------- Menu state -------- */
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [menuRowId, setMenuRowId] = React.useState<number | null>(null);

  const canConfirm =
    branch.trim() && transformerNo.trim() && date && time && inspector.trim();
  const canSaveEdit =
    editBranch.trim() &&
    editTransformerNo.trim() &&
    editDate &&
    editTime &&
    editInspector.trim();

  // Load inspections from backend
  const loadInspections = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inspectionService.getAllInspections();
      setInspections(data);
      setRows(data.map(convertDTOToRow));
    } catch (err) {
      console.error("Failed to load inspections:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load inspections"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  React.useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  const handleOpenAdd = () => setAddOpen(true);
  const handleCloseAdd = () => {
    setAddOpen(false);
    setBranch("");
    setTransformerNo("");
    setDate("");
    setTime("");
    setInspector("");
  };

  const handleConfirmAdd = async () => {
    if (!canConfirm) return;

    try {
      setCreating(true);

      // Format date correctly for backend (remove milliseconds and timezone)
      const inspectionTime = new Date(`${date}T${time}`)
        .toISOString()
        .split(".")[0];

      const newInspection = {
        branch: branch.trim(),
        transformerNo: transformerNo.trim(),
        inspector: inspector.trim(),
        inspectionTime,
      };

      console.log("Creating inspection:", newInspection); // Debug log

      await inspectionService.createInspection(newInspection);
      await loadInspections();
      handleCloseAdd();
    } catch (err) {
      console.error("Failed to create inspection:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create inspection"
      );
    } finally {
      setCreating(false);
    }
  };

  /* -------- Edit handlers -------- */
  const handleStartEdit = (row: InspectionRow) => {
    setEditingId(row.id);
    setEditBranch(row.branch);
    setEditTransformerNo(row.transformerNo);
    setEditInspector(row.inspector);
    setEditStatus(row.status);

    // Parse the ISO string back to date and time
    const inspectionDate = new Date(row.inspectionTime);
    setEditDate(inspectionDate.toISOString().split("T")[0]); // yyyy-mm-dd
    setEditTime(inspectionDate.toTimeString().slice(0, 5)); // hh:mm

    setEditOpen(true);
    setMenuAnchor(null);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditingId(null);
    setEditBranch("");
    setEditTransformerNo("");
    setEditDate("");
    setEditTime("");
    setEditInspector("");
    setEditStatus("Pending");
  };

  const handleSaveEdit = async () => {
    if (!canSaveEdit || editingId === null) return;

    try {
      setSaving(true);

      // Format date correctly for backend (remove milliseconds and timezone)
      const inspectionTime = new Date(`${editDate}T${editTime}`)
        .toISOString()
        .split(".")[0];

      const updates = {
        branch: editBranch.trim(),
        transformerNo: editTransformerNo.trim(),
        inspector: editInspector.trim(),
        inspectionTime,
      };

      console.log("Updating inspection:", updates); // Debug log

      await inspectionService.updateInspection(editingId, updates);
      await loadInspections();
      handleCloseEdit();
    } catch (err) {
      console.error("Failed to update inspection:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update inspection"
      );
    } finally {
      setSaving(false);
    }
  };

  /* -------- Delete handlers -------- */
  const handleOpenDelete = (id: number) => {
    setDeleteId(id);
    setDeleteOpen(true);
    setMenuAnchor(null);
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setDeleteId(null);
  };

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;

    try {
      setDeleting(true);
      await inspectionService.deleteInspection(deleteId);
      await loadInspections();
      handleCloseDelete();
    } catch (err) {
      console.error("Failed to delete inspection:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete inspection"
      );
    } finally {
      setDeleting(false);
    }
  };

  /* -------- Menu handlers -------- */
  const handleMenuClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    rowId: number
  ) => {
    setMenuAnchor(event.currentTarget);
    setMenuRowId(rowId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuRowId(null);
  };

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const m1 =
        !q ||
        r.transformerNo.toLowerCase().includes(q) ||
        r.inspectionNo.toLowerCase().includes(q) ||
        r.branch.toLowerCase().includes(q) ||
        r.inspector.toLowerCase().includes(q);
      const m2 = status === "All" || r.status === status;
      return m1 && m2;
    });
  }, [rows, search, status]);

  const sorted = React.useMemo(
    () => stableSort(filtered, getComparator(order, orderBy)),
    [filtered, order, orderBy]
  );
  const paged = React.useMemo(
    () => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage]
  );

  const resetFilters = () => {
    setSearch("");
    setStatus("All");
  };

  const handleSort = (property: keyof InspectionRow) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {/* <CssBaseline /> */}

      {/* Show error if any */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Top App Header */}
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
            <IconButton>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Transformer &gt; All Inspections
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

      {/* Push page content below fixed AppBar */}
      <Box sx={{ mt: 0, width: "100%" }}>
        <Stack spacing={2} sx={{ width: "100%" }}>
          {/* Header card */}
          <Paper
            elevation={3}
            sx={{
              p: 2,
              borderRadius: 1,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 1.2,
                    py: 0.4,
                    boxShadow: "0 6px 16px rgba(79,70,229,0.25)",
                  }}
                >
                  {filtered.length}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  All Inspections
                </Typography>
              </Stack>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAdd}
                sx={{
                  ml: { md: 1 },
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

              <Box sx={{ flexGrow: 1 }} />
              <Paper elevation={3} sx={{ p: 0.5, borderRadius: 999 }}>
                <ToggleButtonGroup
                  value={view}
                  exclusive
                  onChange={(_, v) => v && onChangeView?.(v)}
                  sx={{
                    "& .MuiToggleButton-root": {
                      border: 0,
                      textTransform: "none",
                      px: 2.2,
                      py: 0.8,
                      borderRadius: 999,
                      fontWeight: 600,
                    },
                  }}
                >
                  <ToggleButton
                    value="transformers"
                    sx={{
                      bgcolor:
                        view === "transformers"
                          ? "primary.main"
                          : "transparent",
                      color:
                        view === "transformers"
                          ? "primary.contrastText"
                          : "text.primary",
                      "&:hover": {
                        bgcolor:
                          view === "transformers"
                            ? "primary.dark"
                            : "action.hover",
                      },
                    }}
                  >
                    Transformers
                  </ToggleButton>
                  <ToggleButton
                    value="inspections"
                    sx={{
                      bgcolor:
                        view === "inspections" ? "primary.main" : "transparent",
                      color:
                        view === "inspections"
                          ? "primary.contrastText"
                          : "text.primary",
                      "&:hover": {
                        bgcolor:
                          view === "inspections"
                            ? "primary.dark"
                            : "action.hover",
                      },
                    }}
                  >
                    Inspections
                  </ToggleButton>
                </ToggleButtonGroup>
              </Paper>
            </Stack>

            {/* Filters row */}
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={2}
              alignItems="center"
              sx={{ mt: 2 }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Search by Transformer / Inspection No / Branch / Inspector"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Select
                size="small"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as InspectionStatus | "All")
                }
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="All">All Statuses</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>

              <Button onClick={resetFilters} sx={{ textTransform: "none" }}>
                Reset Filters
              </Button>
            </Stack>
          </Paper>

          {/* Table */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sortDirection={
                        orderBy === "transformerNo" ? order : false
                      }
                    >
                      <TableSortLabel
                        active={orderBy === "transformerNo"}
                        direction={orderBy === "transformerNo" ? order : "asc"}
                        onClick={() => handleSort("transformerNo")}
                      >
                        Transformer No.
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sortDirection={orderBy === "branch" ? order : false}
                    >
                      <TableSortLabel
                        active={orderBy === "branch"}
                        direction={orderBy === "branch" ? order : "asc"}
                        onClick={() => handleSort("branch")}
                      >
                        Branch
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sortDirection={orderBy === "inspector" ? order : false}
                    >
                      <TableSortLabel
                        active={orderBy === "inspector"}
                        direction={orderBy === "inspector" ? order : "asc"}
                        onClick={() => handleSort("inspector")}
                      >
                        Inspector
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Inspection No.</TableCell>
                    <TableCell
                      sortDirection={
                        orderBy === "inspectedDate" ? order : false
                      }
                    >
                      <TableSortLabel
                        active={orderBy === "inspectedDate"}
                        direction={orderBy === "inspectedDate" ? order : "asc"}
                        onClick={() => handleSort("inspectedDate")}
                      >
                        Inspected Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sortDirection={orderBy === "status" ? order : false}
                    >
                      <TableSortLabel
                        active={orderBy === "status"}
                        direction={orderBy === "status" ? order : "asc"}
                        onClick={() => handleSort("status")}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>
                          {row.transformerNo}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.branch}</TableCell>
                      <TableCell>{row.inspector}</TableCell>
                      <TableCell>{row.inspectionNo}</TableCell>
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
                                )}/${encodeURIComponent(row.inspectionNo)}`
                              )
                            }
                          >
                            View
                          </Button>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, row.id)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paged.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Box sx={{ p: 4, textAlign: "center" }}>
                          <Typography>No results found</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={sorted.length}
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
      </Box>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 150 },
        }}
      >
        <MenuItem
          onClick={() => {
            const row = rows.find((r) => r.id === menuRowId);
            if (row) handleStartEdit(row);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuRowId) handleOpenDelete(menuRowId);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* ---------- Add Inspection Dialog ---------- */}
      <Dialog
        open={addOpen}
        onClose={handleCloseAdd}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography fontWeight={700} fontSize="1.25rem">
            New Inspection
          </Typography>
          <IconButton onClick={handleCloseAdd} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: "#FBFBFE" }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Branch"
              placeholder="Branch"
              fullWidth
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />

            <TextField
              label="Transformer No"
              placeholder="Transformer No"
              fullWidth
              value={transformerNo}
              onChange={(e) => setTransformerNo(e.target.value)}
            />

            <TextField
              label="Inspector"
              placeholder="Inspector Name"
              fullWidth
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
            />

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
            disabled={!canConfirm || creating}
            sx={{
              mr: 1,
              borderRadius: 999,
              px: 3,
              py: 1,
              fontWeight: 700,
              textTransform: "none",
              background: "linear-gradient(180deg, #4F46E5 0%, #2E26C3 100%)",
              color: "#fff",
              boxShadow: "0 8px 18px rgba(79,70,229,0.35)",
              "&:hover": {
                background: "linear-gradient(180deg, #4338CA 0%, #2A21B8 100%)",
                boxShadow: "0 10px 22px rgba(79,70,229,0.45)",
              },
              "&.Mui-disabled": {
                background: "#A5B4FC",
                color: "#fff",
              },
            }}
          >
            {creating ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Confirm"
            )}
          </Button>

          <Button onClick={handleCloseAdd} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- Edit Inspection Dialog ---------- */}
      <Dialog
        open={editOpen}
        onClose={handleCloseEdit}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography fontWeight={700} fontSize="1.25rem">
            Edit Inspection
          </Typography>
          <IconButton onClick={handleCloseEdit} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: "#FBFBFE" }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Branch"
              placeholder="Branch"
              fullWidth
              value={editBranch}
              onChange={(e) => setEditBranch(e.target.value)}
            />

            <TextField
              label="Transformer No"
              placeholder="Transformer No"
              fullWidth
              value={editTransformerNo}
              onChange={(e) => setEditTransformerNo(e.target.value)}
            />

            <TextField
              label="Inspector"
              placeholder="Inspector Name"
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

            <Select
              label="Status"
              value={editStatus}
              onChange={(e) =>
                setEditStatus(e.target.value as InspectionStatus)
              }
              fullWidth
              displayEmpty
              renderValue={(value) => value || "Select Status"}
            >
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={!canSaveEdit || saving}
            sx={{
              mr: 1,
              borderRadius: 999,
              px: 3,
              py: 1,
              fontWeight: 700,
              textTransform: "none",
              background: "linear-gradient(180deg, #4F46E5 0%, #2E26C3 100%)",
              color: "#fff",
              boxShadow: "0 8px 18px rgba(79,70,229,0.35)",
              "&:hover": {
                background: "linear-gradient(180deg, #4338CA 0%, #2A21B8 100%)",
                boxShadow: "0 10px 22px rgba(79,70,229,0.45)",
              },
              "&.Mui-disabled": {
                background: "#A5B4FC",
                color: "#fff",
              },
            }}
          >
            {saving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Save Changes"
            )}
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
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography fontWeight={700} fontSize="1.25rem">
            Confirm Delete
          </Typography>
          <IconButton onClick={handleCloseDelete} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete this inspection? This action cannot
            be undone.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
            sx={{
              mr: 1,
              borderRadius: 999,
              px: 3,
              py: 1,
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            {deleting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Delete"
            )}
          </Button>

          <Button onClick={handleCloseDelete} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
