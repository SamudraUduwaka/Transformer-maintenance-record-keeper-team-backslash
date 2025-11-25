import * as React from "react";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  NavigateNext as NavigateNextIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Image as ImageIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { Dayjs } from "dayjs";
import { format } from "date-fns";

/* Helpers */
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Work content item interface
interface WorkContentItem {
  itemNo: number;
  doCheck: boolean;
  doClean: boolean;
  doTighten: boolean;
  doReplace: boolean;
  other: string;
  afterInspectionStatus: "OK" | "NOT_OK" | "";
  afterInspectionNos: string;
}

// Materials list item
interface MaterialItem {
  description: string;
  code: string;
  used: boolean;
}

// Predefined materials list
const MATERIALS_LIST: MaterialItem[] = [
  { description: "16mm² Copper wire", code: "B112", used: false },
  { description: "25mm² Copper wire", code: "B113", used: false },
  { description: "35mm² Copper wire", code: "B114", used: false },
  { description: "Insulation tape", code: "C201", used: false },
  { description: "Cable lugs 16mm", code: "D301", used: false },
  { description: "Cable lugs 25mm", code: "D302", used: false },
  { description: "Fuse 32A", code: "F101", used: false },
  { description: "Fuse 63A", code: "F102", used: false },
  { description: "Terminal block", code: "T501", used: false },
  { description: "Earth rod", code: "E401", used: false },
];

