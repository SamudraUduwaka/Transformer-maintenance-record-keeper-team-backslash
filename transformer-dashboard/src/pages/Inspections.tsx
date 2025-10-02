import * as React from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
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
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import AddInspectionDialog from "../models/AddInspectionDialog";
import EditInspectionDialog from "../models/EditInspectionDialog";
import DeleteInspectionConfirmationDialog from "../models/DeleteInspectionConfirmationDialog";
import "../styles/dashboard.css";

/* Props controlled by Dashboard */
type Props = {
  view?: "transformers" | "inspections";
  onChangeView?: (v: "transformers" | "inspections") => void;
};

/* Types matching backend DTOs */
type ImageStatus = "baseline" | "maintenance" | "no image";

type ImageDTO = {
  imageId: number;
  imageUrl: string;
  type: string;
  weatherCondition: string;
  createdAt: string;
  updatedAt: string;
  inspectionId: number;
  transformerNo: string;
};

type InspectionDTO = {
  inspectionId: number;
  inspectionTime: string; // ISO string from backend
  branch: string;
  inspector: string;
  createdAt: string;
  updatedAt: string;
  transformerNo: string;
  image?: ImageDTO; // Optional image field
  favorite?: boolean; // Added for favorite functionality
};

type InspectionRow = {
  id: number;
  transformerNo: string;
  inspectionNo: string;
  inspectedDate: string;
  maintenanceDate: string; // always string, never undefined
  status: ImageStatus;
  branch: string;
  inspector: string;
  inspectionTime: string; // Keep original ISO string for editing
  favorite: boolean; // Added for favorite functionality
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

  async patchInspection(
    id: number,
    updates: Partial<InspectionDTO>
  ): Promise<InspectionDTO> {
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
};

/* Helper to convert DTO to display row */
const convertDTOToRow = (dto: InspectionDTO): InspectionRow => {
  // Determine image status based on the image field
  let status: ImageStatus = "no image";
  if (dto.image && dto.image.type) {
    if (dto.image.type === "baseline") {
      status = "baseline";
    } else if (
      dto.image.type === "thermal" ||
      dto.image.type === "maintenance"
    ) {
      status = "maintenance";
    }
    // Default fallback for any other image type
    else {
      status = "maintenance";
    }
  }

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
    favorite: dto.favorite || false, // Get from database
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
  a: { [key in Key]: number | string | boolean },
  b: { [key in Key]: number | string | boolean }
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
const statusChip = (s: ImageStatus) => {
  const map: Record<
    ImageStatus,
    { color: "success" | "warning" | "info"; label: string }
  > = {
    baseline: { color: "info", label: "Baseline" },
    maintenance: { color: "warning", label: "Maintenance" },
    "no image": { color: "success", label: "No Image" },
  };
  const i = map[s];
  return (
    <Chip size="small" variant="outlined" color={i.color} label={i.label} />
  );
};

/* Match your drawer width so the fixed AppBar lines up */

export default function Inspections({
  view = "inspections",
  onChangeView,
}: Props) {
  const navigate = useNavigate();

  // State
  //const [inspections, setInspections] = React.useState<InspectionDTO[]>([]);
  const [rows, setRows] = React.useState<InspectionRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<ImageStatus | "All">("All");
  const [onlyFav, setOnlyFav] = React.useState(false); // Added for favorites filtering
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] =
    React.useState<keyof InspectionRow>("transformerNo");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  /* -------- Add Inspection dialog state -------- */
  const [addOpen, setAddOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  /* -------- Edit state -------- */
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingInspection, setEditingInspection] =
    React.useState<InspectionRow | null>(null);
  const [saving, setSaving] = React.useState(false);

  /* -------- Delete state -------- */
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  /* -------- Menu state -------- */
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [menuRowId, setMenuRowId] = React.useState<number | null>(null);

  // Load inspections from backend
  const loadInspections = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inspectionService.getAllInspections();
      //setInspections(data);
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
  };

  const handleConfirmAdd = async (inspectionData: {
    branch: string;
    transformerNo: string;
    inspector: string;
    inspectionTime: string;
  }) => {
    try {
      setCreating(true);

      console.log("Creating inspection:", inspectionData); // Debug log

      await inspectionService.createInspection(inspectionData);
      await loadInspections();
      setAddOpen(false);
    } catch (err) {
      console.error("Failed to create inspection:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create inspection"
      );
      throw err; // Re-throw so the dialog can handle the error state
    } finally {
      setCreating(false);
    }
  };

  /* -------- Edit handlers -------- */
  const handleStartEdit = (row: InspectionRow) => {
    setEditingInspection(row);
    setEditOpen(true);
    setMenuAnchor(null);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditingInspection(null);
  };

  const handleSaveEdit = async (
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

      console.log("Updating inspection:", inspectionData); // Debug log

      await inspectionService.updateInspection(id, inspectionData);
      await loadInspections();
      setEditOpen(false);
      setEditingInspection(null);
    } catch (err) {
      console.error("Failed to update inspection:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update inspection"
      );
      throw err; // Re-throw so the dialog can handle the error state
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

  const handleConfirmDelete = async (id: number) => {
    try {
      setDeleting(true);
      await inspectionService.deleteInspection(id);
      await loadInspections();
      setDeleteOpen(false);
      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete inspection:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete inspection"
      );
      throw err; // Re-throw so the dialog can handle the error state
    } finally {
      setDeleting(false);
    }
  };

  /* -------- Favorite handlers -------- */
  const handleToggleFavorite = async (row: InspectionRow) => {
    try {
      const updatedInspection = await inspectionService.patchInspection(
        row.id,
        { favorite: !row.favorite }
      );

      setRows((prevRows) =>
        prevRows.map((r) =>
          r.id === row.id
            ? { ...r, favorite: updatedInspection.favorite || false }
            : r
        )
      );

      // You can add a snackbar notification here if needed
      // showSnackbar(
      //   updatedInspection.favorite
      //     ? "Added to favorites"
      //     : "Removed from favorites"
      // );
    } catch (error) {
      console.error("Failed to update favorite status:", error);
      setError("Failed to update favorite status");
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
      const m3 = !onlyFav || r.favorite; // Add favorites filtering
      return m1 && m2 && m3;
    });
  }, [rows, search, status, onlyFav]);

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
    setOnlyFav(false); // Reset favorites filter
  };

  const handleSort = (property: keyof InspectionRow) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Show loading state
  if (loading) {
    return (
      <Box className="dashboard-loading-container">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {/* Show error if any */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          className="dashboard-error-alert"
        >
          {error}
        </Alert>
      )}

      <Stack spacing={2} sx={{ maxWidth: 1000, mx: "auto", width: "100%" }}>
        {/* Section header card */}
        <Paper elevation={3} className="dashboard-header-card">
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
            className="dashboard-header-stack"
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box className="dashboard-count-badge">{filtered.length}</Box>
              <Typography variant="h6" className="dashboard-section-title">
                All Inspections
              </Typography>
            </Stack>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
              className="dashboard-add-button"
            >
              Add Inspection
            </Button>

            {/* Pill toggle on the right side */}
            <Box className="dashboard-flex-grow" />
            <Paper elevation={3} className="dashboard-toggle-paper">
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
                  className={`dashboard-toggle-button ${
                    view === "transformers"
                      ? "dashboard-toggle-button-active"
                      : ""
                  }`}
                >
                  Transformers
                </ToggleButton>
                <ToggleButton
                  value="inspections"
                  className={`dashboard-toggle-button ${
                    view === "inspections"
                      ? "dashboard-toggle-button-active"
                      : ""
                  }`}
                >
                  Inspections
                </ToggleButton>
              </ToggleButtonGroup>
            </Paper>
          </Stack>

          {/* Filter row */}
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2}
            alignItems="center"
            className="dashboard-filter-container"
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
              onChange={(e) => setStatus(e.target.value as ImageStatus | "All")}
              className="dashboard-filter-select"
            >
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="baseline">Baseline</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="no image">No Image</MenuItem>
            </Select>

            <Stack direction="row" alignItems="center" spacing={1}>
              <StarIcon
                className="dashboard-star-icon"
                color={onlyFav ? "secondary" : "disabled"}
              />
              <Switch
                checked={onlyFav}
                onChange={(e) => setOnlyFav(e.target.checked)}
              />
              <Typography variant="body2" color="text.secondary">
                Favorites only
              </Typography>
            </Stack>

            <Button onClick={resetFilters} className="dashboard-reset-filters">
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
                  <TableCell width={48}></TableCell>
                  <TableCell
                    sortDirection={orderBy === "transformerNo" ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === "transformerNo"}
                      direction={orderBy === "transformerNo" ? order : "asc"}
                      onClick={() => handleSort("transformerNo")}
                    >
                      <Typography fontWeight="bold">Transformer No.</Typography>
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
                      <Typography fontWeight="bold">Branch</Typography>
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
                      <Typography fontWeight="bold">Inspector</Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">Inspection No.</Typography>
                  </TableCell>
                  <TableCell
                    sortDirection={orderBy === "inspectedDate" ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === "inspectedDate"}
                      direction={orderBy === "inspectedDate" ? order : "asc"}
                      onClick={() => handleSort("inspectedDate")}
                    >
                      <Typography fontWeight="bold">Inspected Date</Typography>
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
                      <Typography fontWeight="bold">Status</Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell width={48}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleFavorite(row)}
                        aria-label={row.favorite ? "unfavorite" : "favorite"}
                      >
                        {row.favorite ? (
                          <StarIcon color="secondary" />
                        ) : (
                          <StarBorderIcon color="disabled" />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography className="dashboard-transformer-number">
                          {row.transformerNo}
                        </Typography>
                        <Chip
                          size="small"
                          label="↓"
                          variant="outlined"
                          className="dashboard-chip-arrow"
                        />
                      </Stack>
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
                              )}/${encodeURIComponent(row.inspectionNo)}`,
                              { state: { from: "inspections-dashboard" } }
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
                    <TableCell colSpan={8}>
                      <Box className="dashboard-no-results">
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

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          className: "dashboard-action-menu",
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
          className="dashboard-delete-menu-item"
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* ---------- Add Inspection Dialog ---------- */}
      <AddInspectionDialog
        open={addOpen}
        onClose={handleCloseAdd}
        onConfirm={handleConfirmAdd}
        isCreating={creating}
      />

      {/* ---------- Edit Inspection Dialog ---------- */}
      <EditInspectionDialog
        open={editOpen}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
        inspectionData={editingInspection}
        isSaving={saving}
      />

      {/* ---------- Delete Confirmation Dialog ---------- */}
      <DeleteInspectionConfirmationDialog
        open={deleteOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        inspectionId={deleteId}
        isDeleting={deleting}
      />
    </>
  );
}
