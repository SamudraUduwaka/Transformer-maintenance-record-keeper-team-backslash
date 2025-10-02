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
} from "@mui/material";
import {
  FilterList as FilterListIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterFocusStrongIcon,
} from "@mui/icons-material";

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
}

interface ThermalImageAnalysisProps {
  thermalImageUrl?: string;
  baselineImageUrl?: string;
  onAnalysisComplete?: (analysis: ThermalAnalysisData) => void;
  loading?: boolean;
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

/* ZoomableImage component with zoom and pan functionality */
interface ZoomableImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  maxHeight?: number;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  onImageLoad?: () => void;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({
  src,
  alt,
  style,
  maxHeight = 400,
  canvasRef,
  onImageLoad,
}) => {
  const [scale, setScale] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev / 1.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
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
    setScale((prev) => Math.min(Math.max(prev * delta, 0.5), 5));
  };

  const handleImageLoad = () => {
    if (imageRef.current && canvasRef?.current) {
      // Set canvas dimensions BEFORE any context acquisition or drawing
      canvasRef.current.width = imageRef.current.naturalWidth;
      canvasRef.current.height = imageRef.current.naturalHeight;
      // If you have drawing logic or context acquisition, do it after setting dimensions
      // Example:
      // const ctx = canvasRef.current.getContext("2d");
      // ...drawing logic here...
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
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? "none" : "transform 0.2s ease",
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
        <IconButton size="small" onClick={handleZoomIn} disabled={scale >= 5}>
          <ZoomInIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={handleZoomOut}
          disabled={scale <= 0.5}
        >
          <ZoomOutIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={handleReset}>
          <CenterFocusStrongIcon fontSize="small" />
        </IconButton>
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
}) => {
  const [analysisData, setAnalysisData] = useState<ThermalAnalysisData | null>(
    null
  );
  const [selectedIssueFilter, setSelectedIssueFilter] = useState<string>("all");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // API call to analyze thermal image
  const analyzeThermalImage = async (
    imageUrl: string
  ): Promise<ThermalAnalysisData> => {
    // Try relative URL first (with proxy), then fall back to direct URL
    const apiUrls = [
      "/api/images/thermal-analysis",
      "http://localhost:8080/api/images/thermal-analysis",
    ];

    let lastError: Error | null = null;

    for (const apiUrl of apiUrls) {
      try {
        console.log(`Trying thermal analysis API call to: ${apiUrl}`);
        console.log("Request payload:", { imageUrl, analysisType: "thermal" });

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: imageUrl,
            analysisType: "thermal",
          }),
        });

        console.log(`API Response from ${apiUrl} - status:`, response.status);
        console.log(`API Response statusText:`, response.statusText);

