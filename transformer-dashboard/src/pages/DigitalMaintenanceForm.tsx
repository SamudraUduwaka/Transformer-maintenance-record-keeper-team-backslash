import * as React from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
  Alert,
  Snackbar,
  Chip,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  NavigateNext as NavigateNextIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  List as ListIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { Dayjs } from "dayjs";
import { format } from "date-fns";
import {
  inspectionService,
  type MaintenanceFormData,
} from "../services/inspectionService";
import PowerLensBranding from "../components/PowerLensBranding";
import ThermalImageAnalysis from "../components/ThermalImageAnalysis";
import { useAuth } from "../context/AuthContext";
import ConfirmationDialog from "../models/ConfirmationDialog";

/* Helpers */
function StatPill({ top, bottom }: { top: string | number; bottom: string }) {
  return (
    <Box
      sx={{
        px: { xs: 1, sm: 1.5 },
        py: { xs: 0.75, sm: 1 },
        borderRadius: 3,
        bgcolor: "#EEF0F6",
        minWidth: { xs: 70, sm: 80, md: 90 },
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

type ImageStatus = "baseline" | "maintenance" | "no image";

/* Helper function to determine image status */
const determineImageStatus = (
  inspection: {
    image?: { type?: string };
  } | null
): ImageStatus => {
  if (!inspection || !inspection.image) {
    return "no image";
  }

  if (inspection.image.type === "baseline") {
    return "baseline";
  }

  return "maintenance";
};

/* Helper function to render status chip */
const renderStatusChip = (
  status: ImageStatus,
  size: "small" | "medium" = "medium"
) => {
  const statusConfig = {
    baseline: {
      label: "Baseline",
      color: "success" as const,
      borderColor: "#059669",
    },
    maintenance: {
      label: "Maintenance",
      color: "error" as const,
      borderColor: "#DC2626",
    },
    "no image": {
      label: "Pending",
      color: "default" as const,
      borderColor: "#e8a60dff",
    },
  };

  const config = statusConfig[status];
  const chipHeight = size === "small" ? 22 : 28;
  const fontSize = size === "small" ? 12 : 14;

  return (
    <Chip
      size={size}
      label={config.label}
      color={config.color}
      variant="outlined"
      sx={{
        height: chipHeight,
        fontSize: fontSize,
        fontWeight: 600,
        borderColor: config.borderColor,
        color: config.borderColor,
        bgcolor:
          size === "small"
            ? status === "baseline"
              ? "#F0FDF4"
              : status === "maintenance"
              ? "#FEF2F2"
              : "#F9FAFB"
            : "transparent",
      }}
    />
  );
};

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

const drawerWidth = 200;

export default function DigitalMaintenanceForm() {
  const navigate = useNavigate();
  const { transformerNo = "", inspectionNo = "" } = useParams<{
    transformerNo: string;
    inspectionNo: string;
  }>();
  const { user, isAuthenticated, logout } = useAuth();
  const inspectionId = Number(inspectionNo);

  const [mobileOpen, setMobileOpen] = React.useState(false);

  const [tabValue, setTabValue] = React.useState(0);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "info" });

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    confirmColor?: "primary" | "error" | "warning" | "success";
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Inspection details state (for header)
  const [inspectionDetails, setInspectionDetails] = React.useState({
    poleNo: "",
    branch: "",
    inspectedBy: "",
    inspectedAt: "",
    createdAt: "",
    lastUpdated: "",
  });

  // Inspection state for thermal analysis
  type InspectionImage = {
    imageUrl: string;
    type: string;
    weatherCondition: string;
  };

  type Inspection = {
    image?: InspectionImage;
    branch?: string;
    inspector?: string;
    transformerNo?: string;
    transformer?: { transformerNo?: string };
  };

  const [inspection, setInspection] = React.useState<Inspection | null>(null);

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
    value: boolean | string
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

  const buildFormData = (): MaintenanceFormData | null => {
    if (!inspectionNo) return null;

    return {
      inspectionId: parseInt(inspectionNo, 10),
      transformerNo: transformerNo || "",
      thermalInspection: {
        branch,
        transformerNo: transformerNo || "",
        poleNumber,
        locationDetails,
        inspectionDate: inspectionDate ? inspectionDate.toISOString() : null,
        inspectionTime: inspectionTime ? inspectionTime.toISOString() : null,
        inspectedBy,
        baselineImagingRightNo,
        baselineImagingLeftNo,
        lastMonthKva,
        lastMonthDate: lastMonthDate ? lastMonthDate.toISOString() : null,
        lastMonthTime: lastMonthTime ? lastMonthTime.toISOString() : null,
        currentMonthKva,
        baselineCondition,
        transformerType,
        meterSerial,
        meterCtRatio,
        meterMake,
        afterThermalDate: afterThermalDate
          ? afterThermalDate.toISOString()
          : null,
        afterThermalTime: afterThermalTime
          ? afterThermalTime.toISOString()
          : null,
        workContent,
        firstInspectionVoltageR,
        firstInspectionVoltageY,
        firstInspectionVoltageB,
        firstInspectionCurrentR,
        firstInspectionCurrentY,
        firstInspectionCurrentB,
        secondInspectionVoltageR,
        secondInspectionVoltageY,
        secondInspectionVoltageB,
        secondInspectionCurrentR,
        secondInspectionCurrentY,
        secondInspectionCurrentB,
      },
      maintenanceRecord: {
        startTime: startTime ? startTime.toISOString() : null,
        completionTime: completionTime ? completionTime.toISOString() : null,
        supervisedBy,
        tech1,
        tech2,
        tech3,
        helpers,
        maintenanceInspectedBy,
        maintenanceInspectedDate: maintenanceInspectedDate
          ? maintenanceInspectedDate.toISOString()
          : null,
        maintenanceRectifiedBy,
        maintenanceRectifiedDate: maintenanceRectifiedDate
          ? maintenanceRectifiedDate.toISOString()
          : null,
        maintenanceReinspectedBy,
        maintenanceReinspectedDate: maintenanceReinspectedDate
          ? maintenanceReinspectedDate.toISOString()
          : null,
        cssOfficer,
        cssDate: cssDate ? cssDate.toISOString() : null,
        allSpotsCorrectedBy,
        allSpotsCorrectedDate: allSpotsCorrectedDate
          ? allSpotsCorrectedDate.toISOString()
          : null,
      },
      workDataSheet: {
        gangLeader,
        jobDate: jobDate ? jobDate.toISOString() : null,
        jobStartTime: jobStartTime ? jobStartTime.toISOString() : null,
        serialNo,
        kvaRating,
        tapPosition,
        ctRatio,
        earthResistance,
        neutral,
        surgeChecked,
        bodyChecked,
        fdsFuseF1,
        fdsFuseF2,
        fdsFuseF3,
        fdsFuseF4,
        fdsFuseF5,
        jobCompletedTime: jobCompletedTime
          ? jobCompletedTime.toISOString()
          : null,
        notes,
        materials,
      },
    };
  };

  const handleSave = async () => {
    if (!inspectionNo) {
      setSnackbar({
        open: true,
        message: "Inspection ID is missing",
        severity: "error",
      });
      return;
    }

    const formData = buildFormData();
    if (!formData) return;

    setSaving(true);
    try {
      await inspectionService.saveMaintenanceFormData(formData);

      // Refetch inspection data to update the "Date Updated" field
      const inspectionData = await inspectionService.getInspectionById(
        parseInt(inspectionNo, 10)
      );
      setInspectionDetails((prev) => ({
        ...prev,
        lastUpdated: inspectionData.updatedAt
          ? format(new Date(inspectionData.updatedAt), "yyyy-MM-dd HH:mm")
          : prev.lastUpdated,
      }));

      setSnackbar({
        open: true,
        message: "Form saved successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error saving form:", error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "Failed to save form",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (tabValue < 2) {
      setTabValue(tabValue + 1);
    }
  };

  const handleCancel = () => {
    setConfirmDialog({
      open: true,
      title: "Cancel Changes",
      message: "Are you sure you want to cancel? Unsaved changes will be lost.",
      confirmText: "Cancel",
      confirmColor: "error",
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        navigate(-1);
      },
    });
  };

  const handleConfirm = async () => {
    if (!inspectionNo) {
      setSnackbar({
        open: true,
        message: "Inspection ID is missing",
        severity: "error",
      });
      return;
    }

    setConfirmDialog({
      open: true,
      title: "Submit Form",
      message: "Are you sure you want to submit this form? This action will finalize the maintenance record.",
      confirmText: "Submit",
      confirmColor: "success",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        
        const formData = buildFormData();
        if (!formData) return;

        setSaving(true);
        try {
          await inspectionService.submitMaintenanceForm(
            parseInt(inspectionNo, 10),
            formData
          );
          setSnackbar({
            open: true,
            message: "Form submitted successfully!",
            severity: "success",
          });
          setTimeout(() => navigate(-1), 1500);
        } catch (error) {
          console.error("Error submitting form:", error);
          setSnackbar({
            open: true,
            message:
              error instanceof Error ? error.message : "Failed to submit form",
            severity: "error",
          });
        } finally {
          setSaving(false);
        }
      },
    });
  };

  // Fetch inspection details and maintenance form data on mount
  React.useEffect(() => {
    async function fetchData() {
      if (!transformerNo || !inspectionNo) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch transformer and inspection details
        const [transformerData, inspectionData] = await Promise.all([
          inspectionService.getTransformerByNo(transformerNo),
          inspectionService.getInspectionById(parseInt(inspectionNo, 10)),
        ]);

        setInspectionDetails({
          poleNo: transformerData.poleNo || "",
          branch: inspectionData.branch || "",
          inspectedBy: inspectionData.inspector || "",
          inspectedAt: inspectionData.inspectionTime
            ? format(
                new Date(inspectionData.inspectionTime),
                "yyyy-MM-dd HH:mm"
              )
            : "",
          createdAt: inspectionData.createdAt
            ? format(new Date(inspectionData.createdAt), "yyyy-MM-dd HH:mm")
            : "",
          lastUpdated: inspectionData.updatedAt
            ? format(new Date(inspectionData.updatedAt), "yyyy-MM-dd HH:mm")
            : "",
        });

        // Set inspection data for thermal analysis
        setInspection(inspectionData);

        // Update basic form fields
        setPoleNumber(transformerData.poleNo || "");
        setBranch(inspectionData.branch || "");
        setInspectedBy(inspectionData.inspector || "");

        // Try to load existing maintenance form data
        try {
          const maintenanceData =
            await inspectionService.getMaintenanceFormData(
              parseInt(inspectionNo, 10)
            );

          if (maintenanceData) {
            // Populate thermal inspection data
            const thermal = maintenanceData.thermalInspection;
            setLocationDetails(thermal.locationDetails || "");
            setInspectionDate(
              thermal.inspectionDate ? dayjs(thermal.inspectionDate) : dayjs()
            );
            setInspectionTime(
              thermal.inspectionTime ? dayjs(thermal.inspectionTime) : dayjs()
            );
            setBaselineImagingRightNo(thermal.baselineImagingRightNo || "");
            setBaselineImagingLeftNo(thermal.baselineImagingLeftNo || "");
            setLastMonthKva(thermal.lastMonthKva || "");
            setLastMonthDate(
              thermal.lastMonthDate ? dayjs(thermal.lastMonthDate) : null
            );
            setLastMonthTime(
              thermal.lastMonthTime ? dayjs(thermal.lastMonthTime) : null
            );
            setCurrentMonthKva(thermal.currentMonthKva || "");
            setBaselineCondition(thermal.baselineCondition || "Sunny");
            setTransformerType(thermal.transformerType || "Bulk");
            setMeterSerial(thermal.meterSerial || "");
            setMeterCtRatio(thermal.meterCtRatio || "");
            setMeterMake(thermal.meterMake || "");
            setAfterThermalDate(
              thermal.afterThermalDate ? dayjs(thermal.afterThermalDate) : null
            );
            setAfterThermalTime(
              thermal.afterThermalTime ? dayjs(thermal.afterThermalTime) : null
            );
            if (thermal.workContent && thermal.workContent.length > 0) {
              setWorkContent(thermal.workContent);
            }
            setFirstInspectionVoltageR(thermal.firstInspectionVoltageR || "");
            setFirstInspectionVoltageY(thermal.firstInspectionVoltageY || "");
            setFirstInspectionVoltageB(thermal.firstInspectionVoltageB || "");
            setFirstInspectionCurrentR(thermal.firstInspectionCurrentR || "");
            setFirstInspectionCurrentY(thermal.firstInspectionCurrentY || "");
            setFirstInspectionCurrentB(thermal.firstInspectionCurrentB || "");
            setSecondInspectionVoltageR(thermal.secondInspectionVoltageR || "");
            setSecondInspectionVoltageY(thermal.secondInspectionVoltageY || "");
            setSecondInspectionVoltageB(thermal.secondInspectionVoltageB || "");
            setSecondInspectionCurrentR(thermal.secondInspectionCurrentR || "");
            setSecondInspectionCurrentY(thermal.secondInspectionCurrentY || "");
            setSecondInspectionCurrentB(thermal.secondInspectionCurrentB || "");

            // Populate maintenance record data
            const maintenance = maintenanceData.maintenanceRecord;
            setStartTime(
              maintenance.startTime ? dayjs(maintenance.startTime) : null
            );
            setCompletionTime(
              maintenance.completionTime
                ? dayjs(maintenance.completionTime)
                : null
            );
            setSupervisedBy(maintenance.supervisedBy || "");
            setTech1(maintenance.tech1 || "");
            setTech2(maintenance.tech2 || "");
            setTech3(maintenance.tech3 || "");
            setHelpers(maintenance.helpers || "");
            setMaintenanceInspectedBy(maintenance.maintenanceInspectedBy || "");
            setMaintenanceInspectedDate(
              maintenance.maintenanceInspectedDate
                ? dayjs(maintenance.maintenanceInspectedDate)
                : null
            );
            setMaintenanceRectifiedBy(maintenance.maintenanceRectifiedBy || "");
            setMaintenanceRectifiedDate(
              maintenance.maintenanceRectifiedDate
                ? dayjs(maintenance.maintenanceRectifiedDate)
                : null
            );
            setMaintenanceReinspectedBy(
              maintenance.maintenanceReinspectedBy || ""
            );
            setMaintenanceReinspectedDate(
              maintenance.maintenanceReinspectedDate
                ? dayjs(maintenance.maintenanceReinspectedDate)
                : null
            );
            setCssOfficer(maintenance.cssOfficer || "");
            setCssDate(maintenance.cssDate ? dayjs(maintenance.cssDate) : null);
            setAllSpotsCorrectedBy(maintenance.allSpotsCorrectedBy || "");
            setAllSpotsCorrectedDate(
              maintenance.allSpotsCorrectedDate
                ? dayjs(maintenance.allSpotsCorrectedDate)
                : null
            );

            // Populate work data sheet
            const workData = maintenanceData.workDataSheet;
            setGangLeader(workData.gangLeader || "");
            setJobDate(workData.jobDate ? dayjs(workData.jobDate) : null);
            setJobStartTime(
              workData.jobStartTime ? dayjs(workData.jobStartTime) : null
            );
            setSerialNo(workData.serialNo || "");
            setKvaRating(workData.kvaRating || "");
            setTapPosition(workData.tapPosition || "");
            setCtRatio(workData.ctRatio || "");
            setEarthResistance(workData.earthResistance || "");
            setNeutral(workData.neutral || "");
            setSurgeChecked(workData.surgeChecked || false);
            setBodyChecked(workData.bodyChecked || false);
            setFdsFuseF1(workData.fdsFuseF1 || "");
            setFdsFuseF2(workData.fdsFuseF2 || "");
            setFdsFuseF3(workData.fdsFuseF3 || "");
            setFdsFuseF4(workData.fdsFuseF4 || "");
            setFdsFuseF5(workData.fdsFuseF5 || "");
            setJobCompletedTime(
              workData.jobCompletedTime
                ? dayjs(workData.jobCompletedTime)
                : null
            );
            setNotes(workData.notes || "");
            setMaterials(workData.materials || MATERIALS_LIST);

            setSnackbar({
              open: true,
              message: "Loaded existing maintenance data",
              severity: "info",
            });
          }
        } catch {
          // No existing maintenance data – that's fine.
          console.log("No existing maintenance data found, starting fresh");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setSnackbar({
          open: true,
          message: "Failed to load inspection details",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [transformerNo, inspectionNo]);

  /* Drawer */
  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PowerLensBranding />
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
          <ListItemButton onClick={() => navigate("/?view=inspections")}>
            <ListItemIcon>
              <SearchIcon />
            </ListItemIcon>
            <ListItemText primary="Inspections" />
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
    <>
      {/* Loading Overlay */}
      {loading && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(255,255,255,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: (t) => t.zIndex.modal + 1,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* AppBar (from previous UI, with Save button added) */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
          ml: { sm: `${drawerWidth}px` },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          borderRadius: 0,
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <IconButton onClick={() => navigate(-1)} sx={{ color: "inherit" }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Digital Maintenance Form
            </Typography>
          </Stack>
          <Box sx={{ flexGrow: 1 }} />
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{ ml: 1 }}
          >
            {!isAuthenticated ? (
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  px: 2,
                  py: 0.5,
                  fontWeight: 600,
                }}
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
            ) : (
              <>
                <Avatar
                  src={user?.avatar || "./user.png"}
                  sx={{ width: 36, height: 36 }}
                />
                <Box sx={{ display: { xs: "none", md: "block" } }}>
                  <Typography variant="subtitle2" sx={{ lineHeight: 1 }}>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={logout} title="Logout">
                  <LogoutIcon />
                </IconButton>
              </>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
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
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 1 },
            mt: 8,
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          <Stack spacing={2}>
            {/* Global Header Card (same as previous UI) */}
            <Paper
              elevation={3}
              sx={{
                p: { xs: 1.5, sm: 2.25 },
                borderRadius: 1,
                position: "relative",
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems="stretch"
                spacing={{ xs: 2, md: 0 }}
                sx={{ width: "100%", minWidth:{lg: 950} }}
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

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={{ xs: 1, sm: 3 }}
                    sx={{ mt: 0.5 }}
                  >
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
                    <StatPill
                      top={transformerNo || "N/A"}
                      bottom="Transformer No"
                    />
                    <StatPill
                      top={inspectionDetails.poleNo || poleNumber}
                      bottom="Pole No"
                    />
                    <StatPill
                      top={inspectionDetails.branch || branch}
                      bottom="Branch"
                    />
                    <StatPill
                      top={inspectionDetails.inspectedBy || inspectedBy}
                      bottom="Inspected By"
                    />
                  </Stack>
                </Box>

                {/* Right */}
                <Stack
                  direction="column"
                  alignItems={{ xs: "flex-start", md: "flex-end" }}
                  justifyContent="space-between"
                  sx={{
                    alignSelf: "stretch",
                    width: { xs: "100%", md: "auto" },
                    py: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    {renderStatusChip(determineImageStatus(inspection))}
                  </Box>
                </Stack>
              </Stack>
            </Paper>

            {/* Tabs */}
            <Paper>
              <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                variant="fullWidth"
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  "& .MuiTab-root": {
                    fontWeight: 600,
                    flex: "1 1 0",
                    minWidth: 0,
                    maxWidth: "none",
                    "&:focus": {
                      outline: "none",
                    },
                    "&:focus-visible": {
                      outline: "none",
                    },
                  },
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
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                        onChange={(e) =>
                          setBaselineImagingRightNo(e.target.value)
                        }
                      />
                      <TextField
                        fullWidth
                        label="Baseline Imaging Left No"
                        value={baselineImagingLeftNo}
                        onChange={(e) =>
                          setBaselineImagingLeftNo(e.target.value)
                        }
                      />
                    </Stack>
                  </CardContent>
                </Card>

                {/* Thermal Image Analysis Section */}
                {inspection?.image && inspection.image.type === "thermal" && (
                  <Box>
                    <ThermalImageAnalysis
                      thermalImageUrl={inspection.image.imageUrl}
                      baselineImageUrl=""
                      transformerNo={
                        inspection.transformerNo ||
                        inspection.transformer?.transformerNo ||
                        transformerNo
                      }
                      inspectionId={inspectionId}
                      defaultExpandedSessions={true}
                      hideActivities={true}
                    />
                  </Box>
                )}

                {/* Load / kVA Details */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                      Load / kVA Details
                    </Typography>
                    <Stack spacing={2}>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                    <Typography
                      variant="caption"
                      sx={{ mb: 2, display: "block" }}
                    >
                      Legend: C = Check, O = Clean, T = Tighten, R = Replace
                    </Typography>
                    <TableContainer sx={{ overflowX: "auto" }}>
                      <Table
                        size="small"
                        sx={{ minWidth: { xs: 650, sm: 750 } }}
                      >
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
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ mt: 2 }}
                      >
                        Current (Per Phase)
                      </Typography>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ mt: 2 }}
                      >
                        Current (Per Phase)
                      </Typography>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                    disabled={saving || loading}
                  >
                    {saving ? "Saving..." : "Save"}
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
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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

                {/* Team Composition */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                      Team Composition
                    </Typography>
                    <Stack spacing={2}>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
                        <TextField
                          fullWidth
                          label="All Spots Corrected By (CSS)"
                          value={allSpotsCorrectedBy}
                          onChange={(e) =>
                            setAllSpotsCorrectedBy(e.target.value)
                          }
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
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
                        <TextField
                          fullWidth
                          label="Team Leader"
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
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
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
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={
                      saving ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <CheckCircleIcon />
                      )
                    }
                    onClick={handleConfirm}
                    disabled={saving || loading}
                    color="success"
                  >
                    {saving ? "Submitting..." : "Confirm"}
                  </Button>
                </Stack>
              </Stack>
            </TabPanel>
          </Stack>
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmColor={confirmDialog.confirmColor}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        isLoading={saving}
      />
    </>
  );
}
