import * as React from "react";
import {
  AppBar, Avatar, Badge, Box, Button, Chip, CssBaseline, Divider, Drawer,
  IconButton, InputAdornment, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, MenuItem, Paper, Select, Stack, TextField, ThemeProvider,
  Toolbar, Tooltip, Typography, createTheme, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  ToggleButton, ToggleButtonGroup
} from "@mui/material";
import {
  Menu as MenuIcon, Notifications as NotificationsIcon, Settings as SettingsIcon,
  Search as SearchIcon, Star as StarIcon, StarBorder as StarBorderIcon, Bolt as BoltIcon,
  List as ListIcon, Add as AddIcon, MoreVert as MoreVertIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Inspections from "./Inspections";

/* Types */
type TransformerType = "Bulk" | "Distribution";
type Transformer = {
  id: number;
  transformerNo: string;
  poleNo: string;
  region: string;
  type: TransformerType;
  favorite?: boolean;
};

/* Mock */
const REGIONS = ["Nugegoda", "Maharagama", "Kotte", "Dehiwala"] as const;
const TYPES: TransformerType[] = ["Bulk", "Distribution"];
const makeTransformers = (): Transformer[] => {
  const rows: Transformer[] = [];
  const pad = (n: number) => n.toString().padStart(4, "0");
  for (let i = 1; i <= 75; i++) {
    rows.push({
      id: i,
      transformerNo: `AZ-${pad(i)}`,
      poleNo: `EN-12${i % 5}-${["A", "B", "C"][i % 3]}`,
      region: REGIONS[i % REGIONS.length],
      type: TYPES[i % TYPES.length],
      favorite: i % 7 === 0,
    });
  }
  return rows;
};

/* Sort helpers */
type Order = "asc" | "desc";
function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}
function getComparator<T>(order: Order, orderBy: keyof T): (a: T, b: T) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
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
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { borderRadius: 16 } } },
    MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 14, fontWeight: 600 } } },
  },
});

const drawerWidth = 260;