export default function DigitalMaintenanceForm() {
  const navigate = useNavigate();
  const { transformerNo, inspectionNo } = useParams<{
    transformerNo: string;
    inspectionNo: string;
  }>();

  const [tabValue, setTabValue] = React.useState(0);
  const [formMode, setFormMode] = React.useState<"digital" | "scanned">(
    "digital"
  );

  // Inspection details state (for header)
  const [inspectionDetails, setInspectionDetails] = React.useState({
    poleNo: "",
    branch: "",
    inspectedBy: "",
    inspectedAt: "",
    createdAt: "",
    lastUpdated: "",
  });

  // Global header data
  const [poleNumber, setPoleNumber] = React.useState("EN-122-A");
  const [branch, setBranch] = React.useState("Nugegoda");
  const [inspectedBy, setInspectedBy] = React.useState("A-110");

  // Screen 1: Thermal Image Inspection Form
  const [locationDetails, setLocationDetails] = React.useState("");
  const [inspectionDate, setInspectionDate] = React.useState<Dayjs | null>(
    dayjs()
  );
  const [inspectionTime, setInspectionTime] = React.useState<Dayjs | null>(
    dayjs()
  );
  const [baselineImagingRightNo, setBaselineImagingRightNo] =
    React.useState("");
  const [baselineImagingLeftNo, setBaselineImagingLeftNo] = React.useState("");
  const [lastMonthKva, setLastMonthKva] = React.useState("");
  const [lastMonthDate, setLastMonthDate] = React.useState<Dayjs | null>(null);
  const [lastMonthTime, setLastMonthTime] = React.useState<Dayjs | null>(null);
  const [currentMonthKva, setCurrentMonthKva] = React.useState("");
  const [baselineCondition, setBaselineCondition] = React.useState("Sunny");
  const [transformerType, setTransformerType] = React.useState("Bulk");
  const [meterSerial, setMeterSerial] = React.useState("");
  const [meterCtRatio, setMeterCtRatio] = React.useState("");
  const [meterMake, setMeterMake] = React.useState("");
  const [afterThermalDate, setAfterThermalDate] = React.useState<Dayjs | null>(
    null
  );
  const [afterThermalTime, setAfterThermalTime] = React.useState<Dayjs | null>(
    null
  );

  // Work content (default 5 items)
  const [workContent, setWorkContent] = React.useState<WorkContentItem[]>(
    Array.from({ length: 5 }, (_, i) => ({
      itemNo: i + 1,
      doCheck: false,
      doClean: false,
      doTighten: false,
      doReplace: false,
      other: "",
      afterInspectionStatus: "",
      afterInspectionNos: "",
    }))
  );

  // First inspection readings
  const [firstInspectionVoltageR, setFirstInspectionVoltageR] =
    React.useState("");
  const [firstInspectionVoltageY, setFirstInspectionVoltageY] =
    React.useState("");
  const [firstInspectionVoltageB, setFirstInspectionVoltageB] =
    React.useState("");
  const [firstInspectionCurrentR, setFirstInspectionCurrentR] =
    React.useState("");
  const [firstInspectionCurrentY, setFirstInspectionCurrentY] =
    React.useState("");
  const [firstInspectionCurrentB, setFirstInspectionCurrentB] =
    React.useState("");

  // Second inspection readings
  const [secondInspectionVoltageR, setSecondInspectionVoltageR] =
    React.useState("");
  const [secondInspectionVoltageY, setSecondInspectionVoltageY] =
    React.useState("");
  const [secondInspectionVoltageB, setSecondInspectionVoltageB] =
    React.useState("");
  const [secondInspectionCurrentR, setSecondInspectionCurrentR] =
    React.useState("");
  const [secondInspectionCurrentY, setSecondInspectionCurrentY] =
    React.useState("");
  const [secondInspectionCurrentB, setSecondInspectionCurrentB] =
    React.useState("");

  // Screen 2: Maintenance Record
  const [startTime, setStartTime] = React.useState<Dayjs | null>(null);
  const [completionTime, setCompletionTime] = React.useState<Dayjs | null>(
    null
  );
  const [supervisedBy, setSupervisedBy] = React.useState("");
  const [tech1, setTech1] = React.useState("");
  const [tech2, setTech2] = React.useState("");
  const [tech3, setTech3] = React.useState("");
  const [helpers, setHelpers] = React.useState("");
  const [maintenanceInspectedBy, setMaintenanceInspectedBy] =
    React.useState("");
  const [maintenanceInspectedDate, setMaintenanceInspectedDate] =
    React.useState<Dayjs | null>(null);
  const [maintenanceRectifiedBy, setMaintenanceRectifiedBy] =
    React.useState("");
  const [maintenanceRectifiedDate, setMaintenanceRectifiedDate] =
    React.useState<Dayjs | null>(null);
  const [maintenanceReinspectedBy, setMaintenanceReinspectedBy] =
    React.useState("");
  const [maintenanceReinspectedDate, setMaintenanceReinspectedDate] =
    React.useState<Dayjs | null>(null);
  const [cssOfficer, setCssOfficer] = React.useState("");
  const [cssDate, setCssDate] = React.useState<Dayjs | null>(null);
  const [allSpotsCorrectedBy, setAllSpotsCorrectedBy] = React.useState("");
  const [allSpotsCorrectedDate, setAllSpotsCorrectedDate] =
    React.useState<Dayjs | null>(null);

  // Screen 3: Work + Data Sheet
  const [gangLeader, setGangLeader] = React.useState("");
  const [jobDate, setJobDate] = React.useState<Dayjs | null>(null);
  const [jobStartTime, setJobStartTime] = React.useState<Dayjs | null>(null);
  const [serialNo, setSerialNo] = React.useState("");
  const [kvaRating, setKvaRating] = React.useState("");
  const [tapPosition, setTapPosition] = React.useState("");
  const [ctRatio, setCtRatio] = React.useState("");
  const [earthResistance, setEarthResistance] = React.useState("");
  const [neutral, setNeutral] = React.useState("");
  const [surgeChecked, setSurgeChecked] = React.useState(false);
  const [bodyChecked, setBodyChecked] = React.useState(false);
  const [fdsFuseF1, setFdsFuseF1] = React.useState("");
  const [fdsFuseF2, setFdsFuseF2] = React.useState("");
  const [fdsFuseF3, setFdsFuseF3] = React.useState("");
  const [fdsFuseF4, setFdsFuseF4] = React.useState("");
  const [fdsFuseF5, setFdsFuseF5] = React.useState("");
  const [jobCompletedTime, setJobCompletedTime] = React.useState<Dayjs | null>(
    null
  );
  const [notes, setNotes] = React.useState("");
  const [materials, setMaterials] =
    React.useState<MaterialItem[]>(MATERIALS_LIST);

  const handleWorkContentChange = (
    index: number,
    field: keyof WorkContentItem,
    value: any
  ) => {
    setWorkContent((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleMaterialToggle = (index: number) => {
    setMaterials((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, used: !item.used } : item
      )
    );
  };

  const handleSave = () => {
    // TODO: Implement save logic to backend
    console.log("Saving form data...");
    alert("Form saved successfully!");
  };

  const handleNext = () => {
    if (tabValue < 2) {
      setTabValue(tabValue + 1);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? Unsaved changes will be lost.")) {
      navigate(-1);
    }
  };

  const handleConfirm = () => {
    // TODO: Final confirmation and save
    alert("Form confirmed and submitted!");
    navigate(-1);
  };

  // Fetch inspection details on component mount
  React.useEffect(() => {
    const API_BASE_URL = "http://localhost:8080/api";
    
    async function fetchInspectionDetails() {
      if (!transformerNo || !inspectionNo) return;
      try {
        const res1 = await fetch(
          `${API_BASE_URL}/transformers/${encodeURIComponent(transformerNo)}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!res1.ok) throw new Error("Failed to fetch transformer details");
        const transformerData = await res1.json();
        
        const res2 = await fetch(
          `${API_BASE_URL}/inspections/${encodeURIComponent(inspectionNo)}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!res2.ok) throw new Error("Failed to fetch inspection details");
        const inspectionData = await res2.json();
        
        setInspectionDetails({
          poleNo: transformerData.poleNo,
          branch: inspectionData.branch,
          inspectedBy: inspectionData.inspector,
          inspectedAt: inspectionData.inspectionTime
            ? format(new Date(inspectionData.inspectionTime), "yyyy-MM-dd HH:mm")
            : "",
          createdAt: inspectionData.createdAt
            ? format(new Date(inspectionData.createdAt), "yyyy-MM-dd HH:mm")
            : "",
          lastUpdated: inspectionData.updatedAt
            ? format(new Date(inspectionData.updatedAt), "yyyy-MM-dd HH:mm")
            : "",
        });

        // Update local state with fetched data
        setPoleNumber(transformerData.poleNo || "");
        setBranch(inspectionData.branch || "");
        setInspectedBy(inspectionData.inspector || "");
      } catch (e) {
        console.error("Error fetching inspection details:", e);
      }
    }
    
    fetchInspectionDetails();
  }, [transformerNo, inspectionNo]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ bgcolor: "#1F1C4F" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Digital Maintenance Form
          </Typography>
          <Button
            color="inherit"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{ mr: 1 }}
          >
            Save
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, mt: 8, p: 3, bgcolor: "#f5f5f5" }}>
        {/* Global Header Card */}
        <Card sx={{ mb: 3, p: 2.25, borderRadius: 1, position: "relative" }} elevation={3}>
          <Stack
            direction="row"
            alignItems="stretch"
            sx={{ width: "100%" }}
          >
            {/* Left */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
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
                  {inspectionNo}
                </Typography>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Stack>

              {/* Updated section with both inspection date and last updated */}
              <Stack direction="row" spacing={3} sx={{ mt: 0.5 }}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      textAlign: "left",
                      fontWeight: 600,
                    }}
                  >
                    Inspected At
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.primary"
                    sx={{ display: "block", textAlign: "left" }}
                  >
                    {inspectionDetails.inspectedAt || "N/A"}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      textAlign: "left",
                      fontWeight: 600,
                    }}
                  >
                    Last Updated
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.primary"
                    sx={{ display: "block", textAlign: "left" }}
                  >
                    {inspectionDetails.lastUpdated
                      ? inspectionDetails.lastUpdated
                      : inspectionDetails.createdAt || "N/A"}
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: 1.25 }}
                flexWrap="wrap"
                useFlexGap
              >
                <StatPill top={transformerNo || "N/A"} bottom="Transformer No" />
                <StatPill top={inspectionDetails.poleNo || poleNumber} bottom="Pole No" />
                <StatPill top={inspectionDetails.branch || branch} bottom="Branch" />
                <StatPill
                  top={inspectionDetails.inspectedBy || inspectedBy}
                  bottom="Inspected By"
                />
              </Stack>
            </Box>

            <Stack
              direction="column"
              alignItems="flex-end"
              justifyContent="space-between"
              sx={{ alignSelf: "stretch", minWidth: 200, py: 0.5 }}
            >
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <FormControl size="small">
                  <Select
                    value={formMode}
                    onChange={(e) =>
                      setFormMode(e.target.value as "digital" | "scanned")
                    }
                    sx={{ minWidth: 150 }}
                  >
                    <MenuItem value="digital">Digital Form</MenuItem>
                    <MenuItem value="scanned">Scanned Form</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ImageIcon />}
                  sx={{ textTransform: "none" }}
                >
                  View Baseline
                </Button>
              </Box>
            </Stack>
          </Stack>
        </Card>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": { fontWeight: 600 },
            }}
          >
            <Tab label="Thermal Image Inspection" />
            <Tab label="Maintenance Record" />
            <Tab label="Work + Data Sheet" />
          </Tabs>
        </Paper>

        {/* Tab Panel 0: Thermal Image Inspection Form */}
        <TabPanel value={tabValue} index={0}>
          <Stack spacing={3}>
            {/* Basic Details */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Basic Details
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Branch"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Transformer No"
                      value={transformerNo}
                      disabled
                    />
                    <TextField
                      fullWidth
                      label="Pole No"
                      value={poleNumber}
                      onChange={(e) => setPoleNumber(e.target.value)}
                    />
                  </Stack>
                  <TextField
                    fullWidth
                    label="Location Details"
                    multiline
                    rows={2}
                    value={locationDetails}
                    onChange={(e) => setLocationDetails(e.target.value)}
                    placeholder="Enter address/landmark"
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Inspection Metadata */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Inspection Metadata
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <DatePicker
                      label="Inspection Date"
                      value={inspectionDate}
                      onChange={setInspectionDate}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                    <TimePicker
                      label="Inspection Time"
                      value={inspectionTime}
                      onChange={setInspectionTime}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                    <TextField
                      fullWidth
                      label="Inspected By"
                      value={inspectedBy}
                      onChange={(e) => setInspectedBy(e.target.value)}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Baseline Imaging */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Baseline Imaging
                </Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Baseline Imaging Right No"
                    value={baselineImagingRightNo}
                    onChange={(e) => setBaselineImagingRightNo(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Baseline Imaging Left No"
                    value={baselineImagingLeftNo}
                    onChange={(e) => setBaselineImagingLeftNo(e.target.value)}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Load / kVA Details */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Load / kVA Details
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Last Month kVA"
                      type="number"
                      value={lastMonthKva}
                      onChange={(e) => setLastMonthKva(e.target.value)}
                    />
                    <DatePicker
                      label="Last Month Date"
                      value={lastMonthDate}
                      onChange={setLastMonthDate}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                    <TimePicker
                      label="Last Month Time"
                      value={lastMonthTime}
                      onChange={setLastMonthTime}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Stack>
                  <TextField
                    fullWidth
                    label="Current Month kVA"
                    type="number"
                    value={currentMonthKva}
                    onChange={(e) => setCurrentMonthKva(e.target.value)}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Operating / Environment */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Operating / Environment
                </Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Baseline Condition</InputLabel>
                    <Select
                      value={baselineCondition}
                      onChange={(e) => setBaselineCondition(e.target.value)}
                      label="Baseline Condition"
                    >
                      <MenuItem value="Sunny">Sunny</MenuItem>
                      <MenuItem value="Cloudy">Cloudy</MenuItem>
                      <MenuItem value="Rainy">Rainy</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Transformer Type</InputLabel>
                    <Select
                      value={transformerType}
                      onChange={(e) => setTransformerType(e.target.value)}
                      label="Transformer Type"
                    >
                      <MenuItem value="Bulk">Bulk</MenuItem>
                      <MenuItem value="Distribution">Distribution</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>

            {/* Meter Details */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Meter Details
                </Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Meter Serial"
                    value={meterSerial}
                    onChange={(e) => setMeterSerial(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Meter CT Ratio"
                    value={meterCtRatio}
                    onChange={(e) => setMeterCtRatio(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Meter Make"
                    value={meterMake}
                    onChange={(e) => setMeterMake(e.target.value)}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Work Content Section */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Work Content
                </Typography>
                <Typography variant="caption" sx={{ mb: 2, display: "block" }}>
                  Legend: C = Check, O = Clean, T = Tighten, R = Replace
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>No.</TableCell>
                        <TableCell align="center">C</TableCell>
                        <TableCell align="center">O</TableCell>
                        <TableCell align="center">T</TableCell>
                        <TableCell align="center">R</TableCell>
                        <TableCell>Other</TableCell>
                        <TableCell>After Inspection Status</TableCell>
                        <TableCell>After Inspection Nos</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {workContent.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.itemNo}</TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={item.doCheck}
                              onChange={(e) =>
                                handleWorkContentChange(
                                  index,
                                  "doCheck",
                                  e.target.checked
                                )
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={item.doClean}
                              onChange={(e) =>
                                handleWorkContentChange(
                                  index,
                                  "doClean",
                                  e.target.checked
                                )
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={item.doTighten}
                              onChange={(e) =>
                                handleWorkContentChange(
                                  index,
                                  "doTighten",
                                  e.target.checked
                                )
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={item.doReplace}
                              onChange={(e) =>
                                handleWorkContentChange(
                                  index,
                                  "doReplace",
                                  e.target.checked
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={item.other}
                              onChange={(e) =>
                                handleWorkContentChange(
                                  index,
                                  "other",
                                  e.target.value
                                )
                              }
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <RadioGroup
                              row
                              value={item.afterInspectionStatus}
                              onChange={(e) =>
                                handleWorkContentChange(
                                  index,
                                  "afterInspectionStatus",
                                  e.target.value
                                )
                              }
                            >
                              <FormControlLabel
                                value="OK"
                                control={<Radio size="small" />}
                                label="OK"
                              />
                              <FormControlLabel
                                value="NOT_OK"
                                control={<Radio size="small" />}
                                label="NOT OK"
                              />
                            </RadioGroup>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={item.afterInspectionNos}
                              onChange={(e) =>
                                handleWorkContentChange(
                                  index,
                                  "afterInspectionNos",
                                  e.target.value
                                )
                              }
                              fullWidth
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* After Thermal Info */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  After Thermal Info
                </Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <DatePicker
                    label="After Thermal Date"
                    value={afterThermalDate}
                    onChange={setAfterThermalDate}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                  <TimePicker
                    label="After Thermal Time"
                    value={afterThermalTime}
                    onChange={setAfterThermalTime}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* First Inspection - Voltage & Current */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  First Inspection - Voltage & Current Readings
                </Typography>
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Voltage (Per Phase)
                  </Typography>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="R Phase"
                      type="number"
                      value={firstInspectionVoltageR}
                      onChange={(e) =>
                        setFirstInspectionVoltageR(e.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      label="Y Phase"
                      type="number"
                      value={firstInspectionVoltageY}
                      onChange={(e) =>
                        setFirstInspectionVoltageY(e.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      label="B Phase"
                      type="number"
                      value={firstInspectionVoltageB}
                      onChange={(e) =>
                        setFirstInspectionVoltageB(e.target.value)
                      }
                    />
                  </Stack>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2 }}>
                    Current (Per Phase)
                  </Typography>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="R Phase"
                      type="number"
                      value={firstInspectionCurrentR}
                      onChange={(e) =>
                        setFirstInspectionCurrentR(e.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      label="Y Phase"
                      type="number"
                      value={firstInspectionCurrentY}
                      onChange={(e) =>
                        setFirstInspectionCurrentY(e.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      label="B Phase"
                      type="number"
                      value={firstInspectionCurrentB}
                      onChange={(e) =>
                        setFirstInspectionCurrentB(e.target.value)
                      }
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Second Inspection - Voltage & Current */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Second Inspection - Voltage & Current Readings
                </Typography>
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Voltage (Per Phase)
                  </Typography>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="R Phase"
                      type="number"
                      value={secondInspectionVoltageR}
                      onChange={(e) =>
                        setSecondInspectionVoltageR(e.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      label="Y Phase"
                      type="number"
                      value={secondInspectionVoltageY}
                      onChange={(e) =>
                        setSecondInspectionVoltageY(e.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      label="B Phase"
                      type="number"
                      value={secondInspectionVoltageB}
                      onChange={(e) =>
                        setSecondInspectionVoltageB(e.target.value)
                      }
                    />
                  </Stack>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2 }}>
                    Current (Per Phase)
                  </Typography>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="R Phase"
                      type="number"
                      value={secondInspectionCurrentR}
                      onChange={(e) =>
                        setSecondInspectionCurrentR(e.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      label="Y Phase"
                      type="number"
                      value={secondInspectionCurrentY}
                      onChange={(e) =>
                        setSecondInspectionCurrentY(e.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      label="B Phase"
                      type="number"
                      value={secondInspectionCurrentB}
                      onChange={(e) =>
                        setSecondInspectionCurrentB(e.target.value)
                      }
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Actions */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSave}
              >
                Save
              </Button>
              <Button
                variant="contained"
                endIcon={<NavigateNextIcon />}
                onClick={handleNext}
              >
                Next
              </Button>
            </Stack>
          </Stack>
        </TabPanel>

        {/* Tab Panel 1: Maintenance Record */}
        <TabPanel value={tabValue} index={1}>
          <Stack spacing={3}>
            {/* Job Timing */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Job Timing
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TimePicker
                      label="Start Time"
                      value={startTime}
                      onChange={setStartTime}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                    <TimePicker
                      label="Completion Time"
                      value={completionTime}
                      onChange={setCompletionTime}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                    <TextField
                      fullWidth
                      label="Supervised By"
                      value={supervisedBy}
                      onChange={(e) => setSupervisedBy(e.target.value)}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Gang Composition */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Gang Composition
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Tech 1"
                      value={tech1}
                      onChange={(e) => setTech1(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Tech 2"
                      value={tech2}
                      onChange={(e) => setTech2(e.target.value)}
                    />
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Tech 3"
                      value={tech3}
                      onChange={(e) => setTech3(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Helpers"
                      value={helpers}
                      onChange={(e) => setHelpers(e.target.value)}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Inspection / Rectification Chain */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Inspection / Rectification Chain
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Inspected By"
                      value={maintenanceInspectedBy}
                      onChange={(e) =>
                        setMaintenanceInspectedBy(e.target.value)
                      }
                    />
                    <DatePicker
                      label="Inspected Date"
                      value={maintenanceInspectedDate}
                      onChange={setMaintenanceInspectedDate}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Rectified By"
                      value={maintenanceRectifiedBy}
                      onChange={(e) =>
                        setMaintenanceRectifiedBy(e.target.value)
                      }
                    />
                    <DatePicker
                      label="Rectified Date"
                      value={maintenanceRectifiedDate}
                      onChange={setMaintenanceRectifiedDate}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Re-inspected By"
                      value={maintenanceReinspectedBy}
                      onChange={(e) =>
                        setMaintenanceReinspectedBy(e.target.value)
                      }
                    />
                    <DatePicker
                      label="Re-inspected Date"
                      value={maintenanceReinspectedDate}
                      onChange={setMaintenanceReinspectedDate}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* CSS / Closure */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  CSS / Closure
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="CSS Officer"
                      value={cssOfficer}
                      onChange={(e) => setCssOfficer(e.target.value)}
                    />
                    <DatePicker
                      label="CSS Date"
                      value={cssDate}
                      onChange={setCssDate}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="All Spots Corrected By (CSS)"
                      value={allSpotsCorrectedBy}
                      onChange={(e) => setAllSpotsCorrectedBy(e.target.value)}
                    />
                    <DatePicker
                      label="All Spots Corrected Date"
                      value={allSpotsCorrectedDate}
                      onChange={setAllSpotsCorrectedDate}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Actions */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                endIcon={<NavigateNextIcon />}
                onClick={handleNext}
              >
                Next
              </Button>
            </Stack>
          </Stack>
        </TabPanel>

        {/* Tab Panel 2: Work + Data Sheet */}
        <TabPanel value={tabValue} index={2}>
          <Stack spacing={3}>
            {/* Job / Transformer Data */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Job / Transformer Data
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Gang Leader"
                      value={gangLeader}
                      onChange={(e) => setGangLeader(e.target.value)}
                    />
                    <DatePicker
                      label="Job Date"
                      value={jobDate}
                      onChange={setJobDate}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                    <TimePicker
                      label="Job Start Time"
                      value={jobStartTime}
                      onChange={setJobStartTime}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Serial No (Transformer)"
                      value={serialNo}
                      onChange={(e) => setSerialNo(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="kVA Rating"
                      value={kvaRating}
                      onChange={(e) => setKvaRating(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Tap Position"
                      value={tapPosition}
                      onChange={(e) => setTapPosition(e.target.value)}
                    />
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="CT Ratio"
                      value={ctRatio}
                      onChange={(e) => setCtRatio(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Earth Resistance"
                      value={earthResistance}
                      onChange={(e) => setEarthResistance(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Neutral"
                      value={neutral}
                      onChange={(e) => setNeutral(e.target.value)}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Surge/Body Selection */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Surge / Body Selection
                </Typography>
                <Stack direction="row" spacing={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={surgeChecked}
                        onChange={(e) => setSurgeChecked(e.target.checked)}
                      />
                    }
                    label="Surge"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={bodyChecked}
                        onChange={(e) => setBodyChecked(e.target.checked)}
                      />
                    }
                    label="Body"
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* FDS Fuse Ratings */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  FDS Fuse Ratings
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="F1"
                      value={fdsFuseF1}
                      onChange={(e) => setFdsFuseF1(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="F2"
                      value={fdsFuseF2}
                      onChange={(e) => setFdsFuseF2(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="F3"
                      value={fdsFuseF3}
                      onChange={(e) => setFdsFuseF3(e.target.value)}
                    />
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="F4"
                      value={fdsFuseF4}
                      onChange={(e) => setFdsFuseF4(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="F5"
                      value={fdsFuseF5}
                      onChange={(e) => setFdsFuseF5(e.target.value)}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Job Completion */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Job Completion
                </Typography>
                <TimePicker
                  label="Job Completed Time"
                  value={jobCompletedTime}
                  onChange={setJobCompletedTime}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Notes
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter diagnostic text, recommendations, etc."
                />
              </CardContent>
            </Card>

            {/* Materials / Parts List */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Materials / Parts List
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell>Code</TableCell>
                        <TableCell align="center">Used</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {materials.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.code}</TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={item.used}
                              onChange={() => handleMaterialToggle(index)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Actions */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircleIcon />}
                onClick={handleConfirm}
                color="success"
              >
                Confirm
              </Button>
            </Stack>
          </Stack>
        </TabPanel>
      </Box>
    </Box>
  );
}
