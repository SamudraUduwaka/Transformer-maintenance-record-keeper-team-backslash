import * as React from "react"; 
import { 
  AppBar, Avatar, Badge, Box, Button, Chip, CssBaseline, Divider, Drawer, 
  IconButton, InputAdornment, List, ListItem, ListItemButton, ListItemIcon, 
  ListItemText, MenuItem, Paper, Select, Stack, TextField, ThemeProvider, 
  Toolbar, Tooltip, Typography, createTheme, Table, TableBody, TableCell, 
  TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, 
  Switch, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, 
  InputLabel, ToggleButton, ToggleButtonGroup, Snackbar, Alert, CircularProgress,
  Menu, ListItemAvatar
} from "@mui/material"; 
import { 
  Menu as MenuIcon, Notifications as NotificationsIcon, 
  Settings as SettingsIcon, Search as SearchIcon, Star as StarIcon, 
  StarBorder as StarBorderIcon, Bolt as BoltIcon, List as ListIcon, 
  Add as AddIcon, Tune as TuneIcon, MoreVert as MoreVertIcon,
  Edit as EditIcon, Delete as DeleteIcon, Warning as WarningIcon
} from "@mui/icons-material"; 
import { useNavigate } from "react-router-dom"; 
import Inspections from "./Inspections"; 

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
    const response = await fetch(`${API_BASE_URL}/transformers/${transformerNo}`);
    if (!response.ok) throw new Error("Failed to fetch transformer");
    return response.json();
  },
  
  create: async (transformer: Omit<Transformer, 'id'>): Promise<Transformer> => {
    const response = await fetch(`${API_BASE_URL}/transformers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transformer)
    });
    if (!response.ok) throw new Error("Failed to create transformer");
    return response.json();
  },
  
  update: async (transformerNo: string, transformer: Transformer): Promise<Transformer> => {
    const response = await fetch(`${API_BASE_URL}/transformers/${transformerNo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transformer)
    });
    if (!response.ok) throw new Error("Failed to update transformer");
    return response.json();
  },
  
  delete: async (transformerNo: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/transformers/${transformerNo}`, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error("Failed to delete transformer");
  },
  
  patch: async (transformerNo: string, updates: Partial<Transformer>): Promise<Transformer> => {
    const response = await fetch(`${API_BASE_URL}/transformers/${transformerNo}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error("Failed to update transformer");
    return response.json();
  }
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

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key
): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
  return order === "desc" ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number) {
  const stabilized = array.map((el, idx) => [el, idx] as const);
  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
}

