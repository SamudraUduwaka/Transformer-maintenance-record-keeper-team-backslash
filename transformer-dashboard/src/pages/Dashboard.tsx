import * as React from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
  Alert,
  CircularProgress,
  Menu,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Bolt as BoltIcon,
  List as ListIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Inspections from "./Inspections";
import { AddTransformerDialog, type TransformerFormData } from "../models/AddEditTransformerDialog";
import { DeleteTransformerConfirmationDialog } from "../models/DeleteTransformerConfirmationDialog";
import "../styles/dashboard.css";

/* Types */
type TransformerType = "Bulk" | "Distribution";

interface Transformer {
  id?: number;
  transformerNo: string;
  poleNo: string;
  region: string;
  type: TransformerType;
  favorite?: boolean;
  location?: string;
}

/* API Configuration */
const API_BASE_URL = "http://localhost:8080/api";

/* API Service Functions */
const transformersAPI = {
  getAll: async (): Promise<Transformer[]> => {
    const response = await fetch(`${API_BASE_URL}/transformers`);
    if (!response.ok) throw new Error("Failed to fetch transformers");
    return response.json();
  },

  getById: async (transformerNo: string): Promise<Transformer> => {
    const response = await fetch(
      `${API_BASE_URL}/transformers/${transformerNo}`
    );
    if (!response.ok) throw new Error("Failed to fetch transformer");
    return response.json();
  },

  create: async (
    transformer: Omit<Transformer, "id">
  ): Promise<Transformer> => {
    const response = await fetch(`${API_BASE_URL}/transformers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transformer),
    });
    if (!response.ok) throw new Error("Failed to create transformer");
    return response.json();
  },

  update: async (
    transformerNo: string,
    transformer: Transformer
  ): Promise<Transformer> => {
    const response = await fetch(
      `${API_BASE_URL}/transformers/${transformerNo}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformer),
      }
    );
    if (!response.ok) throw new Error("Failed to update transformer");
    return response.json();
  },

  delete: async (transformerNo: string): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/transformers/${transformerNo}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) throw new Error("Failed to delete transformer");
  },

  patch: async (
    transformerNo: string,
    updates: Partial<Transformer>
  ): Promise<Transformer> => {
    const response = await fetch(
      `${API_BASE_URL}/transformers/${transformerNo}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }
    );
    if (!response.ok) throw new Error("Failed to update transformer");
    return response.json();
  },
};

/* Mock Data for Regions */
const REGIONS = ["Nugegoda", "Maharagama", "Kotte", "Dehiwala"] as const;
const TYPES: TransformerType[] = ["Bulk", "Distribution"];

/* Sort helpers */
type Order = "asc" | "desc";
function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator<T>(
  order: Order,
  orderBy: keyof T
): (a: T, b: T) => number {
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

const drawerWidth = 260;

export default function Dashboard() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [view, setView] = React.useState<"transformers" | "inspections">("transformers");
  const navigate = useNavigate();

  // Transformers state
  const [rows, setRows] = React.useState<Transformer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [region, setRegion] = React.useState<string | "All">("All");
  const [ttype, setTtype] = React.useState<TransformerType | "All">("All");
  const [onlyFav, setOnlyFav] = React.useState(false);
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] =
    React.useState<keyof Transformer>("transformerNo");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // Dialog states
  const [openDialog, setOpenDialog] = React.useState(false);
  const [editingTransformer, setEditingTransformer] =
    React.useState<Transformer | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = React.useState({
    open: false,
    transformer: null as Transformer | null,
  });

  // Action menu
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedTransformer, setSelectedTransformer] =
    React.useState<Transformer | null>(null);

  // Fetch transformers on component mount
  const fetchTransformers = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await transformersAPI.getAll();
      setRows(data);
      setError(null);
    } catch {
      setError("Failed to fetch transformers");
      showSnackbar("Failed to fetch transformers", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTransformers();
  }, [fetchTransformers]);

  const showSnackbar = (
    message: string,
    severity: "success" | "error" = "success"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filtered = React.useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          r.transformerNo.toLowerCase().includes(q) ||
          r.poleNo.toLowerCase().includes(q);
        const matchRegion = region === "All" || r.region === region;
        const matchType = ttype === "All" || r.type === ttype;
        const matchFav = !onlyFav || r.favorite;
        return matchSearch && matchRegion && matchType && matchFav;
      }),
    [rows, search, region, ttype, onlyFav]
  );

  const sorted = React.useMemo(
    () => stableSort(filtered, getComparator(order, orderBy)),
    [filtered, order, orderBy]
  );
  const paged = React.useMemo(
    () => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage]
  );

  const handleRequestSort = (prop: keyof Transformer) => () => {
    const isAsc = orderBy === prop && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(prop);
  };

  const resetFilters = () => {
    setSearch("");
    setRegion("All");
    setTtype("All");
    setOnlyFav(false);
  };

  // Action Menu handlers
  const handleOpenActionMenu = (
    event: React.MouseEvent<HTMLElement>,
    transformer: Transformer
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedTransformer(transformer);
  };

  const handleCloseActionMenu = () => {
    setAnchorEl(null);
    setSelectedTransformer(null);
  };

  // Dialog handlers
  const openAddDialog = () => {
    setEditingTransformer(null);
    setOpenDialog(true);
  };

  const openEditDialog = (transformer: Transformer) => {
    setEditingTransformer(transformer);
    setOpenDialog(true);
    handleCloseActionMenu();
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setEditingTransformer(null);
  };

  const handleTransformerSave = async (form: TransformerFormData, isEdit: boolean) => {
    setSaving(true);
    try {
      if (isEdit && editingTransformer) {
        // Edit existing transformer
        const updatedTransformer: Transformer = {
          ...editingTransformer,
          transformerNo: form.transformerNo,
          poleNo: form.poleNo,
          region: form.region,
          type: form.type as TransformerType,
          location: form.location || undefined,
        };

        const savedTransformer = await transformersAPI.update(
          editingTransformer.transformerNo,
          updatedTransformer
        );

        setRows((rs) =>
          rs.map((r) =>
            r.transformerNo === editingTransformer.transformerNo
              ? savedTransformer
              : r
          )
        );

        showSnackbar("Transformer updated successfully");
      } else {
        // Add new transformer
        const newTransformer: Omit<Transformer, "id"> = {
          transformerNo: form.transformerNo,
          poleNo: form.poleNo,
          region: form.region,
          type: form.type as TransformerType,
          favorite: false,
          location: form.location || undefined,
        };

        const savedTransformer = await transformersAPI.create(newTransformer);
        setRows((rs) => [savedTransformer, ...rs]);
        showSnackbar("Transformer added successfully");
      }
    } catch (err) {
      const action = isEdit ? "update" : "add";
      showSnackbar(
        err instanceof Error ? err.message : `Failed to ${action} transformer`,
        "error"
      );
      throw err; // Re-throw so dialog can handle error state
    } finally {
      setSaving(false);
    }
  };

  // Delete handlers
  const openDeleteDialog = (transformer: Transformer) => {
    setDeleteDialog({ open: true, transformer });
    handleCloseActionMenu();
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, transformer: null });
  };

  const handleTransformerDelete = async () => {
    if (!deleteDialog.transformer) return;

    try {
      await transformersAPI.delete(deleteDialog.transformer.transformerNo);
      setRows(
        rows.filter(
          (t) => t.transformerNo !== deleteDialog.transformer!.transformerNo
        )
      );
      showSnackbar("Transformer deleted successfully");
      closeDeleteDialog();
    } catch (err) {
      showSnackbar(
        err instanceof Error ? err.message : "Failed to delete transformer",
        "error"
      );
      throw err; // Re-throw so dialog can handle error state
    }
  };

  const handleToggleFavorite = async (transformer: Transformer) => {
    try {
      const updatedTransformer = await transformersAPI.patch(
        transformer.transformerNo,
        { favorite: !transformer.favorite }
      );

      setRows(
        rows.map((t) =>
          t.transformerNo === transformer.transformerNo ? updatedTransformer : t
        )
      );

      showSnackbar(
        updatedTransformer.favorite
          ? "Added to favorites"
          : "Removed from favorites"
      );
    } catch {
      showSnackbar("Failed to update favorite status", "error");
    }
  };

  /* Drawer */
  const drawer = (
    <Box className="dashboard-drawer">
      <Stack direction="row" alignItems="center" spacing={1} className="dashboard-logo-container">
        <BoltIcon />
        <Typography variant="h6" className="dashboard-logo-text">
          PowerLens
        </Typography>
      </Stack>
      <Divider />
      <List className="dashboard-nav-list">
        <ListItem disablePadding>
          <ListItemButton
            selected={view === "transformers"}
            onClick={() => setView("transformers")}
          >
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
      <Box className="dashboard-flex-grow" />
    </Box>
  );

  return (
    <>
      {/* Top App Header */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        className="dashboard-app-header"
      >
        <Toolbar className="dashboard-toolbar">
          <Stack direction="row" spacing={1.25} alignItems="center">
            <IconButton onClick={() => setMobileOpen(!mobileOpen)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" className="dashboard-toolbar-title">
              Transformers
            </Typography>
          </Stack>
          <Box className="dashboard-flex-grow" />
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
            className="dashboard-user-stack"
          >
            <Avatar
              src="./user.png"
              className="dashboard-user-avatar"
            />
            <Box className="dashboard-user-info">
              <Typography variant="subtitle2" className="dashboard-user-name">
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
          className="dashboard-drawer-temporary"
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
          className="dashboard-drawer-permanent"
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
          className="dashboard-main-content"
        >
          {view === "transformers" ? (
            <Stack spacing={2}>
              {/* Section header card */}
              <Paper elevation={3} className="dashboard-header-card">
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  alignItems={{ xs: "stretch", md: "center" }}
                  className="dashboard-header-stack"
                >
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box className="dashboard-count-badge">
                      {filtered.length}
                    </Box>
                    <Typography variant="h6" className="dashboard-section-title">
                      Transformers
                    </Typography>
                  </Stack>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openAddDialog}
                    className="dashboard-add-button"
                  >
                    Add Transformer
                  </Button>

                  {/* Pill toggle on the right side */}
                  <Box className="dashboard-flex-grow" />
                  <Paper elevation={3} className="dashboard-toggle-paper">
                    <ToggleButtonGroup
                      value={view}
                      exclusive
                      onChange={(_, v) => {
                        if (v === "transformers" || v === "inspections") setView(v);
                      }}
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
                          view === "transformers" ? "dashboard-toggle-button-active" : ""
                        }`}
                      >
                        Transformers
                      </ToggleButton>
                      <ToggleButton
                        value="inspections"
                        className="dashboard-toggle-button"
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
                    placeholder="Search Transformer"
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
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="dashboard-filter-select"
                  >
                    <MenuItem value="All">All Regions</MenuItem>
                    {REGIONS.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                  <Select
                    size="small"
                    value={ttype}
                    onChange={(e) => setTtype(e.target.value as TransformerType | "All")}
                    className="dashboard-filter-select"
                  >
                    <MenuItem value="All">All Types</MenuItem>
                    {TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
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
                {loading ? (
                  <Box className="dashboard-loading-container">
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Box className="dashboard-error-container">
                    <Typography color="error">{error}</Typography>
                    <Button onClick={fetchTransformers} className="dashboard-retry-button">
                      Retry
                    </Button>
                  </Box>
                ) : (
                  <>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell width={48}></TableCell>
                            <TableCell
                              sortDirection={
                                orderBy === "transformerNo" ? order : false
                              }
                            >
                              <TableSortLabel
                                active={orderBy === "transformerNo"}
                                direction={
                                  orderBy === "transformerNo" ? order : "asc"
                                }
                                onClick={handleRequestSort("transformerNo")}
                              >
                                <Typography fontWeight="bold">Transformer No.</Typography>
                              </TableSortLabel>
                            </TableCell>
                            <TableCell><Typography fontWeight="bold">Pole No.</Typography></TableCell>
                            <TableCell><Typography fontWeight="bold">Region</Typography></TableCell>
                            <TableCell><Typography fontWeight="bold">Type</Typography></TableCell>
                            <TableCell align="right"></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paged.map((row) => (
                            <TableRow key={row.transformerNo} hover>
                              <TableCell width={48}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleFavorite(row)}
                                  aria-label={
                                    row.favorite ? "unfavorite" : "favorite"
                                  }
                                >
                                  {row.favorite ? (
                                    <StarIcon color="secondary" />
                                  ) : (
                                    <StarBorderIcon color="disabled" />
                                  )}
                                </IconButton>
                              </TableCell>
                              <TableCell>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                >
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
                              <TableCell>{row.poleNo}</TableCell>
                              <TableCell>{row.region}</TableCell>
                              <TableCell>
                                <Chip
                                  label={row.type}
                                  size="small"
                                  color={
                                    row.type === "Bulk" ? "default" : "primary"
                                  }
                                  variant={
                                    row.type === "Bulk" ? "outlined" : "filled"
                                  }
                                />
                              </TableCell>
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
                                      navigate(`/${row.transformerNo}`)
                                    }
                                  >
                                    View
                                  </Button>
                                  <IconButton
                                    onClick={(e) =>
                                      handleOpenActionMenu(e, row)
                                    }
                                  >
                                    <MoreVertIcon />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                          {paged.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6}>
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
                      onPageChange={(_, p) => setPage(p)}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                      }}
                      rowsPerPageOptions={[5, 10, 20, 50]}
                    />
                  </>
                )}
              </Paper>
            </Stack>
          ) : (
            <Inspections view="inspections" onChangeView={setView} />
          )}
        </Box>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseActionMenu}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          className: "dashboard-action-menu",
        }}
      >
        <MenuItem
          onClick={() =>
            selectedTransformer && openEditDialog(selectedTransformer)
          }
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem
          onClick={() =>
            selectedTransformer && openDeleteDialog(selectedTransformer)
          }
          className="dashboard-delete-menu-item"
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

      {/* Add/Edit Transformer Dialog */}
      <AddTransformerDialog
        open={openDialog}
        onClose={closeDialog}
        onSave={handleTransformerSave}
        transformer={editingTransformer}
        regions={REGIONS}
        types={TYPES}
        isSaving={saving}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteTransformerConfirmationDialog
        open={deleteDialog.open}
        onClose={closeDeleteDialog}
        onConfirm={handleTransformerDelete}
        transformer={deleteDialog.transformer}
        isDeleting={saving}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          className="dashboard-snackbar-alert"
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
