import * as React from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CssBaseline,
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
} from "@mui/material";
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

/* Props controlled by Dashboard */
type Props = {
  view?: "transformers" | "inspections";
  onChangeView?: (v: "transformers" | "inspections") => void;
};

/* Types */
type InspectionStatus = "In Progress" | "Pending" | "Completed";
type InspectionRow = {
  id: number;
  transformerNo: string;
  inspectionNo: string;
  inspectedDate: string;
  maintenanceDate?: string;
  status: InspectionStatus;
};

/* Mock */
const makeInspections = (): InspectionRow[] => {
  const statuses: InspectionStatus[] = ["In Progress", "Pending", "Completed"];
  const rows: InspectionRow[] = [];
  for (let i = 1; i <= 60; i++) {
    rows.push({
      id: i,
      transformerNo: `AZ-${(8800 + i).toString()}`,
      inspectionNo: (123500 + i).toString().padStart(8, "0"),
      inspectedDate: new Date(2025, 6, (i % 28) + 1, 19, 12).toLocaleString(),
      maintenanceDate:
        i % 3 === 0 ? "-" : new Date(2025, 6, ((i + 3) % 28) + 1, 19, 12).toLocaleString(),
      status: statuses[i % statuses.length],
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
function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key
): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
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

/* Status chip */
const statusChip = (s: InspectionStatus) => {
  const map: Record<InspectionStatus, { color: "success" | "warning" | "info"; label: string }> = {
    Completed: { color: "success", label: "Completed" },
    Pending: { color: "warning", label: "Pending" },
    "In Progress": { color: "info", label: "In Progress" },
  };
  const i = map[s];
  return <Chip size="small" variant="outlined" color={i.color} label={i.label} />;
};

/* Match your drawer width so the fixed AppBar lines up */
const drawerWidth = 260;

export default function Inspections({ view = "inspections", onChangeView }: Props) {
  const navigate = useNavigate();

  const [rows] = React.useState<InspectionRow[]>(makeInspections());
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<InspectionStatus | "All">("All");
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] = React.useState<keyof InspectionRow>("transformerNo");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  /* -------- New Inspection dialog state -------- */
  const [addOpen, setAddOpen] = React.useState(false);
  const [branch, setBranch] = React.useState("");
  const [transformerNo, setTransformerNo] = React.useState("");
  const [date, setDate] = React.useState(""); // yyyy-mm-dd
  const [time, setTime] = React.useState(""); // hh:mm

  const canConfirm = branch.trim() && transformerNo.trim() && date && time;

  const handleOpenAdd = () => setAddOpen(true);
  const handleCloseAdd = () => setAddOpen(false);
  const handleConfirmAdd = () => {
    // hook into your create API here
    setAddOpen(false);
    // optional: navigate to that transformer's page
    // navigate(`/${encodeURIComponent(transformerNo)}`);
  };

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const m1 =
        !q ||
        r.transformerNo.toLowerCase().includes(q) ||
        r.inspectionNo.toLowerCase().includes(q);
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

  return (
    <>
      <CssBaseline />

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

      {/* Push page content below fixed AppBar */}
      <Box sx={{ mt: 0, width: "100%" }}>
        <Stack spacing={2} sx={{ width: "100%" }}>
          {/* Header card */}
          <Paper elevation={3} sx={{ p: 2, borderRadius: 1, width: "100%", boxSizing: "border-box" }}>
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
                      bgcolor: view === "transformers" ? "primary.main" : "transparent",
                      color: view === "transformers" ? "primary.contrastText" : "text.primary",
                      "&:hover": { bgcolor: view === "transformers" ? "primary.dark" : "action.hover" },
                    }}
                  >
                    Transformers
                  </ToggleButton>
                  <ToggleButton
                    value="inspections"
                    sx={{
                      bgcolor: view === "inspections" ? "primary.main" : "transparent",
                      color: view === "inspections" ? "primary.contrastText" : "text.primary",
                      "&:hover": { bgcolor: view === "inspections" ? "primary.dark" : "action.hover" },
                    }}
                  >
                    Inspections
                  </ToggleButton>
                </ToggleButtonGroup>
              </Paper>
            </Stack>

            {/* Filters row */}
            <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by Transformer / Inspection No"
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
                onChange={(e) => setStatus(e.target.value as any)}
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
                    <TableCell sortDirection={orderBy === "transformerNo" ? order : false}>
                      <TableSortLabel
                        active={orderBy === "transformerNo"}
                        direction={orderBy === "transformerNo" ? order : "asc"}
                        onClick={() => {
                          setOrder((o) => (o === "asc" ? "desc" : "asc"));
                          setOrderBy("transformerNo");
                        }}
                      >
                        Transformer No.
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Inspection No.</TableCell>
                    <TableCell>Inspected Date</TableCell>
                    <TableCell>Maintenance Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{row.transformerNo}</Typography>
                      </TableCell>
                      <TableCell>{row.inspectionNo}</TableCell>
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

      {/* ---------- New Inspection Dialog ---------- */}
      <Dialog
        open={addOpen}
        onClose={handleCloseAdd}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography fontWeight={700} fontSize="1.25rem">New Inspection</Typography>
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
            disabled={!canConfirm}
            sx={{
              mr: 1,
              borderRadius: 999,
              px: 3,
              py: 1,
              fontWeight: 700,
              textTransform: "none",
              background: "linear-gradient(180deg, #4F46E5 0%, #2E26C3 100%)",
              color: "#fff",   // ✅ force white text
              boxShadow: "0 8px 18px rgba(79,70,229,0.35)",
              "&:hover": {
                background: "linear-gradient(180deg, #4338CA 0%, #2A21B8 100%)",
                boxShadow: "0 10px 22px rgba(79,70,229,0.45)",
              },
              "&.Mui-disabled": {
                background: "#A5B4FC",  // optional lighter bg when disabled
                color: "#fff",          // keep text white even when disabled
              },
            }}
          >
            Confirm
          </Button>

          <Button onClick={handleCloseAdd} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
