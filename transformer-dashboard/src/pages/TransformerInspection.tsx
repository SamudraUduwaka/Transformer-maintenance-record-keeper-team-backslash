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
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";

/* ---------------- Types ---------------- */
type TransformerType = "Bulk" | "Distribution";
type InspectionStatus = "In Progress" | "Pending" | "Completed";

type Transformer = {
  id: number;
  transformerNo: string;
  poleNo: string;
  region: string;
  type: TransformerType;
  capacityKVA: number;
  feeders: number;
  location: string;
  lastInspectedAt?: string;
  favorite?: boolean;
};

type InspectionRow = {
  id: number;
  inspectionNo: string;
  inspectedDate: string;
  maintenanceDate?: string;
  status: InspectionStatus;
  favorite?: boolean;
};

/* ---------------- Theme (match Dashboard) ---------------- */
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4F46E5" },
    secondary: { main: "#7C3AED" },
    background: { default: "#F7F7FB" },
    text: { primary: "#101828", secondary: "#667085" },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { borderRadius: 16 } } },
    MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 14, fontWeight: 600 } } },
  },
});

const drawerWidth = 260;

/* ---------------- Demo data ---------------- */
const makeDemoTransformer = (no: string): Transformer => ({
  id: 1,
  transformerNo: no,
  poleNo: "EN-122-A",
  region: "Nugegoda",
  type: "Bulk",
  capacityKVA: 102.97,
  feeders: 2,
  location: `"Keels", Embuldeniya`,
  lastInspectedAt: "Mon(21), May, 2023 12:55pm",
  favorite: true,
});

const makeDemoInspections = (): InspectionRow[] => {
  const sts: InspectionStatus[] = ["In Progress", "Pending", "Completed"];
  const arr: InspectionRow[] = [];
  for (let i = 0; i < 22; i++) {
    arr.push({
      id: i + 1,
      inspectionNo: (123589 + i).toString().padStart(8, "0"),
      inspectedDate: "Mon(21), May, 2023 12:55pm",
      maintenanceDate: i % 3 === 0 ? "-" : "Mon(21), May, 2023 12:55pm",
      status: sts[i % sts.length],
      favorite: i % 7 === 0,
    });
  }
  return arr;
};

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
      <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1 }}>{top}</Typography>
      <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.2 }}>{bottom}</Typography>
    </Box>
  );
}

function BaselineGroup({
  onView,
  onDelete,
}: {
  onView: () => void;
  onDelete: () => void;
}) {
  return (
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
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#344054" }}>Baseline Image</Typography>
      </Box>

      <IconButton
        onClick={onView}
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
        onClick={onDelete}
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
  );
}

/* ---------------- Page ---------------- */
export default function TransformerInspection() {
  const { transformerNo = "AZ-8801" } = useParams();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = React.useState(false);

  const transformer = React.useMemo(() => makeDemoTransformer(transformerNo), [transformerNo]);
  const allRows = React.useMemo(makeDemoInspections, []);

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const shown = React.useMemo(
    () => allRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [allRows, page, rowsPerPage]
  );

  /* Drawer (same as Dashboard) */
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
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* AppBar (same as Dashboard) */}
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
          <Stack spacing={2}>
            {/* ===== Header ===== */}
            <Paper elevation={3} sx={{ p: 2.25, borderRadius: 1 }}>
              <Stack direction="row" alignItems="stretch" sx={{ width: "100%" }}>
                {/* Left block */}
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  {/* Row 1: circle + title + region + kebab (kebab AFTER region) */}
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
                      {transformer.transformerNo}
                    </Typography>

                    {/* Region */}
                    <Typography sx={{ ml: 3, fontSize: 14, color: "text.secondary" }}>
                      {transformer.region}
                    </Typography>

                    {/* Kebab AFTER region */}
                    <IconButton size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  {/* Row 2: location with red pin */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
                  >
                    <PlaceIcon sx={{ fontSize: 16, color: "#EF4444" }} />
                    {transformer.location}
                  </Typography>

                  {/* Row 3: stat pills */}
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                    <StatPill top={transformer.poleNo} bottom="Pole No" />
                    <StatPill top={transformer.capacityKVA} bottom="Capacity" />
                    <StatPill top={transformer.type} bottom="Type" />
                    <StatPill top={transformer.feeders} bottom="No. of Feeders" />
                  </Stack>
                </Box>

                {/* Right block: stretch to full height & distribute evenly */}
                <Stack
                  direction="column"
                  alignItems="flex-end"
                  justifyContent="space-between"
                  sx={{
                    alignSelf: "stretch",
                    minWidth: 330,
                    py: 0.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: "nowrap", lineHeight: 1.25 }}
                  >
                    Last Inspected Date: {transformer.lastInspectedAt ?? "-"}
                  </Typography>

                  <BaselineGroup
                    onView={() => alert("Preview baseline")}
                    onDelete={() => alert("Delete baseline")}
                  />
                </Stack>
              </Stack>
            </Paper>

            {/* ===== Table ===== */}
            <Paper elevation={3} sx={{ p: 2.5, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
                {/* Title pinned left */}
                <Typography variant="h6" fontWeight={800} sx={{ pl: 2 }}>
                Transformer Inspections
                </Typography>

                {/* Spacer pushes the button to the far right */}
                <Box sx={{ flexGrow: 1 }} />

                {/* Button pinned right */}
                <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => alert("Add Inspection")}
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
                                onClick={() => navigate(`/inspections/${transformer.transformerNo}/${row.inspectionNo}`)}
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
                count={allRows.length}
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
      </Box>
    </ThemeProvider>
  );
}