        if (!response.ok) {
          throw new Error(
            `Analysis failed: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("API Response data:", data);
        return data;
      } catch (error) {
        console.warn(`Failed to connect to ${apiUrl}:`, error);
        lastError = error as Error;
        // Continue to try next URL
      }
    }

    // If all URLs failed, throw the last error
    throw lastError || new Error("All API endpoints failed");
  };

  // Trigger analysis when thermal image URL changes
  useEffect(() => {
    if (thermalImageUrl && !loading) {
      setIsAnalyzing(true);
      setError(null);

      analyzeThermalImage(thermalImageUrl)
        .then((data) => {
          setAnalysisData(data);
          onAnalysisComplete?.(data);
        })
        .catch((err) => {
          console.error("Thermal analysis failed:", err.message);
          setError(`Failed to analyze thermal image: ${err.message}`);
        })
        .finally(() => {
          setIsAnalyzing(false);
        });
    }
  }, [thermalImageUrl, loading, onAnalysisComplete]);

  // Draw bounding boxes on canvas
  const drawBoundingBoxes = () => {
    const canvas = canvasRef.current;

    if (!canvas || !analysisData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter issues based on selected filter
    const filteredIssues = analysisData.issues.filter(
      (issue) =>
        selectedIssueFilter === "all" || issue.type === selectedIssueFilter
    );

    // Draw bounding boxes
    filteredIssues.forEach((issue) => {
      const { x, y, width, height } = issue.boundingBox;
      const color =
        SEVERITY_COLORS[issue.severity as keyof typeof SEVERITY_COLORS] ||
        "#ff9800"; // fallback to warning color

      // Draw rectangle
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // Draw filled background with transparency
      ctx.fillStyle = color + "20"; // 20 = ~12% opacity
      ctx.fillRect(x, y, width, height);

      // Draw number badge using original issue index
      const originalIndex = analysisData.issues.findIndex(
        (i) => i.id === issue.id
      );
      const issueNumber = (originalIndex + 1).toString();
      ctx.font = "bold 16px Arial";
      const numberWidth = ctx.measureText(issueNumber).width;
      const badgeSize = Math.max(24, numberWidth + 8);

      // Draw circle background for number
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(
        x + badgeSize / 2,
        y + badgeSize / 2,
        badgeSize / 2,
        0,
        2 * Math.PI
      );
      ctx.fill();

      // Draw white border around circle
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw number text
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(issueNumber, x + badgeSize / 2, y + badgeSize / 2);

      // Reset text alignment for future drawings
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";
    });
  };

  // Update canvas when image loads or bounding box settings change
  useEffect(() => {
    drawBoundingBoxes();
  }, [analysisData, selectedIssueFilter]);

  const filteredIssues =
    analysisData?.issues.filter(
      (issue) =>
        selectedIssueFilter === "all" || issue.type === selectedIssueFilter
    ) || [];

  return (
    <Box>
      {/* Main Analysis Display */}
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
                <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
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
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Issue Details */}
      {analysisData && (
        <Paper sx={{ p: 2.5, mt: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            Detected Issues ({analysisData.issues.length})
          </Typography>

          {filteredIssues.length > 0 ? (
            <Box display="flex" flexDirection="column" gap={0.5}>
              {filteredIssues.map((issue) => {
                // Light color variants for the cards
                const lightColors = {
                  warning: "#fff3e0", // Light orange
                  critical: "#ffebee", // Light red
                };

                const borderColors = {
                  warning: "#ffb74d", // Medium orange
                  critical: "#ef5350", // Medium red
                };

                // Get original index for consistent numbering
                const originalIndex = analysisData.issues.findIndex(
                  (i) => i.id === issue.id
                );

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
                      sx={{ py: 1, px: 1.5, "&:last-child": { pb: 1 } }}
                    >
                      <Box display="flex" alignItems="center" gap={0.75}>
                        {/* Issue Number Badge */}
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            bgcolor:
                              borderColors[
                                issue.severity as keyof typeof borderColors
                              ] || "#ff9800",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            boxShadow: 1,
                          }}
                        >
                          {originalIndex + 1}
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
                            {ISSUE_TYPE_LABELS[issue.type] || issue.type}
                          </Typography>
                          <Chip
                            label={`${Math.round(issue.confidence * 100)}%`}
                            size="small"
                            color={
                              issue.confidence > 0.8
                                ? "success"
                                : issue.confidence > 0.6
                                ? "warning"
                                : "default"
                            }
                            variant="filled"
                            sx={{ fontWeight: 600, height: 18, fontSize: 9 }}
                          />
                          <Chip
                            label={issue.severity.toUpperCase()}
                            size="small"
                            color={
                              issue.severity === "critical"
                                ? "error"
                                : issue.severity === "warning"
                                ? "warning"
                                : "info"
                            }
                            variant="outlined"
                            sx={{
                              fontSize: 8,
                              height: 16,
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
                          ml: 2.5,
                          lineHeight: 1.2,
                          fontSize: 10,
                          display: "block",
                          mt: 0.25,
                        }}
                      >
                        {issue.description}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          ) : (
            <Typography color="text.secondary" textAlign="center" py={2}>
              No issues match the current filter
            </Typography>
          )}

          {/* Analysis Summary */}
          <Box mt={2} pt={2} borderTop="1px solid" borderColor="divider">
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Box flex="1" minWidth={120}>
                <Typography variant="caption" color="text.secondary">
                  Processing Time
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {analysisData.processingTime}ms
                </Typography>
              </Box>
              <Box flex="1" minWidth={120}>
                <Typography variant="caption" color="text.secondary">
                  Analysis Time
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {new Date(
                    analysisData.analysisTimestamp
                  ).toLocaleTimeString()}
                </Typography>
              </Box>
              <Box flex="1" minWidth={120}>
                <Typography variant="caption" color="text.secondary">
                  Critical Issues
                </Typography>
                <Typography variant="body2" fontWeight={600} color="error">
                  {
                    analysisData.issues.filter((i) => i.severity === "critical")
                      .length
                  }
                </Typography>
              </Box>
              <Box flex="1" minWidth={120}>
                <Typography variant="caption" color="text.secondary">
                  Warning Issues
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="warning.main"
                >
                  {
                    analysisData.issues.filter((i) => i.severity === "warning")
                      .length
                  }
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ThermalImageAnalysis;
