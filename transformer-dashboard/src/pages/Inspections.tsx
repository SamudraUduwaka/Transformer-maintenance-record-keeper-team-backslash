import * as React from "react";
import {
  Box, Button, Chip, IconButton, InputAdornment, MenuItem, Paper, Select, Stack, TextField,
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination,
  TableRow, TableSortLabel, ToggleButton, ToggleButtonGroup
} from "@mui/material";
import { Add as AddIcon, MoreVert as MoreVertIcon, Search as SearchIcon, Tune as TuneIcon } from "@mui/icons-material";

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

type Props = {
  view?: "transformers" | "inspections";
  onChangeView?: (v: "transformers" | "inspections") => void;
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
      maintenanceDate: i % 3 === 0 ? "-" : new Date(2025, 6, ((i + 3) % 28) + 1, 19, 12).toLocaleString(),
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

const statusChip = (s: InspectionStatus) => {
  const map: Record<InspectionStatus, { color: "success" | "warning" | "info"; label: string }> = {
    "Completed": { color: "success", label: "Completed" },
    "Pending": { color: "warning", label: "Pending" },
    "In Progress": { color: "info", label: "In Progress" },
  };
  const i = map[s];
  return <Chip size="small" variant="outlined" color={i.color} label={i.label} />;
};

export default function Inspection({ view = "inspections", onChangeView }: Props) {
  const [rows] = React.useState<InspectionRow[]>(makeInspections());

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<InspectionStatus | "All">("All");

  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] = React.useState<keyof InspectionRow>("transformerNo");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const m1 = !q || r.transformerNo.toLowerCase().includes(q) || r.inspectionNo.toLowerCase().includes(q);
      const m2 = status === "All" || r.status === status;
      return m1 && m2;
    });
  }, [rows, search, status]);

  const sorted = React.useMemo(() => stableSort(filtered, getComparator(order, orderBy)), [filtered, order, orderBy]);
  const paged = React.useMemo(() => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [sorted, page, rowsPerPage]);

  const resetFilters = () => { setSearch(""); setStatus("All"); };

  return (
    <Stack spacing={2}>
      {/* Section header card */}
      <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 700, borderRadius: 2, px: 1.2, py: 0.4, boxShadow: "0 6px 16px rgba(79,70,229,0.25)" }}>
              {filtered.length}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>All Inspections</Typography>
          </Stack>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => alert("Hook this to your Add Inspection flow")}
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
            Add Inspection
          </Button>

          <Box sx={{ flexGrow: 1 }} />
          <Paper elevation={3} sx={{ p: 0.5, borderRadius: 999 }}>
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(_, v) => v && onChangeView?.(v)}
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

        {/* Filters row */}
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <TextField
            fullWidth size="small" placeholder="Search by Transformer / Inspection No" value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
          />
          <Select size="small" value={status} onChange={(e) => setStatus(e.target.value as any)} sx={{ minWidth: 180 }}>
            <MenuItem value="All">All Statuses</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </Select>
          <Chip icon={<TuneIcon />} label="Reset Filters" onClick={resetFilters} variant="outlined" />
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
                    onClick={() => { setOrder((o) => (o === "asc" ? "desc" : "asc")); setOrderBy("transformerNo"); }}
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
                  <TableCell><Typography fontWeight={600}>{row.transformerNo}</Typography></TableCell>
                  <TableCell>{row.inspectionNo}</TableCell>
                  <TableCell>{row.inspectedDate}</TableCell>
                  <TableCell>{row.maintenanceDate ?? "-"}</TableCell>
                  <TableCell>{statusChip(row.status)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button variant="contained" size="small">View</Button>
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
          onPageChange={(_e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Paper>
    </Stack>
  );
}