export default function Dashboard() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [view, setView] = React.useState<"transformers" | "inspections">("transformers");

  const navigate = useNavigate();

  // Transformers state
  const [rows, setRows] = React.useState<Transformer[]>(makeTransformers());
  const [search, setSearch] = React.useState("");
  const [region, setRegion] = React.useState<string | "All">("All");
  const [ttype, setTtype] = React.useState<TransformerType | "All">("All");
  const [onlyFav, setOnlyFav] = React.useState(false);
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] = React.useState<keyof Transformer>("transformerNo");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // Add dialog
  const [openAdd, setOpenAdd] = React.useState(false);
  const [form, setForm] = React.useState({
    region: "",
    transformerNo: "",
    poleNo: "",
    type: "" as TransformerType | "",
    location: "",
  });
  const [errors, setErrors] = React.useState<{ [k: string]: boolean }>({});

  const filtered = React.useMemo(
    () =>
      rows.filter((r) => {
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
  const resetFilters = () => { setSearch(""); setRegion("All"); setTtype("All"); setOnlyFav(false); };
  const openAddDialog = () => setOpenAdd(true);
  const closeAddDialog = () => { setOpenAdd(false); setErrors({}); };
  const updateField = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => setForm((f) => ({ ...f, [k]: (e.target as HTMLInputElement | HTMLTextAreaElement | { value: unknown }).value }));
  const confirmAdd = () => {
    const newErrors = {
      region: !form.region,
      transformerNo: !form.transformerNo,
      poleNo: !form.poleNo,
      type: !form.type,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;
    const newRow: Transformer = {
      id: rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1,
      transformerNo: form.transformerNo,
      poleNo: form.poleNo,
      region: form.region,
      type: form.type as TransformerType,
      favorite: false,
    };
    setRows((rs) => [newRow, ...rs]);
    setForm({ region: "", transformerNo: "", poleNo: "", type: "", location: "" });
    closeAddDialog();
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
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{ bgcolor: "background.paper", borderBottom: (t) => `1px solid ${t.palette.divider}`, ml: { sm: `${drawerWidth}px` }, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
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
          {view === "transformers" ? (
            <Stack spacing={2}>
              {/* Section header card */}
              <Paper elevation={3} sx={{ p: 2, borderRadius: 1 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 700, borderRadius: 2, px: 1.2, py: 0.4, boxShadow: "0 6px 16px rgba(79,70,229,0.25)" }}>
                      {filtered.length}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Transformers</Typography>
                  </Stack>

                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openAddDialog}
                    sx={{
                      ml: { md: 1 },
                      borderRadius: 999,
                      px: 2.5,
                      py: 0.9,
                      fontWeight: 700,
                      textTransform: "none",
                      background: "linear-gradient(180deg, #4F46E5 0%, #2E26C3 100%)",
                      boxShadow: "0 8px 18px rgba(79,70,229,0.35)",
                      "&:hover": { background: "linear-gradient(180deg, #4338CA 0%, #2A21B8 100%)", boxShadow: "0 10px 22px rgba(79,70,229,0.45)" },
                    }}
                  >
                    Add Transformer
                  </Button>

                  {/* Pill toggle on the right side */}
                  <Box sx={{ flexGrow: 1 }} />
                  <Paper elevation={3} sx={{ p: 0.5, borderRadius: 999 }}>
                    <ToggleButtonGroup
                      value={view}
                      exclusive
                      onChange={(_, v) => v && setView(v)}
                      sx={{ "& .MuiToggleButton-root": { border: 0, textTransform: "none", px: 2.2, py: 0.8, borderRadius: 999, fontWeight: 600 } }}
                    >
                      <ToggleButton
                        value="transformers"
                        sx={{ bgcolor: view === "transformers" ? "primary.main" : "transparent", color: view === "transformers" ? "primary.contrastText" : "text.primary", "&:hover": { bgcolor: view === "transformers" ? "primary.dark" : "action.hover" } }}
                      >
                        Transformers
                      </ToggleButton>
                      <ToggleButton
                        value="inspections"
                        sx={{ bgcolor: view === "inspections" ? "primary.main" : "transparent", color: view === "inspections" ? "primary.contrastText" : "text.primary", "&:hover": { bgcolor: view === "inspections" ? "primary.dark" : "action.hover" } }}
                      >
                        Inspections
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Paper>
                </Stack>

                {/* Filter row */}
                <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems="center" sx={{ mt: 2 }}>
                  <TextField
                    fullWidth size="small" placeholder="Search Transformer" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
                  />
                  <Select size="small" value={region} onChange={(e) => setRegion(e.target.value)} sx={{ minWidth: 180 }}>
                    <MenuItem value="All">All Regions</MenuItem>
                    {REGIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </Select>
                  <Select size="small" value={ttype} onChange={(e) => setTtype(e.target.value as TransformerType | "All")} sx={{ minWidth: 180 }}>
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
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell width={48}></TableCell>
                        <TableCell sortDirection={orderBy === "transformerNo" ? order : false}>
                          <TableSortLabel active={orderBy === "transformerNo"} direction={orderBy === "transformerNo" ? order : "asc"} onClick={handleRequestSort("transformerNo")}>
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
                        <TableRow key={row.id} hover>
                          <TableCell width={48}>
                            <IconButton size="small" aria-label={row.favorite ? "unfavorite" : "favorite"}>
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
                            <Chip label={row.type} size="small" color={row.type === "Bulk" ? "default" : "primary"} variant={row.type === "Bulk" ? "outlined" : "filled"} />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              {/* 👇 navigate to /:transformerNo */}
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => navigate(`/${row.transformerNo}`)}
                              >
                                View
                              </Button>
                              <IconButton><MoreVertIcon /></IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {paged.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <Box sx={{ p: 4, textAlign: "center" }}><Typography>No results</Typography></Box>
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
                  onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                  rowsPerPageOptions={[5, 10, 20, 50]}
                />
              </Paper>
            </Stack>
          ) : (
            <Inspections view="inspections" onChangeView={setView} />
          )}
        </Box>
      </Box>

      {/* Add Transformer Dialog */}
      <Dialog open={openAdd} onClose={closeAddDialog} fullWidth maxWidth="sm">
        <DialogTitle>Add Transformer</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="region-label">Region</InputLabel>
              <Select labelId="region-label" label="Region" value={form.region} onChange={updateField("region")} error={!!errors.region}>
                {REGIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="Transformer No" value={form.transformerNo} onChange={updateField("transformerNo")}
              error={!!errors.transformerNo} helperText={errors.transformerNo ? "Required" : ""} fullWidth />
            <TextField size="small" label="Pole No" value={form.poleNo} onChange={updateField("poleNo")}
              error={!!errors.poleNo} helperText={errors.poleNo ? "Required" : ""} fullWidth />
            <FormControl fullWidth size="small">
              <InputLabel id="type-label">Type</InputLabel>
              <Select labelId="type-label" label="Type" value={form.type} onChange={updateField("type")} error={!!errors.type}>
                {TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="Location Details" value={form.location} onChange={updateField("location")} fullWidth multiline minRows={3} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={confirmAdd}>Confirm</Button>
          <Button onClick={closeAddDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
