import React, { useState, useEffect, useRef } from "react";
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
  Collapse,
  CardActions,
  Button,
  TextField,
  Divider,
  Tooltip,
  Snackbar,
} from "@mui/material";
import {
  FilterList as FilterListIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterFocusStrongIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Comment as CommentIcon,
  Person as PersonIcon,
  Timer as TimerIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";
import { authService } from "../services/authService";
// import AnnotationToolbar from "./AnnotationToolbar";
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
  predictionId?: number; // ADD THIS LINE
}

interface ThermalImageAnalysisProps {
  thermalImageUrl?: string;
  baselineImageUrl?: string;
  onAnalysisComplete?: (analysis: ThermalAnalysisData) => void;
  loading?: boolean;
  transformerNo?: string;
  inspectionId?: number; // Add inspectionId prop
}

const SEVERITY_COLORS = {
  warning: "#ff9800",
  critical: "#f44336",
};

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
  const [isLogExpanded, setIsLogExpanded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [selectedLogEntry, setSelectedLogEntry] =
    useState<string>("ai-analysis");

  // const [showAiPredictions, setShowAiPredictions] = React.useState(true);
  // const [showManualAnnotations, setShowManualAnnotations] = React.useState(true);
  // const [isEditMode, setIsEditMode] = React.useState(false);
  // const [isDeleteMode, setIsDeleteMode] = React.useState(false);

  const [isDrawingMode, setIsDrawingMode] = useState(false); // NEW: Drawing mode state

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
  // Track which image URLs have already triggered an analysis to avoid
  // duplicate calls (e.g., React StrictMode double effect invocation or
  // parent prop identity changes). Also track an in-flight request to
  // prevent overlap.
  const analyzedImagesRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<string | null>(null);

  // Mock counts (will be replaced with real data from backend later)
  // const aiPredictionsCount = analysisData?.issues.length || 0;
  // const manualAnnotationsCount = 0; // Will fetch from backend

  // API call to analyze thermal image
  const analyzeThermalImage = async (): Promise<ThermalAnalysisData> => {
    if (!transformerNo) {
      console.warn(
        "ThermalImageAnalysis: transformerNo not provided; prediction persistence will be skipped on backend."
      );
    }

    // Use direct backend URL to avoid proxy issues
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
          inspectionId, // Include inspectionId in request
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `Analysis failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""
          }`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Thermal analysis error:", error);
      throw error;
    }
  };

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
  }, [thermalImageUrl, loading]);

  // Draw bounding boxes on canvas
  const drawBoundingBoxes = () => {
    const canvas = canvasRef.current;

    if (!canvas || !analysisData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Only draw if AI predictions are visible
    // if (!showAiPredictions) return;

    // Get the actual displayed image dimensions from canvas
    const displayedImageWidth = canvas.width;
    const displayedImageHeight = canvas.height;

    console.log("Drawing bounding boxes:", {
      canvasSize: { width: displayedImageWidth, height: displayedImageHeight },
      issuesCount: analysisData.issues.length,
    });

    // AI model processes images at 640x640, so coordinates are relative to that size
    const AI_MODEL_SIZE = 640;

    // Calculate scaling factors
    const scaleX = displayedImageWidth / AI_MODEL_SIZE;
    const scaleY = displayedImageHeight / AI_MODEL_SIZE;

    console.log("Scaling factors:", { scaleX, scaleY });

    // Filter issues based on selected filter
    const filteredIssues = analysisData.issues.filter(
      (issue) =>
        selectedIssueFilter === "all" || issue.type === selectedIssueFilter
    );

    // Draw bounding boxes
    filteredIssues.forEach((issue, index) => {
      const { x, y, width, height } = issue.boundingBox;

      // Scale the coordinates to match the actual displayed image size
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;

      console.log(`Issue ${index + 1}:`, {
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
        console.warn(`Skipping issue ${index + 1} - outside canvas bounds`);
        return;
      }

      const color =
        SEVERITY_COLORS[issue.severity as keyof typeof SEVERITY_COLORS] ||
        "#ff9800"; // fallback to warning color

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

      // Draw small number in top-left corner
      const originalIndex = analysisData.issues.findIndex(
        (i) => i.id === issue.id
      );
      const issueNumber = (originalIndex + 1).toString();

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
        ctx.fillText(issueNumber, badgeX, badgeY);

        // Reset text alignment for future drawings
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
      }
    });
  };

  // Update canvas when image loads or bounding box settings change
  // useEffect(() => {
  //   drawBoundingBoxes();
  // }, [analysisData, selectedIssueFilter, currentScale, showAiPredictions]);

  const filteredIssues =
    analysisData?.issues.filter(
      (issue) =>
        selectedIssueFilter === "all" || issue.type === selectedIssueFilter
    ) || [];

  // NEW: Annotation toolbar handlers
  const handleAddAnnotation = () => {
    setIsDrawingMode(true);
    // setIsEditMode(false);
    // setIsDeleteMode(false);
  };

  const handleCancelDrawing = () => {
    setIsDrawingMode(false);
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

    console.log("Saving manual annotation:", { box, faultType, comments, predictionId });

    try {
      // Map fault type to class_id
      const faultTypeToClassId: Record<string, number> = {
        'Loose Joint (Faulty)': 1,
        'Loose Joint (Potential)': 3,
        'Point Overload (Faulty)': 0,
        'Point Overload (Potential)': 2,
        'Full Wire Overload': 4,
      };

      const classId = faultTypeToClassId[faultType];

      if (classId === undefined) {
        throw new Error(`Unknown fault type: ${faultType}`);
      }

      // Call backend API to save manual annotation
      const response = await fetch('http://localhost:8080/api/detections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        throw new Error(`Failed to save annotation: ${response.status} ${errorText}`);
      }

      const savedAnnotation = await response.json();
      console.log('Annotation saved successfully:', savedAnnotation);

      // REPLACE: Show success snackbar instead of alert
      setSnackbar({
        open: true,
        message: `Manual annotation saved successfully!`,
        severity: "success",
      });

      // Exit drawing mode and return to analysis view
      setIsDrawingMode(false);

      // Refresh analysis to show new annotation
      analyzedImagesRef.current.delete(thermalImageUrl || '');
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
      // REPLACE: Show error snackbar instead of alert
      setSnackbar({
        open: true,
        message: `Failed to save annotation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: "error",
      });
    }
  };

  // const handleEditMode = () => {
  //   setIsEditMode(!isEditMode);
  //   setIsDeleteMode(false);
  //   console.log("Edit mode:", !isEditMode);
  // };

  // const handleDeleteMode = () => {
  //   setIsDeleteMode(!isDeleteMode);
  //   setIsEditMode(false);
  //   console.log("Delete mode:", !isDeleteMode);
  // };

  // const handleExportFeedback = () => {
  //   console.log("Export feedback clicked");
  //   alert("Export functionality will be implemented next");
  // };

  // const handleRefresh = () => {
  //   console.log("Refresh annotations clicked");
  //   // Re-trigger analysis
  //   if (thermalImageUrl) {
  //     analyzedImagesRef.current.delete(thermalImageUrl);
  //     setIsAnalyzing(true);
  //     analyzeThermalImage()
  //       .then((data) => {
  //         setAnalysisData(data);
  //         onAnalysisComplete?.(data);
  //       })
  //       .catch((err) => {
  //         setError(`Failed to analyze thermal image: ${err.message}`);
  //       })
  //       .finally(() => {
  //         setIsAnalyzing(false);
  //       });
  //   }
  // };

  // ADD: Snackbar close handler
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // ADD THIS LINE - Extract predictionId from analysisData
  const predictionId = analysisData?.predictionId;

  return (
    <Box>
      {/* REMOVED: Annotation Toolbar - Only show when in drawing mode now */}
      {/* The toolbar will be shown inside the DrawingCanvas component */}

      {/* Existing: annotations error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* NEW: Drawing Mode - Replace thermal image with DrawingCanvas */}
      {isDrawingMode && thermalImageUrl ? (
        <Paper sx={{ p: 2.5, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Draw Bounding Box
          </Typography>

          {/* Show annotation toolbar in drawing mode */}
          {/* {inspectionId && (
            <AnnotationToolbar
              aiPredictionsCount={aiPredictionsCount}
              manualAnnotationsCount={manualAnnotationsCount}
              showAiPredictions={showAiPredictions}
              showManualAnnotations={showManualAnnotations}
              onToggleAiPredictions={() => setShowAiPredictions(!showAiPredictions)}
              onToggleManualAnnotations={() => setShowManualAnnotations(!showManualAnnotations)}
              onAddAnnotation={handleAddAnnotation}
              onEditMode={handleEditMode}
              onDeleteMode={handleDeleteMode}
              onExportFeedback={handleExportFeedback}
              onRefresh={handleRefresh}
              isEditMode={isEditMode}
              isDeleteMode={isDeleteMode}
              disabled={isAnalyzing || loading}
            />
          )} */}

          <DrawingCanvas
            imageUrl={thermalImageUrl}
            onSave={handleSaveDrawing}
            onCancel={handleCancelDrawing}
            isActive={isDrawingMode}
            predictionId={predictionId}
          />
        </Paper>
      ) : (
        /* Existing: Main Analysis Display - Only show when NOT in drawing mode */
        <>
          <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3}>
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
                          onChange={(e) => setSelectedIssueFilter(e.target.value)}
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
                          <IconButton size="small" sx={{ color: "primary.main" }}>
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
                  Activity Log
                </Typography>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    value={selectedLogEntry}
                    onChange={(e) => setSelectedLogEntry(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="all">All Entries</MenuItem>
                    <MenuItem value="ai-analysis">
                      AI Analysis -{" "}
                      {new Date(
                        analysisData.analysisTimestamp
                      ).toLocaleDateString()}
                    </MenuItem>
                    {/* Future log entries can be added here */}
                  </Select>
                </FormControl>
              </Box>

              {/* AI Analysis Log Entry */}
              {(selectedLogEntry === "ai-analysis" ||
                selectedLogEntry === "all") && (
                <Card
                  variant="outlined"
                  sx={{
                    bgcolor: "#f8f9fa",
                    borderLeft: 4,
                    borderLeftColor: "#2196f3",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: 2,
                    },
                  }}
                >
                  <CardContent sx={{ py: 1.5, px: 2, pb: 0.5 }}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      mb={1}
                    >
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          color="primary"
                        >
                          AI Analysis
                        </Typography>
                        <Chip
                          label="COMPLETED"
                          size="small"
                          color="success"
                          variant="filled"
                          sx={{ fontSize: 9, height: 18, fontWeight: 600 }}
                        />
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(
                            analysisData.analysisTimestamp
                          ).toLocaleDateString()}{" "}
                          {new Date(
                            analysisData.analysisTimestamp
                          ).toLocaleTimeString()}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setIsLogExpanded(!isLogExpanded)}
                          sx={{ color: "primary.main" }}
                        >
                          {isLogExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>

                  {/* Expandable Metadata Section */}
                  <Collapse in={isLogExpanded} timeout="auto" unmountOnExit>
                    <Divider />
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Box display="flex" flexDirection="column" gap={1}>
                        {/* Detailed Issues */}
                        <Box>
                          <Box
                            display="flex"
                            flexDirection="column"
                            gap={0.25}
                            mt={0.25}
                          >
                            {analysisData.issues.map((issue, index) => {
                              // Light color variants for the cards
                              const lightColors = {
                                warning: "#fff3e0", // Light orange
                                critical: "#ffebee", // Light red
                              };

                              const borderColors = {
                                warning: "#ffb74d", // Medium orange
                                critical: "#ef5350", // Medium red
                              };

                              return (
                                <Card
                                  key={issue.id}
                                  variant="outlined"
                                  sx={{
                                    bgcolor:
                                      lightColors[
                                        issue.severity as keyof typeof lightColors
                                      ] || "#f5f5f5",
                                    borderLeft: 2,
                                    borderLeftColor:
                                      borderColors[
                                        issue.severity as keyof typeof borderColors
                                      ] || "#ff9800",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                      boxShadow: 1,
                                      transform: "translateY(-1px)",
                                    },
                                  }}
                                >
                                  <CardContent
                                    sx={{
                                      py: 0.75,
                                      px: 1.25,
                                      "&:last-child": { pb: 0.75 },
                                    }}
                                  >
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      gap={0.75}
                                    >
                                      {/* Issue Number Badge */}
                                      <Box
                                        sx={{
                                          width: 18,
                                          height: 18,
                                          borderRadius: "50%",
                                          bgcolor:
                                            borderColors[
                                              issue.severity as keyof typeof borderColors
                                            ] || "#ff9800",
                                          color: "white",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontSize: 9,
                                          fontWeight: 700,
                                          boxShadow: 1,
                                        }}
                                      >
                                        {index + 1}
                                      </Box>

                                      {/* Issue Info */}
                                      <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={0.5}
                                        flex={1}
                                      >
                                        <Typography
                                          variant="caption"
                                          fontWeight={600}
                                          flex={1}
                                          sx={{ fontSize: 12 }}
                                        >
                                          {ISSUE_TYPE_LABELS[issue.type] ||
                                            issue.type}
                                        </Typography>
                                        <Chip
                                          label={`${Math.round(
                                            issue.confidence * 100
                                          )}%`}
                                          size="small"
                                          color={
                                            issue.confidence > 0.8
                                              ? "success"
                                              : issue.confidence > 0.6
                                              ? "warning"
                                              : "default"
                                          }
                                          variant="filled"
                                          sx={{
                                            fontWeight: 600,
                                            height: 16,
                                            fontSize: 8,
                                          }}
                                        />
                                        <Chip
                                          label={issue.severity.toUpperCase()}
                                          size="small"
                                          color={
                                            issue.severity === "critical"
                                              ? "error"
                                              : "warning"
                                          }
                                          variant="outlined"
                                          sx={{
                                            fontSize: 7,
                                            height: 14,
                                            fontWeight: 600,
                                            ml: 0.5,
                                          }}
                                        />
                                      </Box>
                                    </Box>

                                    {/* Issue Description */}
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{
                                        ml: 2.25,
                                        lineHeight: 1.1,
                                        fontSize: 9,
                                        display: "block",
                                        mt: 0.125,
                                      }}
                                    >
                                      {issue.description}
                                    </Typography>

                                    {/* Bounding Box Location */}
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{
                                        ml: 2.25,
                                        lineHeight: 1.1,
                                        fontSize: 8,
                                        display: "block",
                                        fontStyle: "italic",
                                        mt: 0.125,
                                      }}
                                    >
                                      AI Model Coordinates: ({issue.boundingBox.x},{" "}
                                      {issue.boundingBox.y}) -{" "}
                                      {issue.boundingBox.width}×
                                      {issue.boundingBox.height}px (640×640 basis)
                                    </Typography>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </Box>
                        </Box>

                        {/* Permissions & Access */}
                        <Box>
                          <Box display="flex" gap={1} mt={0.25} alignItems="center">
                            <PersonIcon
                              sx={{ fontSize: 14, color: "text.secondary" }}
                            />
                            <Typography variant="caption" sx={{ fontSize: 11 }}>
                              <strong>Created by:</strong> AI System (Auto-analysis)
                            </Typography>
                          </Box>
                          <Box display="flex" gap={1} mt={0.25} alignItems="center">
                            <TimerIcon
                              sx={{ fontSize: 14, color: "text.secondary" }}
                            />
                            <Typography variant="caption" sx={{ fontSize: 11 }}>
                              <strong>Processing Time:</strong>{" "}
                              {analysisData.processingTime}ms
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Collapse>

                  {/* Action Buttons */}
                  <CardActions sx={{ px: 2, py: 1, bgcolor: "rgba(0,0,0,0.02)" }}>
                    <Button
                      size="small"
                      startIcon={<CommentIcon />}
                      onClick={() =>
                        setNewComment(newComment ? "" : "Add your comment...")
                      }
                      sx={{ textTransform: "none" }}
                    >
                      Add Comment
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      Log ID: {analysisData.analysisTimestamp.slice(-8)}
                    </Typography>
                  </CardActions>

                  {/* Comment Input */}
                  {newComment && (
                    <Box sx={{ px: 2.5, pb: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Add your comment about this analysis..."
                        value={
                          newComment === "Add your comment..." ? "" : newComment
                        }
                        onChange={(e) => setNewComment(e.target.value)}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                      <Box display="flex" gap={1} mt={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          onClick={() => setNewComment("")}
                          sx={{ textTransform: "none" }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            // Handle comment submission here
                            console.log("Comment submitted:", newComment);
                            setNewComment("");
                          }}
                          sx={{ textTransform: "none" }}
                        >
                          Post Comment
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Card>
              )}

              {/* Future log entries can be added here with similar conditional rendering */}
              {/* Example:
          {selectedLogEntry === "manual-inspection" && (
            <Card>Manual Inspection Log Content</Card>
          )}
          */}
            </Paper>
          )}
        </>
      )}

      {/* ADD: Snackbar notification at the end of the component */}
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