/* Theme */
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4F46E5" },
    secondary: { main: "#7C3AED" },
    background: { default: "#F7F7FB" },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { borderRadius: 16 } }
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", borderRadius: 14, fontWeight: 600 }
      },
    },
  },
});

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
  const [orderBy, setOrderBy] = React.useState<keyof Transformer>("transformerNo");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // Dialog states
  const [openDialog, setOpenDialog] = React.useState(false);
  const [editingTransformer, setEditingTransformer] = React.useState<Transformer | null>(null);
  const [form, setForm] = React.useState({
    region: "",
    transformerNo: "",
    poleNo: "",
    type: "" as TransformerType | "",
    location: "",
  });
  const [errors, setErrors] = React.useState<{ [k: string]: boolean }>({});
  const [snackbar, setSnackbar] = React.useState({ 
    open: false, 
    message: "", 
    severity: "success" as "success" | "error" 
  });

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = React.useState({ 
    open: false, 
    transformer: null as Transformer | null 
  });

  // Action menu
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedTransformer, setSelectedTransformer] = React.useState<Transformer | null>(null);

  // Fetch transformers on component mount
  React.useEffect(() => {
    fetchTransformers();
  }, []);

  const fetchTransformers = async () => {
    try {
      setLoading(true);
      const data = await transformersAPI.getAll();
      setRows(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch transformers");
      showSnackbar("Failed to fetch transformers", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: "success" | "error" = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filtered = React.useMemo(
    () => rows.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = !q || r.transformerNo.toLowerCase().includes(q) || r.poleNo.toLowerCase().includes(q);
      const matchRegion = region === "All" || r.region === region;
      const matchType = ttype === "All" || r.type === ttype;
      const matchFav = !onlyFav || r.favorite;
      return matchSearch && matchRegion && matchType && matchFav;
    }),
    [rows, search, region, ttype, onlyFav]
  );

  const sorted = React.useMemo(() => stableSort(filtered, getComparator(order, orderBy)), [filtered, order, orderBy]);
  const paged = React.useMemo(() => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [sorted, page, rowsPerPage]);

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
  const handleOpenActionMenu = (event: React.MouseEvent<HTMLElement>, transformer: Transformer) => {
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
    setForm({
      region: "",
      transformerNo: "",
      poleNo: "",
      type: "",
      location: "",
    });
    setErrors({});
    setOpenDialog(true);
  };

  const openEditDialog = (transformer: Transformer) => {
    setEditingTransformer(transformer);
    setForm({
      region: transformer.region,
      transformerNo: transformer.transformerNo,
      poleNo: transformer.poleNo,
      type: transformer.type,
      location: transformer.location || "",
    });
    setErrors({});
    setOpenDialog(true);
    handleCloseActionMenu();
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setEditingTransformer(null);
    setErrors({});
    setForm({
      region: "",
      transformerNo: "",
      poleNo: "",
      type: "",
      location: "",
    });
  };

  const updateField = (k: keyof typeof form) => (e: any) => 
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const confirmSave = async () => {
    const newErrors = {
      region: !form.region,
      transformerNo: !form.transformerNo,
      poleNo: !form.poleNo,
      type: !form.type,
    };
    
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    try {
      if (editingTransformer) {
        // Edit existing transformer
        const updatedTransformer: Transformer = {
          ...editingTransformer,
          transformerNo: form.transformerNo,
          poleNo: form.poleNo,
          region: form.region,
          type: form.type as TransformerType,
          location: form.location || undefined
        };

        const savedTransformer = await transformersAPI.update(
          editingTransformer.transformerNo, 
          updatedTransformer
        );
        
        setRows((rs) => rs.map(r => 
          r.transformerNo === editingTransformer.transformerNo ? savedTransformer : r
        ));
        
        showSnackbar("Transformer updated successfully");
      } else {
        // Add new transformer
        const newTransformer: Omit<Transformer, 'id'> = {
          transformerNo: form.transformerNo,
          poleNo: form.poleNo,
          region: form.region,
          type: form.type as TransformerType,
          favorite: false,
          location: form.location || undefined
        };

        const savedTransformer = await transformersAPI.create(newTransformer);
        setRows((rs) => [savedTransformer, ...rs]);
        showSnackbar("Transformer added successfully");
      }
      
      closeDialog();
    } catch (err) {
      const action = editingTransformer ? 'update' : 'add';
      showSnackbar(
        err instanceof Error ? err.message : `Failed to ${action} transformer`, 
        "error"
      );
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

  const confirmDelete = async () => {
    if (!deleteDialog.transformer) return;
    
    try {
      await transformersAPI.delete(deleteDialog.transformer.transformerNo);
      setRows(rows.filter(t => t.transformerNo !== deleteDialog.transformer!.transformerNo));
      showSnackbar("Transformer deleted successfully");
      closeDeleteDialog();
    } catch (err) {
      showSnackbar("Failed to delete transformer", "error");
    }
  };

  const handleToggleFavorite = async (transformer: Transformer) => {
    try {
      const updatedTransformer = await transformersAPI.patch(
        transformer.transformerNo, 
        { favorite: !transformer.favorite }
      );
      
      setRows(rows.map(t => 
        t.transformerNo === transformer.transformerNo ? updatedTransformer : t
      ));
      
      showSnackbar(
        updatedTransformer.favorite 
          ? "Added to favorites" 
          : "Removed from favorites"
      );
    } catch (err) {
      showSnackbar("Failed to update favorite status", "error");
    }
  };

  /* Drawer */
  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 2 }}>
        <BoltIcon />
        <Typography variant="h6" fontWeight={800}>Oversight</Typography>
      </Stack>
      <Divider />
      <List sx={{ p: 1 }}>
        <ListItem disablePadding>
          <ListItemButton selected={view === "transformers"} onClick={() => setView("transformers")}>
            <ListItemIcon><ListIcon /></ListItemIcon>
            <ListItemText primary="Transformer" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon><SettingsIcon /></ListItemIcon>
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
      
      {/* Top App Header */}
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ 
        bgcolor: "background.paper", 
        borderBottom: (t) => `1px solid ${t.palette.divider}`, 
        ml: { sm: `${drawerWidth}px` }, 
        width: { sm: `calc(100% - ${drawerWidth}px)` } 
      }}>
        <Toolbar sx={{ minHeight: 72 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <IconButton onClick={() => setMobileOpen(!mobileOpen)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Transformers</Typography>
          </Stack>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Notifications">
            <IconButton>
              <Badge color="secondary" variant="dot"><NotificationsIcon /></Badge>
            </IconButton>
          </Tooltip>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ ml: 1 }}>
            <Avatar src="https://i.pravatar.cc/64?img=1" sx={{ width: 36, height: 36 }} />
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Typography variant="subtitle2" sx={{ lineHeight: 1 }}>Olivera Queen</Typography>
              <Typography variant="caption" color="text.secondary">olivera@gmail.com</Typography>
            </Box>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="sidebar">
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} 
          ModalProps={{ keepMounted: true }} 
          sx={{ display: { xs: "block", sm: "none" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: "none", sm: "block" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth } }} open>
          {drawer}
        </Drawer>
      </Box>

      {/* Main */}
      <Box sx={{ display: "flex", bgcolor: "background.default" }}>
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 1 }, mt: 9, ml: { sm: `${drawerWidth}px` } }}>
          {view === "transformers" ? (
            <Stack spacing={2}>
              {/* Section header card */}
              <Paper elevation={3} sx={{ p: 2, borderRadius: 1 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box sx={{ 
                      bgcolor: "primary.main", 
                      color: "primary.contrastText", 
                      fontWeight: 700, 
                      borderRadius: 2, 
                      px: 1.2, 
                      py: 0.4, 
                      boxShadow: "0 6px 16px rgba(79,70,229,0.25)" 
                    }}>
                      {filtered.length}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Transformers</Typography>
                  </Stack>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog} sx={{ 
                    ml: { md: 1 }, 
                    borderRadius: 999, 
                    px: 2.5, 
                    py: 0.9, 
                    fontWeight: 700, 
                    textTransform: "none", 
                    background: "linear-gradient(180deg, #4F46E5 0%, #2E26C3 100%)", 
                    boxShadow: "0 8px 18px rgba(79,70,229,0.35)", 
                    "&:hover": { 
                      background: "linear-gradient(180deg, #4338CA 0%, #2A21B8 100%)", 
                      boxShadow: "0 10px 22px rgba(79,70,229,0.45)" 
                    }, 
                  }}>
                    Add Transformer
                  </Button>

                  {/* Pill toggle on the right side */}
                  <Box sx={{ flexGrow: 1 }} />
                  <Paper elevation={3} sx={{ p: 0.5, borderRadius: 999 }}>
                    <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} sx={{ 
                      "& .MuiToggleButton-root": { border: 0, textTransform: "none", px: 2.2, py: 0.8, borderRadius: 999, fontWeight: 600 } 
                    }}>
                      <ToggleButton value="transformers" sx={{ 
                        bgcolor: view === "transformers" ? "primary.main" : "transparent", 
                        color: view === "transformers" ? "primary.contrastText" : "text.primary", 
                        "&:hover": { bgcolor: view === "transformers" ? "primary.dark" : "action.hover" } 
                      }}>
                        Transformers
                      </ToggleButton>
                      <ToggleButton value="inspections" sx={{ 
                        bgcolor: view === "inspections" ? "primary.main" : "transparent", 
                        color: view === "inspections" ? "primary.contrastText" : "text.primary", 
                        "&:hover": { bgcolor: view === "inspections" ? "primary.dark" : "action.hover" } 
                      }}>
                        Inspections
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Paper>
                </Stack>

                {/* Filter row */}
                <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems="center" sx={{ mt: 2 }}>
                  <TextField fullWidth size="small" placeholder="Search Transformer" value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }} 
                  />
                  <Select size="small" value={region} onChange={(e) => setRegion(e.target.value)} sx={{ minWidth: 180 }}>
                    <MenuItem value="All">All Regions</MenuItem>
                    {REGIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </Select>
                  <Select size="small" value={ttype} onChange={(e) => setTtype(e.target.value as any)} sx={{ minWidth: 180 }}>
                    <MenuItem value="All">All Types</MenuItem>
                    {TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <StarIcon sx={{ fontSize: 18 }} color={onlyFav ? "secondary" : "disabled"} />
                    <Switch checked={onlyFav} onChange={(e) => setOnlyFav(e.target.checked)} />
                    <Typography variant="body2" color="text.secondary">Favorites only</Typography>
                  </Stack>
                  <Button onClick={resetFilters} sx={{ textTransform: "none" }}>Reset Filters</Button>
                </Stack>
              </Paper>

              {/* Table */}
              <Paper>
                {loading ? (
                  <Box sx={{ p: 4, textAlign: "center" }}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Box sx={{ p: 4, textAlign: "center" }}>
                    <Typography color="error">{error}</Typography>
                    <Button onClick={fetchTransformers} sx={{ mt: 2 }}>Retry</Button>
                  </Box>
                ) : (
                  <>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell width={48}></TableCell>
                            <TableCell sortDirection={orderBy === "transformerNo" ? order : false}>
                              <TableSortLabel active={orderBy === "transformerNo"} direction={orderBy === "transformerNo" ? order : "asc"} 
                                onClick={handleRequestSort("transformerNo")}>
                                Transformer No.
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>Pole No.</TableCell>
                            <TableCell>Region</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paged.map((row) => (
                            <TableRow key={row.transformerNo} hover>
                              <TableCell width={48}>
                                <IconButton size="small" onClick={() => handleToggleFavorite(row)} 
                                  aria-label={row.favorite ? "unfavorite" : "favorite"}>
                                  {row.favorite ? <StarIcon color="secondary" /> : <StarBorderIcon color="disabled" />}
                                </IconButton>
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography fontWeight={600}>{row.transformerNo}</Typography>
                                  <Chip size="small" label="↓" variant="outlined" sx={{ borderRadius: 1 }} />
                                </Stack>
                              </TableCell>
                              <TableCell>{row.poleNo}</TableCell>
                              <TableCell>{row.region}</TableCell>
                              <TableCell>
                                <Chip label={row.type} size="small" color={row.type === "Bulk" ? "default" : "primary"} 
                                  variant={row.type === "Bulk" ? "outlined" : "filled"} />
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Button variant="contained" size="small" 
                                    onClick={() => navigate(`/${row.transformerNo}`)}>
                                    View
                                  </Button>
                                  <IconButton onClick={(e) => handleOpenActionMenu(e, row)}>
                                    <MoreVertIcon />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                          {paged.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6}>
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
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 150,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: 2
          }
        }}
      >
        <MenuItem onClick={() => selectedTransformer && openEditDialog(selectedTransformer)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem 
          onClick={() => selectedTransformer && openDeleteDialog(selectedTransformer)} 
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

      {/* Add/Edit Transformer Dialog */}
      <Dialog open={openDialog} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          {editingTransformer ? 'Edit Transformer' : 'Add New Transformer'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small" error={!!errors.region}>
              <InputLabel id="region-label">Region *</InputLabel>
              <Select 
                labelId="region-label" 
                label="Region *" 
                value={form.region} 
                onChange={updateField("region")}
              >
                {REGIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
              {errors.region && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  Region is required
                </Typography>
              )}
            </FormControl>

            <TextField 
              size="small" 
              label="Transformer No *" 
              value={form.transformerNo} 
              onChange={updateField("transformerNo")} 
              error={!!errors.transformerNo}
              helperText={errors.transformerNo ? "Transformer number is required" : ""} 
              fullWidth 
              disabled={!!editingTransformer} // Disable editing transformer number for existing records
            />

            <TextField 
              size="small" 
              label="Pole No *" 
              value={form.poleNo} 
              onChange={updateField("poleNo")} 
              error={!!errors.poleNo} 
              helperText={errors.poleNo ? "Pole number is required" : ""} 
              fullWidth 
            />

            <FormControl fullWidth size="small" error={!!errors.type}>
              <InputLabel id="type-label">Type *</InputLabel>
              <Select 
                labelId="type-label" 
                label="Type *" 
                value={form.type} 
                onChange={updateField("type")}
              >
                {TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
              {errors.type && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  Type is required
                </Typography>
              )}
            </FormControl>

            <TextField 
              size="small" 
              label="Location Details" 
              value={form.location} 
              onChange={updateField("location")} 
              fullWidth 
              multiline 
              minRows={3}
              placeholder="Enter detailed location information..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button onClick={closeDialog} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={confirmSave}
            sx={{ 
              minWidth: 100,
              background: editingTransformer 
                ? "linear-gradient(45deg, #FF9800 30%, #F57C00 90%)" 
                : "linear-gradient(45deg, #4CAF50 30%, #45a049 90%)"
            }}
          >
            {editingTransformer ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={closeDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <WarningIcon color="error" />
            <Typography variant="h6" component="span">
              Confirm Delete
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this transformer?
          </Typography>
          
          {deleteDialog.transformer && (
            <Paper sx={{ p: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Transformer No:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {deleteDialog.transformer.transformerNo}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Pole No:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {deleteDialog.transformer.poleNo}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Region:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {deleteDialog.transformer.region}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          )}

          <Typography variant="body2" color="error" sx={{ mt: 2, fontStyle: 'italic' }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button onClick={closeDeleteDialog} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={confirmDelete}
            sx={{ 
              minWidth: 100,
              background: "linear-gradient(45deg, #f44336 30%, #d32f2f 90%)",
              "&:hover": {
                background: "linear-gradient(45deg, #d32f2f 30%, #b71c1c 90%)"
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: 2
          }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}