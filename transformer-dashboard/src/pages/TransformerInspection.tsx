import * as React from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
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
  Toolbar,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Menu,
  MenuItem,
  Tabs,
  Tab,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  List as ListIcon,
  MoreVert as MoreVertIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Add as AddIcon,
  Place as PlaceIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon,
  Download as DownloadIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useParams, useNavigate } from "react-router-dom";
import PowerLensBranding from "../components/PowerLensBranding";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import AddInspectionDialog from "../models/AddInspectionDialog";
import EditInspectionDialog, {
  type InspectionRow as EditInspectionRow,
} from "../models/EditInspectionDialog";
import DeleteInspectionConfirmationDialog from "../models/DeleteInspectionConfirmationDialog";

/* ================= Backend DTOs (inline, no shared files) ================= */
type TransformerType = "Bulk" | "Distribution" | string;

type TransformerDTO = {
  transformerNo: string;
  poleNo: number;
  region: string;
  type: TransformerType;
  createdAt?: string;
  updatedAt?: string;
};

type InspectionDTO = {
  inspectionId: number;
  inspectionTime: string;
  branch: string;
  inspector: string;
  createdAt?: string;
  updatedAt?: string;
  transformerNo: string;
  image?: {
    type: string;
    url: string;
  } | null;
};

/* ================= Local row (UI) ================= */
type ImageStatus = "baseline" | "maintenance" | "no image";
type InspectionRow = {
  id: number;
  inspectionNo: string;
  inspectedDate: string;
  maintenanceDate?: string;
  status: ImageStatus;
  favorite?: boolean;
  inspectionTimeIso: string;
  branch: string;
  inspector: string;
  transformerNo: string;
};

type MaintenanceRecordRow = {
  id: number;
  maintenanceFormId: number;
  formNo: string;
  dateAdded: string;
  addedBy: string;
  inspectionId: number;
  updatedAt: string;
  transformerNo: string;
};

type MaintenanceFormResponse = {
  maintenanceFormId?: number;
  inspectionId: number;
  transformerNo: string;
  thermalInspection?: Record<string, unknown>;
  maintenanceRecord?: Record<string, unknown>;
  workDataSheet?: Record<string, unknown>;
};

/* ================= Inline HTTP helper ================= */
const API_BASE =
  (import.meta.env as { VITE_API_BASE_URL?: string }).VITE_API_BASE_URL ??
  "http://localhost:8080/api";

async function http<T>(
  path: string,
  init?: RequestInit & { json?: unknown; suppress404?: boolean }
): Promise<T> {
  const headers = new Headers(init?.headers || {});
  if (init?.json !== undefined) headers.set("Content-Type", "application/json");

  // Add authentication headers
  const authHeaders = authService.getAuthHeader();
  Object.entries(authHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });

  if (!res.ok) {
    // Silently return null for 404 when suppress404 is true
    if (res.status === 404 && init?.suppress404) {
      return null as unknown as T;
    }
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  if (res.status === 204) return undefined as unknown as T;
  const text = await res.text();
  if (!text) return undefined as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/* ================= Helpers ================= */
function pad8(n: number | string) {
  return String(n).padStart(8, "0");
}
function toLocal(dt: string) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}
function determineImageStatus(dto: InspectionDTO): ImageStatus {
  // Determine image status based on the image field
  if (!dto.image || !dto.image.type) {
    return "no image";
  }

  // If the image type is explicitly baseline, return baseline
  if (dto.image.type === "baseline") {
    return "baseline";
  }

  // If the image type is thermal/maintenance, return maintenance
  if (dto.image.type === "thermal" || dto.image.type === "maintenance") {
    return "maintenance";
  }

  // Default - treat any other image as maintenance
  return "maintenance";
}
function dtoToRow(dto: InspectionDTO): InspectionRow {
  return {
    id: dto.inspectionId,
    inspectionNo: pad8(dto.inspectionId),
    inspectedDate: toLocal(dto.inspectionTime),
    maintenanceDate:
      dto.updatedAt && dto.createdAt && dto.updatedAt !== dto.createdAt
        ? toLocal(dto.updatedAt)
        : "-",
    status: determineImageStatus(dto),
    favorite: false,
    inspectionTimeIso: dto.inspectionTime,
    branch: dto.branch,
    inspector: dto.inspector,
    transformerNo: dto.transformerNo,
  };
}

const drawerWidth = 200;

