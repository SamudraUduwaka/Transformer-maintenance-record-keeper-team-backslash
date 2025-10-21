import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Alert,
  IconButton,
  Card,
  CardContent,
  Tooltip,
  Snackbar,
} from "@mui/material";
import {
  FilterList as FilterListIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterFocusStrongIcon,
  Edit as EditIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { authService } from "../services/authService";
import DrawingCanvas from "./DrawingCanvas";

// TypeScript interfaces matching the API response
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ThermalIssue {
  id: string;
  type: string;
  severity: "warning" | "critical";
  confidence: number;
  boundingBox: BoundingBox;
  description: string;
  recommendations: string[];
}

interface ThermalAnalysisData {
  imageUrl: string;
  analysisTimestamp: string;
  issues: ThermalIssue[];
  overallScore: number;
  processingTime: number;
  predictionId?: number;
}

interface ThermalImageAnalysisProps {
  thermalImageUrl?: string;
  baselineImageUrl?: string;
  onAnalysisComplete?: (analysis: ThermalAnalysisData) => void;
  loading?: boolean;
  transformerNo?: string;
  inspectionId?: number;
}

const ISSUE_TYPE_LABELS: Record<string, string> = {
  "Loose Joint (Faulty)": "Loose Joint - Faulty",
  "Loose Joint (Potential)": "Loose Joint - Potential",
  "Point Overload (Faulty)": "Point Overload - Faulty",
  "Point Overload (Potential)": "Point Overload - Potential",
  "Full Wire Overload": "Full Wire Overload",
};

// Opacity for bounding box background (20 = ~12% opacity in hex)
const BOUNDING_BOX_OPACITY = "20";

/* ZoomableImage component with zoom and pan functionality */
interface ZoomableImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  maxHeight?: number;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  onImageLoad?: () => void;
  onScaleChange?: (scale: number) => void;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({
  src,
  alt,
  style,
  maxHeight = 400,
  canvasRef,
  onImageLoad,
  onScaleChange,
}) => {
  const [scale, setScale] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

  const handleZoomIn = () => {
    setScale((prev) => {
      const newScale = Math.min(prev * 1.2, 5);
      onScaleChange?.(newScale);
      return newScale;
    });
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev / 1.2, 0.5);
      onScaleChange?.(newScale);
      return newScale;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    onScaleChange?.(1);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 / 1.1 : 1.1;
    setScale((prev) => {
      const newScale = Math.min(Math.max(prev * delta, 0.5), 5);
      onScaleChange?.(newScale);
      return newScale;
    });
  };

  const handleImageLoad = () => {
    if (imageRef.current && canvasRef?.current) {
      // Get the actual displayed image dimensions (not natural dimensions)
      const imgElement = imageRef.current;
      const containerElement = containerRef.current;

      if (containerElement) {
        // Calculate the actual displayed size of the image within the container
        const containerRect = containerElement.getBoundingClientRect();
        // Set canvas to match the actual displayed image size, not natural size
        const displayWidth = Math.min(
          imgElement.naturalWidth,
          containerRect.width
        );
        const displayHeight = Math.min(
          imgElement.naturalHeight,
          containerRect.height
        );

        // Maintain aspect ratio
        const aspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
        let finalWidth = displayWidth;
        let finalHeight = displayHeight;

        if (displayWidth / displayHeight > aspectRatio) {
          finalWidth = displayHeight * aspectRatio;
        } else {
          finalHeight = displayWidth / aspectRatio;
        }

        // Set canvas dimensions to match the actual displayed image
        canvasRef.current.width = finalWidth;
        canvasRef.current.height = finalHeight;

        console.log("Image Load Debug:", {
          naturalSize: {
            width: imgElement.naturalWidth,
            height: imgElement.naturalHeight,
          },
          displaySize: { width: finalWidth, height: finalHeight },
          containerSize: {
            width: containerRect.width,
            height: containerRect.height,
          },
        });
      }
    }
    onImageLoad?.();
  };

  return (
    <Box sx={{ position: "relative", ...style }}>
      {/* Image Container */}
      <Box
        ref={containerRef}
        sx={{
          width: "100%",
          height: maxHeight,
          overflow: "hidden",
          borderRadius: 2,
          cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f5f5f5",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? "none" : "transform 0.2s ease",
            borderRadius: 12,
            objectFit: "contain",
            userSelect: "none",
            pointerEvents: "none",
          }}
          onLoad={handleImageLoad}
          draggable={false}
        />
        {canvasRef && (
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) scale(${scale}) translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? "none" : "transform 0.2s ease",
              pointerEvents: "none",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        )}
      </Box>

      {/* Zoom Controls */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          bgcolor: "rgba(255, 255, 255, 0.9)",
          borderRadius: 1,
          p: 0.5,
          boxShadow: 1,
        }}
      >
        <Tooltip title="Zoom In" arrow>
          <IconButton size="small" onClick={handleZoomIn} disabled={scale >= 5}>
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out" arrow>
          <IconButton
            size="small"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset Zoom" arrow>
          <IconButton size="small" onClick={handleReset}>
            <CenterFocusStrongIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Scale Indicator */}
      <Box
        sx={{
          position: "absolute",
          bottom: 8,
          left: 8,
          bgcolor: "rgba(0, 0, 0, 0.7)",
          color: "white",
          px: 1,
          py: 0.5,
          borderRadius: 1,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {Math.round(scale * 100)}%
      </Box>
    </Box>
  );
};

