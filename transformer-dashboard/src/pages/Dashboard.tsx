import * as React from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CssBaseline,
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
  TableSortLabel,
  Switch,
} from "@mui/material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
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
  Tune as TuneIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";

// -----------------------
// Types
// -----------------------

type TransformerType = "Bulk" | "Distribution";

type Transformer = {
  id: number;
  transformerNo: string;
  poleNo: string;
  region: string;
  type: TransformerType;
  favorite?: boolean;
};

// -----------------------
// Mock Data
// -----------------------

const REGIONS = ["Nugegoda", "Maharagama", "Kotte", "Dehiwala"] as const;
const TYPES: TransformerType[] = ["Bulk", "Distribution"];

const makeData = (): Transformer[] => {
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

// -----------------------
// Helpers
// -----------------------

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
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as const);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

// -----------------------
// Theme
// -----------------------

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4F46E5" }, // indigo
    secondary: { main: "#7C3AED" }, // violet
    background: { default: "#F7F7FB" },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { borderRadius: 16 } } },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", borderRadius: 14, fontWeight: 600 },
      },
    },
  },
});

// -----------------------
// Main Component
// -----------------------

const drawerWidth = 260;

export default function App() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [rows, setRows] = React.useState<Transformer[]>(makeData());

  // filters & search
  const [search, setSearch] = React.useState("");
  const [region, setRegion] = React.useState<string | "All">("All");
  const [ttype, setTtype] = React.useState<TransformerType | "All">("All");
  const [onlyFav, setOnlyFav] = React.useState(false);

  // sort & pagination
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] = React.useState<keyof Transformer>("transformerNo");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // add transformer dialog state
  const [openAdd, setOpenAdd] = React.useState(false);
  const [form, setForm] = React.useState({
    region: "",
    transformerNo: "",
    poleNo: "",
    type: "" as TransformerType | "",
    location: "",
  });
  const [errors, setErrors] = React.useState<{[k: string]: boolean}>({});

  const handleRequestSort = (property: keyof Transformer) => () => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const openAddDialog = () => setOpenAdd(true);
  const closeAddDialog = () => { setOpenAdd(false); setErrors({}); };

  const updateField = (key: keyof typeof form) => (e: any) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const confirmAdd = () => {
    // simple validation
    const newErrors: {[k: string]: boolean} = {
      region: !form.region,
      transformerNo: !form.transformerNo,
      poleNo: !form.poleNo,
      type: !form.type,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    const newRow: Transformer = {
      id: rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1,
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

  const filtered = React.useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        !search ||
        r.transformerNo.toLowerCase().includes(search.toLowerCase()) ||
        r.poleNo.toLowerCase().includes(search.toLowerCase());
      const matchRegion = region === "All" || r.region === region;
      const matchType = ttype === "All" || r.type === ttype;
      const matchFav = !onlyFav || r.favorite;
      return matchSearch && matchRegion && matchType && matchFav;
    });
  }, [rows, search, region, ttype, onlyFav]);

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
    setRegion("All");
    setTtype("All");
    setOnlyFav(false);
  };

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
          <ListItemButton selected>
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
      <Box sx={{ p: 2, pb: 3 }}>
        <Paper sx={{ p: 2, bgcolor: "background.default" }}>
          <Typography variant="body2" color="text.secondary">
            v0.1 — demo UI
          </Typography>
        </Paper>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
        {/* AppBar */}
        <AppBar
          position="fixed"
          color="inherit"
          elevation={0}
          sx={{
            borderBottom: (t) => `1px solid ${t.palette.divider}`,
            ml: { sm: `${drawerWidth}px` },
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            bgcolor: "background.paper",
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 1, display: { sm: "none" } }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 800, display: { xs: "none", sm: "block" } }}>
              Transformers
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Notifications">
              <IconButton>
                <Badge color="secondary" variant="dot">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Stack direction="row" spacing={1} alignItems="center">
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
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        {/* Main */}
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, mt: 8 }}>
          <Stack spacing={2}>
            {/* Toolbar row */}
            <Paper sx={{ p: 2 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, flexShrink: 0 }}>
                  Transformers
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog} sx={{ ml: { md: 2 } }}>
                  Add Transformer
                </Button>
                <Box sx={{ flexGrow: 1 }} />

                <Chip icon={<TuneIcon />} label="Reset Filters" onClick={resetFilters} variant="outlined" />
              </Stack>

              <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems="center" sx={{ mt: 2 }}>
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

                <Select size="small" value={region} onChange={(e) => setRegion(e.target.value)} sx={{ minWidth: 180 }}>
                  <MenuItem value="All">All Regions</MenuItem>
                  {REGIONS.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>

                <Select size="small" value={ttype} onChange={(e) => setTtype(e.target.value as any)} sx={{ minWidth: 180 }}>
                  <MenuItem value="All">All Types</MenuItem>
                  {TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <StarIcon sx={{ fontSize: 18 }} color={onlyFav ? "secondary" : "disabled"} />
                  <Switch checked={onlyFav} onChange={(e) => setOnlyFav(e.target.checked)} inputProps={{ "aria-label": "Only favorites" }} />
                  <Typography variant="body2" color="text.secondary">
                    Favorites only
                  </Typography>
                </Stack>
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
                            <Button variant="contained" size="small">View</Button>
                            <IconButton>
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
                            <Typography>No results</Typography>
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
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 20, 50]}
              />
            </Paper>
          </Stack>
        </Box>
      </Box>
    {/* Add Transformer Dialog */}
      <Dialog open={openAdd} onClose={closeAddDialog} fullWidth maxWidth="sm">
        <DialogTitle>Add Transformer</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="region-label">Region</InputLabel>
              <Select
                labelId="region-label"
                label="Region"
                value={form.region}
                onChange={updateField("region")}
                error={!!errors.region}
              >
                {REGIONS.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Transformer No"
              value={form.transformerNo}
              onChange={updateField("transformerNo")}
              error={!!errors.transformerNo}
              helperText={errors.transformerNo ? "Required" : ""}
              fullWidth
            />

            <TextField
              size="small"
              label="Pole No"
              value={form.poleNo}
              onChange={updateField("poleNo")}
              error={!!errors.poleNo}
              helperText={errors.poleNo ? "Required" : ""}
              fullWidth
            />

            <FormControl fullWidth size="small">
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                label="Type"
                value={form.type}
                onChange={updateField("type")}
                error={!!errors.type}
              >
                {TYPES.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Location Details"
              value={form.location}
              onChange={updateField("location")}
              fullWidth
              multiline
              minRows={3}
            />
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