const formatFieldValue = (value: unknown, fieldName?: string): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    // Check if it's an ISO date string and format it
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (isoDateRegex.test(value)) {
      try {
        const date = new Date(value);
        const lowerFieldName = (fieldName || "").toLowerCase();

        // If field name contains "date" but not "time", show only date
        if (
          lowerFieldName.includes("date") &&
          !lowerFieldName.includes("time")
        ) {
          return date.toLocaleDateString();
        }
        // If field name contains "time" but not "date", show only time
        if (
          lowerFieldName.includes("time") &&
          !lowerFieldName.includes("date")
        ) {
          return date.toLocaleTimeString();
        }
        // Default: show both
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      } catch {
        return value;
      }
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "-";
    return value
      .map((item) =>
        typeof item === "object" && item !== null
          ? JSON.stringify(item)
          : String(item)
      )
      .join("; ");
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

const statusChip = (s: ImageStatus) => {
  const map: Record<ImageStatus, { color: string; label: string }> = {
    baseline: { color: "#059669", label: "Baseline" },
    maintenance: { color: "#DC2626", label: "Maintenance" },
    "no image": { color: "#6B7280", label: "No Image" },
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
        px: { xs: 1, sm: 1.5 },
        py: { xs: 0.75, sm: 1 },
        borderRadius: 3,
        bgcolor: "#EEF0F6",
        minWidth: { xs: 80, sm: 90, md: 108 },
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

/* ================= Page ================= */
export default function TransformerInspection() {
  const { transformerNo = "AZ-8801" } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);

  // backend data
  const [transformer, setTransformer] = React.useState<TransformerDTO | null>(
    null
  );
  const [rows, setRows] = React.useState<InspectionRow[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = React.useState<
    MaintenanceRecordRow[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // paging
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const shown = React.useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage]
  );

  // maintenance records paging
  const [maintenancePage, setMaintenancePage] = React.useState(0);
  const [maintenanceRowsPerPage, setMaintenanceRowsPerPage] =
    React.useState(10);
  const shownMaintenance = React.useMemo(
    () =>
      maintenanceRecords.slice(
        maintenancePage * maintenanceRowsPerPage,
        maintenancePage * maintenanceRowsPerPage + maintenanceRowsPerPage
      ),
    [maintenanceRecords, maintenancePage, maintenanceRowsPerPage]
  );

  // menu state
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [menuRowId, setMenuRowId] = React.useState<number | null>(null);

  // add dialog
  const [addOpen, setAddOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  // edit dialog
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingInspection, setEditingInspection] =
    React.useState<EditInspectionRow | null>(null);
  const [saving, setSaving] = React.useState(false);

  // delete dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [maintenanceMenuRecordId, setMaintenanceMenuRecordId] = React.useState<
    number | null
  >(null);
  const [isDownloading, setIsDownloading] = React.useState(false);

  // load maintenance records
  const loadMaintenanceRecords = React.useCallback(async () => {
    try {
      // First get all inspections for this transformer
      const allInspections = await http<InspectionDTO[]>(`/inspections`);
      const transformerInspections = allInspections.filter(
        (i) => i.transformerNo === transformerNo
      );

      // Fetch maintenance forms for each inspection
      const records: MaintenanceRecordRow[] = [];
      for (const inspection of transformerInspections) {
        try {
          const maintenanceForm = await http<{
            maintenanceFormId?: number;
            inspectionId: number;
            transformerNo: string;
            createdAt?: string;
            updatedAt?: string;
            thermalInspection?: {
              inspectedBy?: string;
              inspectionDate?: string;
            };
          }>(`/inspections/${inspection.inspectionId}/maintenance-form`, {
            suppress404: true,
          });

          if (maintenanceForm) {
            records.push({
              id: inspection.inspectionId,
              maintenanceFormId:
                maintenanceForm.maintenanceFormId || inspection.inspectionId,
              formNo: maintenanceForm.maintenanceFormId
                ? pad8(maintenanceForm.maintenanceFormId)
                : pad8(inspection.inspectionId),
              dateAdded: maintenanceForm.createdAt
                ? toLocal(maintenanceForm.createdAt)
                : inspection.createdAt
                ? toLocal(inspection.createdAt)
                : "-",
              addedBy:
                maintenanceForm.thermalInspection?.inspectedBy ||
                inspection.inspector ||
                "N/A",
              inspectionId: inspection.inspectionId,
              updatedAt:
                inspection.updatedAt &&
                inspection.createdAt &&
                inspection.updatedAt !== inspection.createdAt
                  ? toLocal(inspection.updatedAt)
                  : "-",
              transformerNo: inspection.transformerNo,
            });
          }
        } catch (err) {
          // If no maintenance form exists for this inspection, skip it (already handled by suppress404)
          console.log(
            `No maintenance form for inspection ${inspection.inspectionId}`
          );
        }
      }

      // Sort by inspection ID descending
      records.sort((a, b) => b.id - a.id);
      setMaintenanceRecords(records);
    } catch (err) {
      console.error("Failed to load maintenance records:", err);
      setMaintenanceRecords([]);
    }
  }, [transformerNo]);

  // load data
  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // transformer
        const t = await http<TransformerDTO>(
          `/transformers/${encodeURIComponent(transformerNo)}`
        );
        setTransformer(t);

        // inspections (filter by transformerNo)
        const all = await http<InspectionDTO[]>(`/inspections`);
        const mine = all
          .filter((i) => i.transformerNo === transformerNo)
          .sort((a, b) => b.inspectionId - a.inspectionId);
        setRows(mine.map(dtoToRow));
      } catch {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }

      // Load maintenance records
      await loadMaintenanceRecords();
    })();
  }, [transformerNo, loadMaintenanceRecords]);

  /* ---------- Add inspection ---------- */
  const handleOpenAdd = () => setAddOpen(true);
  const handleCloseAdd = () => setAddOpen(false);

  const handleConfirmAdd = async (inspectionData: {
    branch: string;
    transformerNo: string;
    inspector: string;
    inspectionTime: string;
  }) => {
    try {
      setCreating(true);
      const created = await http<InspectionDTO>("/inspections", {
        method: "POST",
        json: inspectionData,
      });
      setRows((prev) => [dtoToRow(created), ...prev]);
      setAddOpen(false);
      navigate(
        `/${encodeURIComponent(inspectionData.transformerNo)}/${pad8(
          created.inspectionId
        )}`,
        {
          state: {
            from: "transformer-inspection",
            transformerNo: inspectionData.transformerNo,
          },
        }
      );
    } catch {
      setError("Failed to create inspection");
      throw new Error("Failed to create inspection");
    } finally {
      setCreating(false);
    }
  };

  /* ---------- Edit inspection ---------- */
  const openRowMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    setMenuAnchor(e.currentTarget);
    setMenuRowId(id);
  };
  const closeRowMenu = () => {
    setMenuAnchor(null);
    setMenuRowId(null);
  };

  const handleDownloadMaintenancePdf = async (recordId?: number) => {
    const targetRecordId = recordId ?? maintenanceMenuRecordId;
    if (targetRecordId == null) return;
    const record = maintenanceRecords.find((r) => r.id === targetRecordId);
    setIsDownloading(true);
    try {
      const [maintenanceForm, inspectionDetails] = await Promise.all([
        http<MaintenanceFormResponse>(
          `/inspections/${targetRecordId}/maintenance-form`
        ),
        http<InspectionDTO>(`/inspections/${targetRecordId}`),
      ]);

      if (!maintenanceForm) {
        setError("No maintenance form found for this inspection");
        return;
      }

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      let currentY = 40;

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(31, 28, 79);
      doc.text("Digital Maintenance Form", margin, currentY);
      currentY += 30;

      // Header Information Box
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(
        margin,
        currentY,
        pageWidth - 2 * margin,
        105,
        3,
        3,
        "FD"
      );

      currentY += 20;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);

      // Inspection details - Left column
      const headerLeftX = margin + 20;
      const headerRightX = pageWidth / 2 + 20;
      let headerY = currentY;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("Inspection #:", headerLeftX, headerY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(pad8(maintenanceForm.inspectionId), headerLeftX + 80, headerY);

      headerY += 17;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("Transformer No:", headerLeftX, headerY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(maintenanceForm.transformerNo || "-", headerLeftX + 80, headerY);

      headerY += 17;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("Pole No:", headerLeftX, headerY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(
        String(maintenanceForm.thermalInspection?.poleNumber || "-"),
        headerLeftX + 80,
        headerY
      );

      // Right column
      headerY = currentY;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("Branch:", headerRightX, headerY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(
        String(maintenanceForm.thermalInspection?.branch || "-"),
        headerRightX + 80,
        headerY
      );

      headerY += 17;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("Inspected By:", headerRightX, headerY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(
        String(maintenanceForm.thermalInspection?.inspectedBy || "-"),
        headerRightX + 80,
        headerY
      );

      currentY += 85;
      doc.setTextColor(0, 0, 0);

      // Add thermal/maintenance image with bounding boxes
      if (inspectionDetails.image && inspectionDetails.image.url) {
        try {
          // Check if we need a new page
          if (currentY > pageHeight - 300) {
            doc.addPage();
            currentY = 40;
          }

          // Add image section title with styling
          doc.setFontSize(16);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(31, 28, 79);
          doc.text("Thermal Image Analysis", margin, currentY);
          currentY += 10;

          // Add underline
          doc.setDrawColor(31, 28, 79);
          doc.setLineWidth(2);
          doc.line(margin, currentY, margin + 160, currentY);
          currentY += 15;
          doc.setTextColor(0, 0, 0);

          // Fetch the image
          const imageResponse = await fetch(inspectionDetails.image.url);
          const imageBlob = await imageResponse.blob();
          const imageUrl = URL.createObjectURL(imageBlob);

          // Create image element to get dimensions
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = imageUrl;
          });

          // Calculate image dimensions to fit in PDF
          const maxImageWidth = pageWidth - 2 * margin;
          const maxImageHeight = 250;
          let imgWidth = img.width;
          let imgHeight = img.height;

          if (imgWidth > maxImageWidth) {
            const ratio = maxImageWidth / imgWidth;
            imgWidth = maxImageWidth;
            imgHeight = imgHeight * ratio;
          }

          if (imgHeight > maxImageHeight) {
            const ratio = maxImageHeight / imgHeight;
            imgHeight = maxImageHeight;
            imgWidth = imgWidth * ratio;
          }

          // Draw image container with border
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(1);
          doc.rect(margin, currentY, imgWidth, imgHeight);

          // Add image to PDF
          doc.addImage(imageUrl, "JPEG", margin, currentY, imgWidth, imgHeight);

          // Fetch and draw bounding boxes
          try {
            const detectionsResponse = await http<any>(
              `/inspections/${targetRecordId}/detections`
            );

            if (detectionsResponse && Array.isArray(detectionsResponse)) {
              const scaleX = imgWidth / img.width;
              const scaleY = imgHeight / img.height;

              // Draw each bounding box
              detectionsResponse.forEach((detection: any) => {
                if (
                  detection.x !== undefined &&
                  detection.y !== undefined &&
                  detection.width !== undefined &&
                  detection.height !== undefined
                ) {
                  const boxX = margin + detection.x * scaleX;
                  const boxY = currentY + detection.y * scaleY;
                  const boxWidth = detection.width * scaleX;
                  const boxHeight = detection.height * scaleY;

                  // Set color based on class (you can customize this)
                  doc.setDrawColor(220, 38, 38); // Red color
                  doc.setLineWidth(2);
                  doc.rect(boxX, boxY, boxWidth, boxHeight);

                  // Add label if available
                  if (detection.class) {
                    const labelWidth = Math.max(boxWidth, 60);
                    doc.setFillColor(220, 38, 38);
                    doc.rect(boxX, boxY - 18, labelWidth, 16, "F");
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(9);
                    doc.setFont("helvetica", "bold");
                    doc.text(detection.class, boxX + 4, boxY - 6);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont("helvetica", "normal");
                  }
                }
              });
            }
          } catch (detectionError) {
            console.log(
              "No detections found or error fetching detections:",
              detectionError
            );
          }

          // Clean up
          URL.revokeObjectURL(imageUrl);

          currentY += imgHeight + 30;
        } catch (imageError) {
          console.error("Error adding image to PDF:", imageError);
          // Continue without image
        }
      }

      // Helper function to add a section with card-like styling
      const addSection = (
        title: string,
        subsections: Array<{
          subtitle?: string;
          fields: Array<{ label: string; value: string }>;
        }>
      ) => {
        // Check if we need a new page
        if (currentY > pageHeight - 100) {
          doc.addPage();
          currentY = 40;
        }

        // Section title with background
        doc.setFillColor(31, 28, 79);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 28, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(15);
        doc.setFont("helvetica", "bold");
        doc.text(title, margin + 15, currentY + 19);
        currentY += 40;
        doc.setTextColor(0, 0, 0);

        subsections.forEach((subsection) => {
          // Check for page break
          if (currentY > pageHeight - 80) {
            doc.addPage();
            currentY = 40;
          }

          if (subsection.subtitle) {
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(31, 28, 79);
            doc.text(subsection.subtitle, margin + 15, currentY);
            currentY += 22;
          }

          // Draw card background
          const cardHeight = Math.ceil(subsection.fields.length / 2) * 28 + 25;
          doc.setDrawColor(220, 220, 220);
          doc.setFillColor(250, 250, 252);
          doc.roundedRect(
            margin,
            currentY - 8,
            pageWidth - 2 * margin,
            cardHeight,
            3,
            3,
            "FD"
          );

          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");

          subsection.fields.forEach((field, index) => {
            const column = index % 2;
            const row = Math.floor(index / 2);
            const xPos = column === 0 ? margin + 20 : pageWidth / 2 + 15;
            const yPos = currentY + row * 28 + 5;

            // Field label
            doc.setFont("helvetica", "bold");
            doc.setTextColor(80, 80, 80);
            doc.text(field.label + ":", xPos, yPos);

            // Field value
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            const valueX = xPos + 85;
            const maxWidth = pageWidth / 2 - 115;
            const lines = doc.splitTextToSize(field.value, maxWidth);
            doc.text(lines, valueX, yPos);
          });

          currentY += cardHeight + 15;
        });

        currentY += 5;
      };

      // Tab 1: Thermal Image Inspection
      const thermal = maintenanceForm.thermalInspection;
      if (thermal) {
        addSection("Thermal Image Inspection", [
          {
            subtitle: "Basic Details",
            fields: [
              { label: "Branch", value: String(thermal.branch || "-") },
              {
                label: "Transformer No",
                value: String(thermal.transformerNo || "-"),
              },
              { label: "Pole No", value: String(thermal.poleNumber || "-") },
              {
                label: "Location Details",
                value: String(thermal.locationDetails || "-"),
              },
            ],
          },
          {
            subtitle: "Inspection Metadata",
            fields: [
              {
                label: "Inspection Date",
                value: String(formatFieldValue(thermal.inspectionDate, "date")),
              },
              {
                label: "Inspection Time",
                value: String(formatFieldValue(thermal.inspectionTime, "time")),
              },
              {
                label: "Inspected By",
                value: String(thermal.inspectedBy || "-"),
              },
            ],
          },
          {
            subtitle: "Baseline Imaging",
            fields: [
              {
                label: "Right No",
                value: String(thermal.baselineImagingRightNo || "-"),
              },
              {
                label: "Left No",
                value: String(thermal.baselineImagingLeftNo || "-"),
              },
            ],
          },
          {
            subtitle: "Load / kVA Details",
            fields: [
              {
                label: "Last Month kVA",
                value: String(thermal.lastMonthKva || "-"),
              },
              {
                label: "Last Month Date",
                value: String(formatFieldValue(thermal.lastMonthDate, "date")),
              },
              {
                label: "Last Month Time",
                value: String(formatFieldValue(thermal.lastMonthTime, "time")),
              },
              {
                label: "Current Month kVA",
                value: String(thermal.currentMonthKva || "-"),
              },
            ],
          },
          {
            subtitle: "Operating / Environment",
            fields: [
              {
                label: "Baseline Condition",
                value: String(thermal.baselineCondition || "-"),
              },
              {
                label: "Transformer Type",
                value: String(thermal.transformerType || "-"),
              },
            ],
          },
          {
            subtitle: "Meter Details",
            fields: [
              {
                label: "Meter Serial",
                value: String(thermal.meterSerial || "-"),
              },
              {
                label: "Meter CT Ratio",
                value: String(thermal.meterCtRatio || "-"),
              },
              { label: "Meter Make", value: String(thermal.meterMake || "-") },
            ],
          },
          {
            subtitle: "First Inspection Readings",
            fields: [
              {
                label: "Voltage R",
                value: String(thermal.firstInspectionVoltageR || "-"),
              },
              {
                label: "Voltage Y",
                value: String(thermal.firstInspectionVoltageY || "-"),
              },
              {
                label: "Voltage B",
                value: String(thermal.firstInspectionVoltageB || "-"),
              },
              {
                label: "Current R",
                value: String(thermal.firstInspectionCurrentR || "-"),
              },
              {
                label: "Current Y",
                value: String(thermal.firstInspectionCurrentY || "-"),
              },
              {
                label: "Current B",
                value: String(thermal.firstInspectionCurrentB || "-"),
              },
            ],
          },
          {
            subtitle: "Second Inspection Readings",
            fields: [
              {
                label: "Voltage R",
                value: String(thermal.secondInspectionVoltageR || "-"),
              },
              {
                label: "Voltage Y",
                value: String(thermal.secondInspectionVoltageY || "-"),
              },
              {
                label: "Voltage B",
                value: String(thermal.secondInspectionVoltageB || "-"),
              },
              {
                label: "Current R",
                value: String(thermal.secondInspectionCurrentR || "-"),
              },
              {
                label: "Current Y",
                value: String(thermal.secondInspectionCurrentY || "-"),
              },
              {
                label: "Current B",
                value: String(thermal.secondInspectionCurrentB || "-"),
              },
            ],
          },
        ]);

        // Work Content Table
        if (
          thermal.workContent &&
          Array.isArray(thermal.workContent) &&
          thermal.workContent.length > 0
        ) {
          if (currentY > pageHeight - 150) {
            doc.addPage();
            currentY = 40;
          }

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(31, 28, 79);
          doc.text("Work Content", margin + 15, currentY);
          currentY += 15;
          doc.setTextColor(0, 0, 0);

          // Helper function to draw checkbox
          const drawCheckbox = (
            doc: jsPDF,
            x: number,
            y: number,
            checked: boolean
          ) => {
            const boxSize = 8;
            // Draw box
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.rect(x, y, boxSize, boxSize);

            // Draw check mark if checked
            if (checked) {
              doc.setLineWidth(1);
              doc.line(x + 1, y + 4, x + 3, y + 7);
              doc.line(x + 3, y + 7, x + 7, y + 1);
            }
          };

          autoTable(doc, {
            startY: currentY,
            head: [["No.", "C", "O", "T", "R", "Other", "Status", "Nos"]],
            body: thermal.workContent.map((item: any) => [
              item.itemNo || "-",
              "", // C - will draw checkbox
              "", // O - will draw checkbox
              "", // T - will draw checkbox
              "", // R - will draw checkbox
              item.other || "-",
              item.afterInspectionStatus || "-",
              item.afterInspectionNos || "-",
            ]),
            styles: {
              fontSize: 8,
              cellPadding: 3,
            },
            headStyles: {
              fillColor: [31, 28, 79],
              textColor: [255, 255, 255],
              fontStyle: "bold",
            },
            columnStyles: {
              1: { halign: "center", cellWidth: 20 },
              2: { halign: "center", cellWidth: 20 },
              3: { halign: "center", cellWidth: 20 },
              4: { halign: "center", cellWidth: 20 },
            },
            margin: { left: margin, right: margin },
            didDrawCell: (data: any) => {
              // Draw checkboxes in C, O, T, R columns
              if (
                data.section === "body" &&
                data.column.index >= 1 &&
                data.column.index <= 4
              ) {
                const workContent = thermal.workContent as any[];
                const item = workContent[data.row.index];
                const centerX = data.cell.x + data.cell.width / 2 - 4;
                const centerY = data.cell.y + data.cell.height / 2 - 4;

                switch (data.column.index) {
                  case 1: // C - Check
                    drawCheckbox(doc, centerX, centerY, item.doCheck);
                    break;
                  case 2: // O - Clean
                    drawCheckbox(doc, centerX, centerY, item.doClean);
                    break;
                  case 3: // T - Tighten
                    drawCheckbox(doc, centerX, centerY, item.doTighten);
                    break;
                  case 4: // R - Replace
                    drawCheckbox(doc, centerX, centerY, item.doReplace);
                    break;
                }
              }
            },
          });

          currentY =
            (doc as unknown as { lastAutoTable?: { finalY: number } })
              .lastAutoTable?.finalY ?? currentY + 20;
          currentY += 20;
        }
      }

      // Tab 2: Maintenance Record
      const maintenance = maintenanceForm.maintenanceRecord;
      if (maintenance) {
        addSection("Maintenance Record", [
          {
            subtitle: "Job Timing",
            fields: [
              {
                label: "Start Time",
                value: String(formatFieldValue(maintenance.startTime, "time")),
              },
              {
                label: "Completion Time",
                value: String(
                  formatFieldValue(maintenance.completionTime, "time")
                ),
              },
              {
                label: "Supervised By",
                value: String(maintenance.supervisedBy || "-"),
              },
            ],
          },
          {
            subtitle: "Team Composition",
            fields: [
              { label: "Tech 1", value: String(maintenance.tech1 || "-") },
              { label: "Tech 2", value: String(maintenance.tech2 || "-") },
              { label: "Tech 3", value: String(maintenance.tech3 || "-") },
              { label: "Helpers", value: String(maintenance.helpers || "-") },
            ],
          },
          {
            subtitle: "Inspection / Rectification Chain",
            fields: [
              {
                label: "Inspected By",
                value: String(maintenance.maintenanceInspectedBy || "-"),
              },
              {
                label: "Inspected Date",
                value: String(
                  formatFieldValue(maintenance.maintenanceInspectedDate, "date")
                ),
              },
              {
                label: "Rectified By",
                value: String(maintenance.maintenanceRectifiedBy || "-"),
              },
              {
                label: "Rectified Date",
                value: String(
                  formatFieldValue(maintenance.maintenanceRectifiedDate, "date")
                ),
              },
              {
                label: "Re-inspected By",
                value: String(maintenance.maintenanceReinspectedBy || "-"),
              },
              {
                label: "Re-inspected Date",
                value: String(
                  formatFieldValue(
                    maintenance.maintenanceReinspectedDate,
                    "date"
                  )
                ),
              },
            ],
          },
          {
            subtitle: "CSS / Closure",
            fields: [
              {
                label: "CSS Officer",
                value: String(maintenance.cssOfficer || "-"),
              },
              {
                label: "CSS Date",
                value: String(formatFieldValue(maintenance.cssDate, "date")),
              },
              {
                label: "All Spots Corrected By",
                value: String(maintenance.allSpotsCorrectedBy || "-"),
              },
              {
                label: "Corrected Date",
                value: String(
                  formatFieldValue(maintenance.allSpotsCorrectedDate, "date")
                ),
              },
            ],
          },
        ]);
      }

      // Tab 3: Work + Data Sheet
      const workData = maintenanceForm.workDataSheet;
      if (workData) {
        addSection("Work + Data Sheet", [
          {
            subtitle: "Job / Transformer Data",
            fields: [
              {
                label: "Team Leader",
                value: String(workData.gangLeader || "-"),
              },
              {
                label: "Job Date",
                value: String(formatFieldValue(workData.jobDate, "date")),
              },
              {
                label: "Job Start Time",
                value: String(formatFieldValue(workData.jobStartTime, "time")),
              },
              { label: "Serial No", value: String(workData.serialNo || "-") },
              { label: "kVA Rating", value: String(workData.kvaRating || "-") },
              {
                label: "Tap Position",
                value: String(workData.tapPosition || "-"),
              },
              { label: "CT Ratio", value: String(workData.ctRatio || "-") },
              {
                label: "Earth Resistance",
                value: String(workData.earthResistance || "-"),
              },
              { label: "Neutral", value: String(workData.neutral || "-") },
            ],
          },
          {
            subtitle: "Protection Devices",
            fields: [
              {
                label: "Surge Checked",
                value: String(formatFieldValue(workData.surgeChecked)),
              },
              {
                label: "Body Checked",
                value: String(formatFieldValue(workData.bodyChecked)),
              },
              {
                label: "FDS Fuse F1",
                value: String(workData.fdsFuseF1 || "-"),
              },
              {
                label: "FDS Fuse F2",
                value: String(workData.fdsFuseF2 || "-"),
              },
              {
                label: "FDS Fuse F3",
                value: String(workData.fdsFuseF3 || "-"),
              },
              {
                label: "FDS Fuse F4",
                value: String(workData.fdsFuseF4 || "-"),
              },
              {
                label: "FDS Fuse F5",
                value: String(workData.fdsFuseF5 || "-"),
              },
            ],
          },
          {
            subtitle: "Job Completion",
            fields: [
              {
                label: "Completed Time",
                value: String(
                  formatFieldValue(workData.jobCompletedTime, "time")
                ),
              },
              { label: "Notes", value: String(workData.notes || "-") },
            ],
          },
        ]);

        // Materials Table
        if (
          workData.materials &&
          Array.isArray(workData.materials) &&
          workData.materials.length > 0
        ) {
          const usedMaterials = workData.materials.filter((m: any) => m.used);

          if (usedMaterials.length > 0) {
            if (currentY > pageHeight - 150) {
              doc.addPage();
              currentY = 40;
            }

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(31, 28, 79);
            doc.text("Materials Used", margin + 15, currentY);
            currentY += 15;
            doc.setTextColor(0, 0, 0);

            autoTable(doc, {
              startY: currentY,
              head: [["Description", "Code"]],
              body: usedMaterials.map((item: any) => [
                item.description || "-",
                item.code || "-",
              ]),
              styles: {
                fontSize: 9,
                cellPadding: 4,
              },
              headStyles: {
                fillColor: [31, 28, 79],
                textColor: [255, 255, 255],
                fontStyle: "bold",
              },
              margin: { left: margin, right: margin },
            });

            currentY =
              (doc as unknown as { lastAutoTable?: { finalY: number } })
                .lastAutoTable?.finalY ?? currentY + 20;
          }
        }
      }

      const fileName = `Digital-Maintenance-${
        record?.formNo ||
        pad8(maintenanceForm.maintenanceFormId ?? maintenanceForm.inspectionId)
      }.pdf`;
      doc.save(fileName);
    } catch (downloadError) {
      console.error(downloadError);
      setError("Failed to download maintenance record PDF");
    } finally {
      setIsDownloading(false);
      setMaintenanceMenuRecordId(null);
    }
  };

  const handleStartEdit = (id: number) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    // Convert the local InspectionRow to the format expected by EditInspectionDialog
    const editData: EditInspectionRow = {
      id: row.id,
      transformerNo: row.transformerNo,
      inspectionNo: row.inspectionNo,
      inspectedDate: row.inspectedDate,
      maintenanceDate: row.maintenanceDate || "-",
      status: row.status,
      branch: row.branch,
      inspector: row.inspector,
      inspectionTime: row.inspectionTimeIso,
    };
    setEditingInspection(editData);
    setEditOpen(true);
    closeRowMenu();
  };

  const handleConfirmEdit = async (
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
      const updated = await http<InspectionDTO>(`/inspections/${id}`, {
        method: "PUT",
        json: inspectionData,
      });

      setRows((prev) => prev.map((r) => (r.id === id ? dtoToRow(updated) : r)));
      setEditOpen(false);
      setEditingInspection(null);
    } catch {
      setError("Failed to update inspection");
      throw new Error("Failed to update inspection");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Delete inspection ---------- */
  const handleOpenDelete = (id: number) => {
    setDeleteId(id);
    setDeleteOpen(true);
    closeRowMenu();
  };
  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setDeleteId(null);
  };
  const handleConfirmDelete = async () => {
    if (deleteId == null) return;
    try {
      await http<void>(`/inspections/${deleteId}`, { method: "DELETE" });

      setRows((prev) => {
        const next = prev.filter((r) => r.id !== deleteId);
        if (page > 0 && page * rowsPerPage >= next.length) {
          setPage(page - 1);
        }
        return next;
      });

      handleCloseDelete();
    } catch {
      setError("Failed to delete inspection");
    }
  };

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
          <ListItemButton onClick={() => navigate("/")}>
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
      {/* AppBar */}
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
            <IconButton onClick={() => navigate("/")} sx={{ color: "inherit" }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Transformer Inspections
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
                <IconButton
                  size="small"
                  onClick={logout}
                  title="Logout"
                  aria-label="logout"
                >
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
        aria-label="sidebar"
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
            mt: 9,
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          {/* error */}
          {error && (
            <Paper
              sx={{
                p: 2,
                mb: 2,
                border: (t) => `1px solid ${t.palette.error.light}`,
                bgcolor: "#FFF5F5",
              }}
            >
              <Typography color="error">{error}</Typography>
            </Paper>
          )}

          {/* loading */}
          {loading ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography>Loading…</Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {/* ===== Header ===== */}
              <Paper elevation={3} sx={{ p: 2.25, borderRadius: 1 }}>
                <Stack
                  direction="row"
                  alignItems="stretch"
                  sx={{ width: "100%", minWidth: 950 }}
                >
                  {/* Left block */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    {/* Row 1 */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.25}
                      flexWrap="wrap"
                    >
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

                      <Typography
                        variant="h6"
                        fontWeight={800}
                        sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
                      >
                        {transformer?.transformerNo ?? transformerNo}
                      </Typography>

                      {/* Region */}
                      {transformer?.region && (
                        <Typography
                          sx={{
                            ml: { xs: 1, sm: 3 },
                            fontSize: { xs: 13, sm: 14 },
                            color: "text.secondary",
                          }}
                        >
                          {transformer.region}
                        </Typography>
                      )}

                      <IconButton size="small">
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Stack>

                    {/* Row 2 */}
                    {transformer?.region && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        <PlaceIcon sx={{ fontSize: 16, color: "#EF4444" }} />
                        {transformer.region}
                      </Typography>
                    )}

                    {/* Row 3 */}
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ mt: 1.5 }}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {transformer?.poleNo !== undefined && (
                        <StatPill top={transformer.poleNo} bottom="Pole No" />
                      )}
                      {transformer?.type && (
                        <StatPill top={transformer.type} bottom="Type" />
                      )}
                      {transformer?.createdAt && (
                        <StatPill
                          top={toLocal(transformer.createdAt)}
                          bottom="Created"
                        />
                      )}
                    </Stack>
                  </Box>

                  {/* Right block */}
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
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: "nowrap", lineHeight: 1.25 }}
                    >
                      Last Inspected Date: {rows[0]?.inspectedDate ?? "-"}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>

              {/* ===== Split View with Tabs ===== */}
              <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
                {/* Tabs Header */}
                <Box
                  sx={{
                    borderBottom: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    sx={{
                      "& .MuiTab-root": {
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        minHeight: 56,
                        px: 3,
                      },
                    }}
                  >
                    <Tab label="Transformer Inspections" />
                    <Tab label="Digital Maintenance Records" />
                  </Tabs>
                </Box>

                {/* Tab Panel 1: Transformer Inspections */}
                {activeTab === 0 && (
                  <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      alignItems={{ xs: "stretch", sm: "center" }}
                      spacing={{ xs: 1.5, sm: 0 }}
                      sx={{ mb: 1.5 }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={800}
                        sx={{ pl: { xs: 0, sm: 2 } }}
                      >
                        Transformer Inspections
                      </Typography>
                      <Box sx={{ flexGrow: 1 }} />
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAdd}
                        sx={{
                          width: { xs: "100%", sm: "auto" },
                          borderRadius: 999,
                          px: 2.5,
                          py: 0.9,
                          fontWeight: 700,
                          textTransform: "none",
                          background:
                            "linear-gradient(180deg, #4F46E5 0%, #2E26C3 100%)",
                          boxShadow: "0 8px 18px rgba(79,70,229,0.35)",
                          "&:hover": {
                            background:
                              "linear-gradient(180deg, #4338CA 0%, #2A21B8 100%)",
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
                            <TableCell>Inspected Date & Time</TableCell>
                            <TableCell>Image Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {shown.map((row) => (
                            <TableRow key={row.id} hover>
                              <TableCell width={48}>
                                <IconButton size="small">
                                  {row.favorite ? (
                                    <StarIcon color="secondary" />
                                  ) : (
                                    <StarBorderIcon color="disabled" />
                                  )}
                                </IconButton>
                              </TableCell>
                              <TableCell>
                                <Typography fontWeight={600}>
                                  {row.inspectionNo}
                                </Typography>
                              </TableCell>
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
                                        )}/${encodeURIComponent(
                                          row.inspectionNo
                                        )}`,
                                        {
                                          state: {
                                            from: "transformer-inspection",
                                            transformerNo: row.transformerNo,
                                          },
                                        }
                                      )
                                    }
                                  >
                                    View
                                  </Button>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => openRowMenu(e, row.id)}
                                  >
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
                      count={rows.length}
                      page={page}
                      onPageChange={(_e, p) => setPage(p)}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                      }}
                      rowsPerPageOptions={[5, 10, 20, 50]}
                    />
                  </Box>
                )}

                {/* Tab Panel 2: Digital Maintenance Records */}
                {activeTab === 1 && (
                  <Box sx={{ p: 2.5 }}>
                    <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
                      <Typography variant="h6" fontWeight={800} sx={{ pl: 2 }}>
                        Digital Maintenance Records
                      </Typography>
                      <Box sx={{ flexGrow: 1 }} />
                    </Stack>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Inspection ID</TableCell>
                            <TableCell>Created Date & Time</TableCell>
                            <TableCell>Added By</TableCell>
                            <TableCell>Updated Date & Time</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {shownMaintenance.map((record) => (
                            <TableRow key={record.id} hover>
                              <TableCell>
                                <Typography fontWeight={600}>
                                  {pad8(record.inspectionId)}
                                </Typography>
                              </TableCell>
                              <TableCell>{record.dateAdded}</TableCell>
                              <TableCell>{record.addedBy}</TableCell>
                              <TableCell>{record.updatedAt}</TableCell>
                              <TableCell align="right">
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  justifyContent="flex-end"
                                >
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => {
                                      // Navigate to digital maintenance form
                                      navigate(
                                        `/digital-form/${encodeURIComponent(
                                          record.transformerNo
                                        )}/${record.inspectionId}`
                                      );
                                    }}
                                  >
                                    View
                                  </Button>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => {
                                      handleDownloadMaintenancePdf(record.id);
                                    }}
                                    disabled={isDownloading}
                                    title="Download PDF"
                                  >
                                    <DownloadIcon />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}

                          {shownMaintenance.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6}>
                                <Box sx={{ p: 4, textAlign: "center" }}>
                                  <Typography>
                                    No maintenance records found
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <TablePagination
                      component="div"
                      count={maintenanceRecords.length}
                      page={maintenancePage}
                      onPageChange={(_e, p) => setMaintenancePage(p)}
                      rowsPerPage={maintenanceRowsPerPage}
                      onRowsPerPageChange={(e) => {
                        setMaintenanceRowsPerPage(parseInt(e.target.value, 10));
                        setMaintenancePage(0);
                      }}
                      rowsPerPageOptions={[5, 10, 20, 50]}
                    />
                  </Box>
                )}
              </Paper>
            </Stack>
          )}
        </Box>
      </Box>

      {/* Row actions menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeRowMenu}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{ sx: { mt: 1, minWidth: 160, borderRadius: 2 } }}
      >
        <MenuItem
          onClick={() => {
            if (menuRowId != null) handleStartEdit(menuRowId);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuRowId != null) handleOpenDelete(menuRowId);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

      {/* ---------- Add Inspection Dialog ---------- */}
      <AddInspectionDialog
        open={addOpen}
        onClose={handleCloseAdd}
        onConfirm={handleConfirmAdd}
        isCreating={creating}
        defaultTransformerNo={transformerNo}
        defaultBranch={transformer?.region}
      />

      {/* ---------- Edit Inspection Dialog ---------- */}
      <EditInspectionDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleConfirmEdit}
        inspectionData={editingInspection}
        isSaving={saving}
      />

      {/* ---------- Delete Confirmation Dialog ---------- */}
      <DeleteInspectionConfirmationDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await handleConfirmDelete();
        }}
        inspectionId={deleteId}
        isDeleting={saving}
      />
    </>
  );
}