// Activity Log interfaces
interface ActivityLogEntry {
  detectionId: number;
  originalDetectionId?: number; // Reference to original detection for EDITED/DELETED
  source: "AI_GENERATED" | "MANUALLY_ADDED";
  actionType: "ADDED" | "EDITED" | "DELETED";
  classId: number;
  comments?: string;
  createdAt: string;
  userId?: number;
  userName: string;
  // Bounding box coordinates
  bboxX?: number;
  bboxY?: number;
  bboxW?: number;
  bboxH?: number;
  confidence?: number;
}

interface PredictionSession {
  predictionId: number;
  sessionType: "AI_ANALYSIS" | "MANUAL_EDITING";
  userName: string;
  userId: number;
  createdAt: string;
  issueCount: number;
  detections: ActivityLogEntry[];
}

const FAULT_TYPE_LABELS_MAP: Record<number, string> = {
  0: "Point Overload (Faulty)",
  1: "Loose Joint (Faulty)",
  2: "Point Overload (Potential)",
  3: "Loose Joint (Potential)",
  4: "Full Wire Overload",
};

const ThermalImageAnalysis: React.FC<ThermalImageAnalysisProps> = ({
  thermalImageUrl,
  baselineImageUrl,
  onAnalysisComplete,
  loading = false,
  transformerNo,
  inspectionId,
}) => {
  const [analysisData, setAnalysisData] = useState<ThermalAnalysisData | null>(
    null
  );
  const [selectedIssueFilter, setSelectedIssueFilter] = useState<string>("all");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentScale, setCurrentScale] = useState(1);

  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // ADD: Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzedImagesRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<string | null>(null);

  // Activity log states
  const [predictionSessions, setPredictionSessions] = useState<
    PredictionSession[]
  >([]);
  const [loadingActivityLog, setLoadingActivityLog] = useState(false);
  const [activityLogFilter, setActivityLogFilter] = useState<string>("all");
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(
    new Set()
  );

  // API call to analyze thermal image
  const analyzeThermalImage =
    useCallback(async (): Promise<ThermalAnalysisData> => {
      if (!transformerNo) {
        console.warn(
          "ThermalImageAnalysis: transformerNo not provided; prediction persistence will be skipped on backend."
        );
      }

      const apiUrl = "http://localhost:8080/api/images/thermal-analysis";

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authService.getAuthHeader(),
          },
          body: JSON.stringify({
            thermalImageUrl,
            baselineImageUrl,
            transformerNo,
            inspectionId,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(
            `Analysis failed: ${response.status} ${response.statusText}${
              errorText ? ` - ${errorText}` : ""
            }`
          );
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Thermal analysis error:", error);
        throw error;
      }
    }, [thermalImageUrl, baselineImageUrl, transformerNo, inspectionId]);

  // Trigger analysis when thermal image URL changes
  useEffect(() => {
    if (!thermalImageUrl) return;
    if (loading) return; // respect external loading gate

    // If already analyzing this exact URL, skip.
    if (inFlightRef.current === thermalImageUrl) return;

    // If we've already successfully analyzed this URL in this component lifecycle, skip.
    if (analyzedImagesRef.current.has(thermalImageUrl)) return;

    // Mark as in-flight early to avoid race if effect fires twice quickly.
    inFlightRef.current = thermalImageUrl;
    setIsAnalyzing(true);
    setError(null);

    analyzeThermalImage()
      .then((data) => {
        analyzedImagesRef.current.add(thermalImageUrl);
        setAnalysisData(data);
        onAnalysisComplete?.(data);
      })
      .catch((err) => {
        console.error("Thermal analysis failed:", err.message);
        setError(`Failed to analyze thermal image: ${err.message}`);
      })
      .finally(() => {
        if (inFlightRef.current === thermalImageUrl) {
          inFlightRef.current = null;
        }
        setIsAnalyzing(false);
      });
  }, [thermalImageUrl, loading, analyzeThermalImage, onAnalysisComplete]);

  // Get the latest state of all detections for drawing
  const getLatestDetections = (): ActivityLogEntry[] => {
    if (!predictionSessions || predictionSessions.length === 0) {
      // If no activity log, show original AI detections
      return (
        analysisData?.issues.map(
          (issue, index) =>
            ({
              detectionId: index + 1,
              source: "AI_GENERATED",
              actionType: "ADDED",
              classId: getClassIdFromIssueType(issue.type),
              bboxX: issue.boundingBox.x,
              bboxY: issue.boundingBox.y,
              bboxW: issue.boundingBox.width,
              bboxH: issue.boundingBox.height,
              confidence: issue.confidence,
              createdAt: new Date().toISOString(),
              userName: "AI",
            } as ActivityLogEntry)
        ) || []
      );
    }

    // Build a comprehensive map to track all detection states
    const detectionStateMap = new Map<number, ActivityLogEntry>();
    const processedDetections = new Set<number>(); // Track which detections we've already included

    // Process all detections from all sessions to build latest state
    predictionSessions.forEach((session) => {
      session.detections.forEach((detection) => {
        if (detection.originalDetectionId) {
          // This is an EDITED or DELETED detection of an existing one
          const originalId = detection.originalDetectionId;
          detectionStateMap.set(originalId, detection);
          processedDetections.add(originalId); // Mark original as processed
        } else {
          // This is a new ADDED detection - only add if not already processed by an edit/delete
          if (!processedDetections.has(detection.detectionId)) {
            detectionStateMap.set(detection.detectionId, detection);
          }
        }
      });
    });

    const result: ActivityLogEntry[] = [];

    // First, handle original AI detections
    if (analysisData?.issues) {
      analysisData.issues.forEach((issue, index) => {
        const detectionId = index + 1; // Assuming AI detection IDs start from 1
        const latestState = detectionStateMap.get(detectionId);

        if (!latestState) {
          // Original AI detection unchanged
          result.push({
            detectionId: detectionId,
            source: "AI_GENERATED",
            actionType: "ADDED",
            classId: getClassIdFromIssueType(issue.type),
            bboxX: issue.boundingBox.x,
            bboxY: issue.boundingBox.y,
            bboxW: issue.boundingBox.width,
            bboxH: issue.boundingBox.height,
            confidence: issue.confidence,
            createdAt: new Date().toISOString(),
            userName: "AI",
          } as ActivityLogEntry);
        } else if (latestState.actionType !== "DELETED") {
          // Use edited version with fallback coordinates if needed
          result.push({
            ...latestState,
            bboxX: latestState.bboxX ?? issue.boundingBox.x,
            bboxY: latestState.bboxY ?? issue.boundingBox.y,
            bboxW: latestState.bboxW ?? issue.boundingBox.width,
            bboxH: latestState.bboxH ?? issue.boundingBox.height,
          });
        }
        // If DELETED, don't add to result
      });
    }

    // Then, handle all other detections (manually added ones)
    detectionStateMap.forEach((detection, detectionId) => {
      // Skip if this was already handled in the AI detections section
      const aiDetectionCount = analysisData?.issues?.length || 0;
      if (detectionId <= aiDetectionCount) {
        return; // Already processed above
      }

      // Only show the latest state if not deleted and has coordinates
      if (
        detection.actionType !== "DELETED" &&
        detection.bboxX !== undefined &&
        detection.bboxY !== undefined &&
        detection.bboxW !== undefined &&
        detection.bboxH !== undefined
      ) {
        result.push(detection);
      }
    });

    console.log("Latest detections for drawing:", {
      totalDetections: result.length,
      aiDetections: result.filter((d) => d.source === "AI_GENERATED").length,
      manualDetections: result.filter((d) => d.source === "MANUALLY_ADDED")
        .length,
      detectionStateMap: Array.from(detectionStateMap.entries()).map(
        ([id, det]) => ({
          id,
          action: det.actionType,
          source: det.source,
          originalId: det.originalDetectionId,
          hasCoords: !!(det.bboxX && det.bboxY && det.bboxW && det.bboxH),
        })
      ),
      resultIds: result.map((d) => d.detectionId),
    });

    return result;
  };

  // Helper function to map issue type to class ID
  const getClassIdFromIssueType = (issueType: string): number => {
    const typeToClassId: Record<string, number> = {
      "Point Overload (Faulty)": 0,
      "Loose Joint (Faulty)": 1,
      "Point Overload (Potential)": 2,
      "Loose Joint (Potential)": 3,
      "Full Wire Overload": 4,
    };
    return typeToClassId[issueType] ?? 0;
  };

  // Draw bounding boxes on canvas
  const drawBoundingBoxes = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get the actual displayed image dimensions from canvas
    const displayedImageWidth = canvas.width;
    const displayedImageHeight = canvas.height;

    // Get latest detection states
    const latestDetections = getLatestDetections();

    console.log("Drawing bounding boxes:", {
      canvasSize: { width: displayedImageWidth, height: displayedImageHeight },
      detectionsCount: latestDetections.length,
    });

    if (latestDetections.length === 0) return;

    // AI model processes images at 640x640, so coordinates are relative to that size
    const AI_MODEL_SIZE = 640;

    // Calculate scaling factors
    const scaleX = displayedImageWidth / AI_MODEL_SIZE;
    const scaleY = displayedImageHeight / AI_MODEL_SIZE;

    console.log("Scaling factors:", { scaleX, scaleY });

    // Filter detections based on selected filter (by fault class)
    const filteredDetections = latestDetections.filter((detection) => {
      if (selectedIssueFilter === "all") return true;
      const faultType = FAULT_TYPE_LABELS_MAP[detection.classId];
      return faultType === selectedIssueFilter;
    });

    // Draw bounding boxes
    filteredDetections.forEach((detection, index) => {
      // Detection uses bbox coordinates (x, y, w, h format)
      const x = detection.bboxX || 0;
      const y = detection.bboxY || 0;
      const width = detection.bboxW || 0;
      const height = detection.bboxH || 0;

      // Scale the coordinates to match the actual displayed image size
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;

      console.log(`Detection ${index + 1}:`, {
        detectionId: detection.detectionId,
        actionType: detection.actionType,
        original: { x, y, width, height },
        scaled: {
          x: scaledX,
          y: scaledY,
          width: scaledWidth,
          height: scaledHeight,
        },
        canvasBounds: {
          width: displayedImageWidth,
          height: displayedImageHeight,
        },
      });

      // Clamp coordinates to canvas bounds to prevent drawing outside
      const clampedX = Math.max(0, Math.min(scaledX, displayedImageWidth));
      const clampedY = Math.max(0, Math.min(scaledY, displayedImageHeight));
      const clampedWidth = Math.min(
        scaledWidth,
        displayedImageWidth - clampedX
      );
      const clampedHeight = Math.min(
        scaledHeight,
        displayedImageHeight - clampedY
      );

      // Skip drawing if the box is completely outside the canvas
      if (clampedWidth <= 0 || clampedHeight <= 0) {
        console.warn(`Skipping detection ${index + 1} - outside canvas bounds`);
        return;
      }

      // Determine color based on detection source and action type
      let color;
      if (detection.source === "AI_GENERATED") {
        color = "#2196f3"; // Blue for AI detections
      } else if (detection.source === "MANUALLY_ADDED") {
        color = "#4caf50"; // Green for manual detections
      } else {
        color = "#ff9800"; // Orange fallback
      }

      // Different styling for edited detections
      if (detection.actionType === "EDITED") {
        color = "#ff9800"; // Orange for edited
      }

      // Scale based on zoom level for consistent visual appearance
      const scaleFactor = 1 / currentScale;
      const boxLineWidth = Math.max(1, 2 * scaleFactor);
      const fontSize = Math.max(8, 10 * scaleFactor);
      const badgeSize = Math.max(12, 14 * scaleFactor);

      // Draw rectangle using clamped coordinates
      ctx.strokeStyle = color;
      ctx.lineWidth = boxLineWidth;
      ctx.strokeRect(clampedX, clampedY, clampedWidth, clampedHeight);

      // Draw filled background with transparency
      ctx.fillStyle = color + BOUNDING_BOX_OPACITY;
      ctx.fillRect(clampedX, clampedY, clampedWidth, clampedHeight);
      const detectionNumber = detection.detectionId.toString();

      // Draw small circular badge for number in top-left corner (using clamped coordinates)
      const badgeX = clampedX + badgeSize / 2;
      const badgeY = clampedY + badgeSize / 2;

      // Only draw badge if it's within canvas bounds
      if (badgeX <= displayedImageWidth && badgeY <= displayedImageHeight) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeSize / 2, 0, 2 * Math.PI);
        ctx.fill();

        // Draw white border around circle
        ctx.strokeStyle = "white";
        ctx.lineWidth = Math.max(0.5, 1 * scaleFactor);
        ctx.stroke();

        // Draw number text
        ctx.fillStyle = "white";
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(detectionNumber, badgeX, badgeY);

        // Reset text alignment for future drawings
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
      }
    });
  };

  // Effect to redraw bounding boxes when data changes
  useEffect(() => {
    if (analysisData && canvasRef.current) {
      drawBoundingBoxes();
    }
  }, [analysisData, predictionSessions, selectedIssueFilter, currentScale]);

  const filteredIssues =
    analysisData?.issues.filter(
      (issue) =>
        selectedIssueFilter === "all" || issue.type === selectedIssueFilter
    ) || [];

  // Annotation toolbar handlers
  const handleAddAnnotation = () => {
    setIsDrawingMode(true);
  };

  const handleCancelDrawing = () => {
    setIsDrawingMode(false);
  };

  const handleEditFinish = async () => {
    if (!predictionId) {
      setSnackbar({
        open: true,
        message: "No prediction found to finish editing session.",
        severity: "error",
      });
      return;
    }

    try {
      // Finish the current editing session
      const response = await fetch(
        `http://localhost:8080/api/predictions/${predictionId}/finish-editing`,
        {
          method: "POST",
          headers: {
            ...authService.getAuthHeader(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to finish editing session: ${response.status}`);
      }

      setSnackbar({
        open: true,
        message: "Editing session completed successfully!",
        severity: "success",
      });

      console.log("Editing session finished successfully");

      // Refresh activity log to show the completed session
      await fetchActivityLog();

      // Refresh analysis to show updated annotations before returning to comparison view
      analyzedImagesRef.current.delete(thermalImageUrl || "");
      if (thermalImageUrl) {
        setIsAnalyzing(true);
        try {
          const data = await analyzeThermalImage();
          setAnalysisData(data);
          onAnalysisComplete?.(data);
        } catch (err) {
          setError(
            `Failed to refresh analysis: ${
              err instanceof Error ? err.message : "Unknown error"
            }`
          );
        } finally {
          setIsAnalyzing(false);
        }
      }
    } catch (error) {
      console.error("Failed to finish editing session:", error);
      setSnackbar({
        open: true,
        message: `Failed to finish editing session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        severity: "error",
      });
    }

    setIsDrawingMode(false); // Exit drawing mode and return to comparison view
  };

  const handleSaveDrawing = async (
    box: { x: number; y: number; width: number; height: number },
    faultType: string,
    comments: string
  ) => {
    if (!predictionId) {
      setSnackbar({
        open: true,
        message: "No prediction found. Please run thermal analysis first.",
        severity: "error",
      });
      return;
    }

    console.log("Saving manual annotation:", {
      box,
      faultType,
      comments,
      predictionId,
    });

    try {
      // Map fault type to class_id
      const faultTypeToClassId: Record<string, number> = {
        "Loose Joint (Faulty)": 1,
        "Loose Joint (Potential)": 3,
        "Point Overload (Faulty)": 0,
        "Point Overload (Potential)": 2,
        "Full Wire Overload": 4,
      };

      const classId = faultTypeToClassId[faultType];

      if (classId === undefined) {
        throw new Error(`Unknown fault type: ${faultType}`);
      }

      // Call backend API to save manual annotation
      const response = await fetch("http://localhost:8080/api/detections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authService.getAuthHeader(),
        },
        body: JSON.stringify({
          predictionId: predictionId,
          classId: classId,
          confidence: 1.0,
          x1: Math.round(box.x),
          y1: Math.round(box.y),
          x2: Math.round(box.x + box.width),
          y2: Math.round(box.y + box.height),
          comments: comments || null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to save annotation: ${response.status} ${errorText}`
        );
      }

      const savedAnnotation = await response.json();
      console.log("Annotation saved successfully:", savedAnnotation);

      // Show success snackbar instead of alert
      setSnackbar({
        open: true,
        message: `Manual annotation saved successfully!`,
        severity: "success",
      });

      // Exit drawing mode
      setIsDrawingMode(false);

      // Refresh activity log immediately after saving
      await fetchActivityLog();

      // Refresh analysis to show new annotation
      analyzedImagesRef.current.delete(thermalImageUrl || "");
      if (thermalImageUrl) {
        setIsAnalyzing(true);
        analyzeThermalImage()
          .then((data) => {
            setAnalysisData(data);
            onAnalysisComplete?.(data);
          })
          .catch((err) => {
            setError(`Failed to refresh analysis: ${err.message}`);
          })
          .finally(() => {
            setIsAnalyzing(false);
          });
      }
    } catch (error) {
      console.error("Failed to save annotation:", error);
      // Show error snackbar instead of alert
      setSnackbar({
        open: true,
        message: `Failed to save annotation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        severity: "error",
      });
    }
  };

  // Snackbar close handler
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Extract predictionId from analysisData
  const predictionId = analysisData?.predictionId;

  // Extract fetchActivityLog as a separate function for reusability
  const fetchActivityLog = useCallback(async () => {
    if (!predictionId) return;

    setLoadingActivityLog(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/predictions/${predictionId}/activity-log`,
        {
          headers: authService.getAuthHeader(),
        }
      );

      if (response.ok) {
        const data: PredictionSession[] = await response.json();
        setPredictionSessions(data);
        console.log("Prediction sessions refreshed:", data.length, "sessions");
      }
    } catch (err) {
      console.error("Failed to fetch activity log:", err);
    } finally {
      setLoadingActivityLog(false);
    }
  }, [predictionId]);

  // Fetch activity log when predictionId is available
  useEffect(() => {
    fetchActivityLog();
  }, [fetchActivityLog]);

  // Filter prediction sessions based on selected filter
  const filteredSessions = predictionSessions.filter((session) => {
    if (activityLogFilter === "ai") {
      return session.sessionType === "AI_ANALYSIS";
    }
    if (activityLogFilter === "manual") {
      return session.sessionType === "MANUAL_EDITING";
    }
    return true; // "all" shows all sessions
  });

  // Get total detection count for display
  const totalDetections = filteredSessions.reduce((total, session) => {
    return total + session.detections.length;
  }, 0);

  // Get count of active and deleted detections separately
  const activeDetections = filteredSessions.reduce((total, session) => {
    return (
      total +
      session.detections.filter((d) => d.actionType !== "DELETED").length
    );
  }, 0);

  const deletedDetections = filteredSessions.reduce((total, session) => {
    return (
      total +
      session.detections.filter((d) => d.actionType === "DELETED").length
    );
  }, 0);

  // Manual refresh handler for activity log
  const handleRefreshActivityLog = () => {
    fetchActivityLog();
  };

  // Toggle session expansion
  const toggleSessionExpansion = (sessionId: number) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  // Export functions
  const exportToJSON = () => {
    const exportData = filteredSessions.flatMap((session) =>
      session.detections
        .filter((d) => {
          if (activityLogFilter === "deleted")
            return d.actionType === "DELETED";
          if (activityLogFilter === "all") return true;
          if (activityLogFilter === "ai")
            return session.sessionType === "AI_ANALYSIS";
          if (activityLogFilter === "manual")
            return session.sessionType === "MANUAL_EDITING";
          return d.actionType !== "DELETED"; // default: show active only
        })
        .map((entry) => ({
          sessionId: session.predictionId,
          sessionType: session.sessionType,
          sessionUserName: session.userName,
          detectionId: entry.detectionId,
          originalDetectionId: entry.originalDetectionId || "N/A",
          source: entry.source,
          actionType: entry.actionType,
          faultClass: FAULT_TYPE_LABELS_MAP[entry.classId] || "Unknown",
          faultClassId: entry.classId,
          confidence: entry.source === "AI_GENERATED" ? "N/A" : "Manual",
          userName: entry.userName,
          userId: entry.userId || "N/A",
          comments: entry.comments || "",
          timestamp: new Date(entry.createdAt).toISOString(),
          inspectionId: inspectionId,
          transformerNo: transformerNo,
        }))
    );

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `activity-log-${transformerNo || "unknown"}-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSnackbar({
      open: true,
      message: "Activity log exported as JSON successfully!",
      severity: "success",
    });
  };

  const exportToCSV = () => {
    const headers = [
      "Session ID",
      "Session Type",
      "Session User",
      "Detection ID",
      "Original Detection ID",
      "Source",
      "Action Type",
      "Fault Class",
      "Fault Class ID",
      "User Name",
      "User ID",
      "Comments",
      "Timestamp",
      "Inspection ID",
      "Transformer No",
    ];

    const rows = filteredSessions.flatMap((session) =>
      session.detections
        .filter((d) => {
          if (activityLogFilter === "deleted")
            return d.actionType === "DELETED";
          if (activityLogFilter === "all") return true;
          if (activityLogFilter === "ai")
            return session.sessionType === "AI_ANALYSIS";
          if (activityLogFilter === "manual")
            return session.sessionType === "MANUAL_EDITING";
          return d.actionType !== "DELETED"; // default: show active only
        })
        .map((entry) => [
          session.predictionId,
          session.sessionType,
          session.userName,
          entry.detectionId,
          entry.originalDetectionId || "N/A",
          entry.source,
          entry.actionType,
          FAULT_TYPE_LABELS_MAP[entry.classId] || "Unknown",
          entry.classId,
          entry.userName,
          entry.userId || "N/A",
          entry.comments ? `"${entry.comments.replace(/"/g, '""')}"` : "",
          new Date(entry.createdAt).toISOString(),
          inspectionId || "N/A",
          transformerNo || "N/A",
        ])
    );

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const dataBlob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `activity-log-${transformerNo || "unknown"}-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSnackbar({
      open: true,
      message: "Activity log exported as CSV successfully!",
      severity: "success",
    });
  };

  return (
    <Box>
      {/* annotations error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Drawing Mode - Replace thermal image with DrawingCanvas */}
      {isDrawingMode && thermalImageUrl ? (
        <Paper sx={{ p: 2.5, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Draw Bounding Box
          </Typography>

          <DrawingCanvas
            imageUrl={thermalImageUrl}
            onSave={handleSaveDrawing}
            onCancel={handleCancelDrawing}
            onEditFinish={handleEditFinish}
            onEditSave={fetchActivityLog}
            isActive={isDrawingMode}
            predictionId={predictionId}
            existingDetections={getLatestDetections()}
          />
        </Paper>
      ) : (
        /* Main Analysis Display - Only show when NOT in drawing mode */
        <>
          <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            gap={3}
          >
            {/* Baseline Image */}
            <Box flex={1}>
              <Paper sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Baseline Image
                </Typography>
                <Box mt={2} sx={{ position: "relative" }}>
                  {baselineImageUrl ? (
                    <ZoomableImage
                      src={baselineImageUrl}
                      alt="Baseline"
                      maxHeight={300}
                    />
                  ) : (
                    <Typography color="text.secondary">
                      No baseline image available
                    </Typography>
                  )}
                </Box>

                {/* Baseline Image Controls */}
                <Box mt={2} display="flex" justifyContent="flex-end">
                  <Tooltip title="Reupload" arrow>
                    <IconButton size="small" sx={{ color: "primary.main" }}>
                      <UploadIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            </Box>

            {/* Thermal Image with Analysis */}
            <Box flex={1}>
              <Paper sx={{ p: 2.5 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    Maintenance Image Analysis
                  </Typography>
                </Box>

                <Box sx={{ position: "relative" }}>
                  {isAnalyzing ? (
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      minHeight={200}
                    >
                      <CircularProgress />
                      <Typography ml={2}>Analyzing thermal image...</Typography>
                    </Box>
                  ) : error ? (
                    <Alert severity="error">{error}</Alert>
                  ) : thermalImageUrl ? (
                    <ZoomableImage
                      src={thermalImageUrl}
                      alt="Thermal"
                      maxHeight={300}
                      canvasRef={canvasRef}
                      onImageLoad={drawBoundingBoxes}
                      onScaleChange={setCurrentScale}
                    />
                  ) : (
                    <Typography color="text.secondary">
                      No thermal image available
                    </Typography>
                  )}
                </Box>

                {/* Analysis Controls */}
                {analysisData && (
                  <Box mt={2}>
                    <Box
                      display="flex"
                      gap={1}
                      alignItems="center"
                      flexWrap="wrap"
                      justifyContent="space-between"
                    >
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={selectedIssueFilter}
                          onChange={(e) =>
                            setSelectedIssueFilter(e.target.value)
                          }
                          startAdornment={
                            <FilterListIcon sx={{ mr: 1, fontSize: 16 }} />
                          }
                        >
                          <MenuItem value="all">All Issues</MenuItem>
                          {Object.keys(ISSUE_TYPE_LABELS).map((type) => (
                            <MenuItem key={type} value={type}>
                              {ISSUE_TYPE_LABELS[type]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Typography variant="caption" color="text.secondary">
                        {filteredIssues.length} of {analysisData.issues.length}{" "}
                        issues shown
                      </Typography>

                      <Box display="flex" gap={0.5} alignItems="center">
                        <Tooltip title="Reupload" arrow>
                          <IconButton
                            size="small"
                            sx={{ color: "primary.main" }}
                          >
                            <UploadIcon />
                          </IconButton>
                        </Tooltip>

                        {/* MODIFIED: Edit button triggers drawing mode */}
                        <Tooltip title="Add manual annotations" arrow>
                          <IconButton
                            size="small"
                            sx={{ color: "primary.main" }}
                            onClick={handleAddAnnotation}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Box>
          </Box>

          {/* Analysis Log */}
          {analysisData && (
            <Paper sx={{ p: 2.5, mt: 3 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  Activity Log ({totalDetections} total: {activeDetections}{" "}
                  active, {deletedDetections} deleted)
                </Typography>

                <Box display="flex" gap={1} alignItems="center">
                  {/* ADD: Export buttons */}
                  <Tooltip title="Export as JSON" arrow>
                    <IconButton
                      size="small"
                      onClick={exportToJSON}
                      disabled={totalDetections === 0}
                      sx={{ color: "primary.main" }}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Export as CSV" arrow>
                    <IconButton
                      size="small"
                      onClick={exportToCSV}
                      disabled={totalDetections === 0}
                      sx={{ color: "primary.main" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Refresh activity log" arrow>
                    <IconButton
                      size="small"
                      onClick={handleRefreshActivityLog}
                      disabled={loadingActivityLog}
                      sx={{ color: "primary.main" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                      </svg>
                    </IconButton>
                  </Tooltip>

                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                      value={activityLogFilter}
                      onChange={(e) => setActivityLogFilter(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="all">All Active</MenuItem>
                      <MenuItem value="ai">AI Only</MenuItem>
                      <MenuItem value="manual">Manual Only</MenuItem>
                      <MenuItem value="deleted">Deleted Only</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {loadingActivityLog ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : totalDetections === 0 ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <Typography variant="body2" color="text.secondary">
                    No{" "}
                    {activityLogFilter === "all"
                      ? ""
                      : activityLogFilter === "ai"
                      ? "AI"
                      : "manual"}{" "}
                    detections found
                  </Typography>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                  {filteredSessions.map((session) => (
                    <Card
                      key={session.predictionId}
                      variant="outlined"
                      sx={{
                        bgcolor:
                          session.sessionType === "AI_ANALYSIS"
                            ? "#E3F2FD"
                            : "#FFF3E0",
                        borderLeft: 4,
                        borderLeftColor:
                          session.sessionType === "AI_ANALYSIS"
                            ? "#2196f3"
                            : "#ff9800",
                      }}
                    >
                      <CardContent
                        sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}
                      >
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ cursor: "pointer" }}
                          onClick={() =>
                            toggleSessionExpansion(session.predictionId)
                          }
                        >
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={
                                session.sessionType === "AI_ANALYSIS"
                                  ? "AI Analysis"
                                  : "Manual Editing"
                              }
                              size="small"
                              color={
                                session.sessionType === "AI_ANALYSIS"
                                  ? "info"
                                  : "warning"
                              }
                              sx={{ fontWeight: 600 }}
                            />
                            <Typography variant="body2" fontWeight={600}>
                              {session.userName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              ({session.detections.length} detections)
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(session.createdAt).toLocaleString()}
                            </Typography>
                            {expandedSessions.has(session.predictionId) ? (
                              <ExpandLess />
                            ) : (
                              <ExpandMore />
                            )}
                          </Box>
                        </Box>

                        {/* Expandable content */}
                        {expandedSessions.has(session.predictionId) && (
                          <Box mt={2}>
                            {session.detections.map((detection) => (
                              <Card
                                key={detection.detectionId}
                                variant="outlined"
                                sx={{
                                  mb: 1,
                                  ml: 2,
                                  bgcolor:
                                    detection.actionType === "DELETED"
                                      ? "rgba(244, 67, 54, 0.05)"
                                      : "background.default",
                                  borderColor:
                                    detection.actionType === "DELETED"
                                      ? "error.light"
                                      : "divider",
                                  opacity:
                                    detection.actionType === "DELETED"
                                      ? 0.7
                                      : 1,
                                }}
                              >
                                <CardContent
                                  sx={{
                                    py: 1,
                                    px: 1.5,
                                    "&:last-child": { pb: 1 },
                                  }}
                                >
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                  >
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      gap={1}
                                    >
                                      <Chip
                                        label={detection.actionType}
                                        size="small"
                                        variant="outlined"
                                        color={
                                          detection.actionType === "DELETED"
                                            ? "error"
                                            : detection.actionType === "EDITED"
                                            ? "warning"
                                            : "default"
                                        }
                                      />
                                      <Typography
                                        variant="body2"
                                        fontWeight={500}
                                      >
                                        {FAULT_TYPE_LABELS_MAP[
                                          detection.classId
                                        ] || "Unknown"}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="primary.main"
                                        sx={{ fontWeight: 600 }}
                                      >
                                        ID: {detection.detectionId}
                                        {detection.originalDetectionId && (
                                          <span style={{ color: "orange" }}>
                                            {" "}
                                            (orig:{" "}
                                            {detection.originalDetectionId})
                                          </span>
                                        )}
                                      </Typography>
                                    </Box>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {new Date(
                                        detection.createdAt
                                      ).toLocaleString()}
                                    </Typography>
                                  </Box>

                                  {detection.comments && (
                                    <Box mt={0.5}>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        <strong>Comments:</strong>{" "}
                                        {detection.comments}
                                      </Typography>
                                    </Box>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          )}
        </>
      )}

      {/* Snackbar notification at the end of the component */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ThermalImageAnalysis;
