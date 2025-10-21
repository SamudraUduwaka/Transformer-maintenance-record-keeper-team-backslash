import React, { useRef, useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { Add, Edit } from "@mui/icons-material";
import { authService } from "../services/authService";

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ActivityLogEntry {
  detectionId: number;
  originalDetectionId?: number;
  logEntryId?: number; // Unique per inspection, not globally unique
  inspectionId?: number; // Reference to inspection
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

interface DrawingCanvasProps {
  imageUrl: string;
  onSave: (box: BoundingBox, faultType: string, comments: string) => void;
  onCancel: () => void;
  onEditFinish?: () => void; // New prop for when editing is finished
  onEditSave?: () => void; // New prop for refreshing activity log after editing
  isActive: boolean;
  predictionId?: number;
  existingDetections?: ActivityLogEntry[]; // Add existing detections to display
}

const FAULT_TYPES = [
  "Loose Joint (Faulty)",
  "Loose Joint (Potential)",
  "Point Overload (Faulty)",
  "Point Overload (Potential)",
  "Full Wire Overload",
];

const CLASS_ID_TO_FAULT_TYPE: Record<number, string> = {
  0: "Point Overload (Faulty)",
  1: "Loose Joint (Faulty)",
  2: "Point Overload (Potential)",
  3: "Loose Joint (Potential)",
  4: "Full Wire Overload",
};

// Color scheme matching thermal analysis page
const SEVERITY_COLORS = {
  warning: "#ff9800", // Orange for potential issues
  critical: "#f44336", // Red for faulty issues
};

// Color mapping based on fault type severity
const FAULT_TYPE_COLORS: Record<string, string> = {
  "Point Overload (Faulty)": SEVERITY_COLORS.critical,
  "Loose Joint (Faulty)": SEVERITY_COLORS.critical,
  "Point Overload (Potential)": SEVERITY_COLORS.warning,
  "Loose Joint (Potential)": SEVERITY_COLORS.warning,
  "Full Wire Overload": SEVERITY_COLORS.critical,
};

// Opacity for bounding box background (matching thermal analysis)
const BOUNDING_BOX_OPACITY = "20";

// Helper function to check if annotation has valid bounding box
const hasValidBbox = (annotation: ActivityLogEntry): boolean => {
  return (
    annotation.bboxX !== undefined &&
    annotation.bboxY !== undefined &&
    annotation.bboxW !== undefined &&
    annotation.bboxH !== undefined
  );
};

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  imageUrl,
  onSave,
  onEditFinish,
  onEditSave,
  isActive,
  predictionId,
  existingDetections = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [currentBox, setCurrentBox] = useState<BoundingBox | null>(null);
  const [drawnBox, setDrawnBox] = useState<BoundingBox | null>(null);

  const [selectedFaultType, setSelectedFaultType] = useState(FAULT_TYPES[0]);
  const [comments, setComments] = useState("");

  // Existing annotations state
  const [existingAnnotations, setExistingAnnotations] = useState<
    ActivityLogEntry[]
  >([]);
  const [selectedAnnotation, setSelectedAnnotation] =
    useState<ActivityLogEntry | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for hover and resize functionality
  const [hoveredAnnotation, setHoveredAnnotation] =
    useState<ActivityLogEntry | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStartPoint, setResizeStartPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [resizeStartBox, setResizeStartBox] = useState<BoundingBox | null>(
    null
  );

  // State for dragging (moving) annotations
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [dragStartBox, setDragStartBox] = useState<BoundingBox | null>(null);

  // Toolbox state
  const [activeToolbox, setActiveToolbox] = useState<"view" | "draw" | "edit">(
    "draw"
  );

  // State for temporary visual changes during resize (don't commit until save)
  const [tempResizedAnnotation, setTempResizedAnnotation] =
    useState<ActivityLogEntry | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [annotationToDelete, setAnnotationToDelete] =
    useState<ActivityLogEntry | null>(null);

  // Reset to draw mode when component becomes active
  useEffect(() => {
    if (isActive) {
      setActiveToolbox("draw");
      setIsEditMode(false);
      setSelectedAnnotation(null);
      setTempResizedAnnotation(null);
    }
  }, [isActive]);

  // Fetch existing annotations
  // Use passed existingDetections or fetch if not provided
  useEffect(() => {
    if (existingDetections.length > 0) {
      // Use passed detections from parent and filter out deleted ones
      setExistingAnnotations(
        existingDetections.filter((d) => d.actionType !== "DELETED")
      );
      return;
    }

    // Fallback: fetch from API if no detections passed
    if (!predictionId || !isActive) return;

    const fetchAnnotations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:8080/api/predictions/${predictionId}/detections`,
          {
            headers: authService.getAuthHeader(),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch annotations");
        }

        const data: ActivityLogEntry[] = await response.json();
        // Filter out deleted annotations
        setExistingAnnotations(data.filter((d) => d.actionType !== "DELETED"));
      } catch (err) {
        console.error("Failed to fetch annotations:", err);
        setError("Failed to load existing annotations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnotations();
  }, [predictionId, isActive, existingDetections]); // Add existingDetections to dependency array

  // Initialize canvas when image loads
  useEffect(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!img || !canvas || !container) return;

    const handleImageLoad = () => {
      const containerRect = container.getBoundingClientRect();
      const imgAspectRatio = img.naturalWidth / img.naturalHeight;

      let displayWidth = containerRect.width;
      let displayHeight = containerRect.height;

      if (displayWidth / displayHeight > imgAspectRatio) {
        displayWidth = displayHeight * imgAspectRatio;
      } else {
        displayHeight = displayWidth / imgAspectRatio;
      }

      // Set canvas size to match image (without zoom)
      canvas.width = displayWidth;
      canvas.height = displayHeight;

      // Store scale factor for coordinate conversion (AI model uses 640x640)
      canvas.dataset.scaleX = String(640 / displayWidth);
      canvas.dataset.scaleY = String(640 / displayHeight);

      // Store original dimensions for reset
      canvas.dataset.originalWidth = String(displayWidth);
      canvas.dataset.originalHeight = String(displayHeight);
    }; // Prevent drag and drop on canvas only when not in edit mode
    const preventDrag = (e: DragEvent) => {
      if (!isEditMode) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const preventSelect = (e: Event) => {
      if (!isEditMode) {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners to prevent dragging only when not in edit mode
    const dragStartHandler = (e: DragEvent) => preventDrag(e);
    const dragHandler = (e: DragEvent) => preventDrag(e);
    const dragEndHandler = (e: DragEvent) => preventDrag(e);
    const selectStartHandler = (e: Event) => preventSelect(e);

    canvas.addEventListener("dragstart", dragStartHandler);
    canvas.addEventListener("drag", dragHandler);
    canvas.addEventListener("dragend", dragEndHandler);
    canvas.addEventListener("selectstart", selectStartHandler);

    if (img.complete) {
      handleImageLoad();
    } else {
      img.addEventListener("load", handleImageLoad);
    }

    return () => {
      img.removeEventListener("load", handleImageLoad);
      canvas.removeEventListener("dragstart", dragStartHandler);
      canvas.removeEventListener("drag", dragHandler);
      canvas.removeEventListener("dragend", dragEndHandler);
      canvas.removeEventListener("selectstart", selectStartHandler);
    };
  }, [imageUrl, isEditMode]);

  // Redraw canvas with existing annotations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaleX = parseFloat(canvas.dataset.scaleX || "1");
    const scaleY = parseFloat(canvas.dataset.scaleY || "1");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter annotations that have complete bounding box data
    const validAnnotations = existingAnnotations.filter(
      (annotation) =>
        annotation.bboxX !== undefined &&
        annotation.bboxY !== undefined &&
        annotation.bboxW !== undefined &&
        annotation.bboxH !== undefined
    );

    // Draw existing annotations
    validAnnotations.forEach((annotation) => {
      // Use temp resized annotation if this is the one being resized
      const displayAnnotation =
        tempResizedAnnotation &&
        tempResizedAnnotation.detectionId === annotation.detectionId
          ? tempResizedAnnotation
          : annotation;

      const x = displayAnnotation.bboxX! / scaleX;
      const y = displayAnnotation.bboxY! / scaleY;
      const width = displayAnnotation.bboxW! / scaleX;
      const height = displayAnnotation.bboxH! / scaleY;

      const isSelected =
        selectedAnnotation?.detectionId === annotation.detectionId;
      const isHovered =
        hoveredAnnotation?.detectionId === annotation.detectionId;
      const isAI = annotation.source === "AI_GENERATED";

      // Dim other annotations when one is selected for editing
      const isDimmed = isEditMode && selectedAnnotation && !isSelected;

      // Get fault type and determine base color from thermal analysis color scheme
      const faultType = CLASS_ID_TO_FAULT_TYPE[annotation.classId] || "Unknown";
      const baseColor = FAULT_TYPE_COLORS[faultType] || SEVERITY_COLORS.warning;

      // Create brighter colors for hover and selected states
      const brighterColor = isSelected
        ? "#ff1744" // Bright red for selected
        : isHovered
        ? "#ffa726" // Bright orange for hover
        : baseColor;

      const strokeColor = brighterColor;
      const lineWidth = isSelected ? 4 : isHovered ? 3 : 2;

      // Apply dimming effect
      const opacity = isDimmed ? 0.3 : 1.0;

      ctx.globalAlpha = opacity;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash([]); // Always use solid lines for all bounding boxes
      ctx.strokeRect(x, y, width, height);

      // Fill with subtle background using base color with opacity
      ctx.fillStyle = baseColor + BOUNDING_BOX_OPACITY;
      ctx.fillRect(x, y, width, height);

      // Only draw label when hovering or selected (and not dimmed)
      if ((isHovered || isSelected) && !isDimmed) {
        const faultType =
          CLASS_ID_TO_FAULT_TYPE[annotation.classId] || "Unknown";
        const label = isAI ? `AI: ${faultType}` : `Manual: ${faultType}`;

        // Draw label background
        ctx.font = "bold 11px Arial";
        const textMetrics = ctx.measureText(label);
        const labelWidth = textMetrics.width + 8;
        const labelHeight = 16;

        ctx.fillStyle = strokeColor;
        ctx.fillRect(x, y - labelHeight - 2, labelWidth, labelHeight);

        // Draw label text
        ctx.fillStyle = "white";
        ctx.fillText(label, x + 4, y - 6);
      }

      // Draw resize handles if selected
      if (isSelected) {
        drawResizeHandles(ctx, x, y, width, height);
      }

      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0; // Reset opacity
    });

    // Draw current box if drawing
    if (currentBox && activeToolbox === "draw") {
      ctx.strokeStyle = SEVERITY_COLORS.warning;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(
        currentBox.x,
        currentBox.y,
        currentBox.width,
        currentBox.height
      );

      ctx.fillStyle = SEVERITY_COLORS.warning + BOUNDING_BOX_OPACITY;
      ctx.fillRect(
        currentBox.x,
        currentBox.y,
        currentBox.width,
        currentBox.height
      );
      ctx.setLineDash([]);
    }

    // Draw finalized box
    if (drawnBox && !isDrawing && activeToolbox === "draw") {
      ctx.strokeStyle = SEVERITY_COLORS.warning;
      ctx.lineWidth = 3;
      ctx.strokeRect(drawnBox.x, drawnBox.y, drawnBox.width, drawnBox.height);

      ctx.fillStyle = SEVERITY_COLORS.warning + BOUNDING_BOX_OPACITY;
      ctx.fillRect(drawnBox.x, drawnBox.y, drawnBox.width, drawnBox.height);
    }
  }, [
    currentBox,
    drawnBox,
    isDrawing,
    existingAnnotations,
    selectedAnnotation,
    hoveredAnnotation,
    tempResizedAnnotation,
    isDragging,
    isEditMode,
    activeToolbox,
  ]);

  // Helper function to draw resize handles
  const drawResizeHandles = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    const handleSize = 8;
    const halfHandle = handleSize / 2;

    ctx.fillStyle = "#EF4444";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;

    // Corner handles
    const handles = [
      {
        x: x - halfHandle,
        y: y - halfHandle,
        cursor: "nw-resize",
        handle: "nw",
      },
      {
        x: x + width - halfHandle,
        y: y - halfHandle,
        cursor: "ne-resize",
        handle: "ne",
      },
      {
        x: x - halfHandle,
        y: y + height - halfHandle,
        cursor: "sw-resize",
        handle: "sw",
      },
      {
        x: x + width - halfHandle,
        y: y + height - halfHandle,
        cursor: "se-resize",
        handle: "se",
      },
      // Edge handles
      {
        x: x + width / 2 - halfHandle,
        y: y - halfHandle,
        cursor: "n-resize",
        handle: "n",
      },
      {
        x: x + width / 2 - halfHandle,
        y: y + height - halfHandle,
        cursor: "s-resize",
        handle: "s",
      },
      {
        x: x - halfHandle,
        y: y + height / 2 - halfHandle,
        cursor: "w-resize",
        handle: "w",
      },
      {
        x: x + width - halfHandle,
        y: y + height / 2 - halfHandle,
        cursor: "e-resize",
        handle: "e",
      },
    ];

    handles.forEach((handle) => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
  };

  // Helper function to detect which resize handle is clicked
  const getResizeHandle = (
    mouseX: number,
    mouseY: number,
    x: number,
    y: number,
    width: number,
    height: number
  ): string | null => {
    const handleSize = 8;
    const halfHandle = handleSize / 2;
    const tolerance = 5;

    const handles = [
      { x: x - halfHandle, y: y - halfHandle, handle: "nw" },
      { x: x + width - halfHandle, y: y - halfHandle, handle: "ne" },
      { x: x - halfHandle, y: y + height - halfHandle, handle: "sw" },
      { x: x + width - halfHandle, y: y + height - halfHandle, handle: "se" },
      { x: x + width / 2 - halfHandle, y: y - halfHandle, handle: "n" },
      {
        x: x + width / 2 - halfHandle,
        y: y + height - halfHandle,
        handle: "s",
      },
      { x: x - halfHandle, y: y + height / 2 - halfHandle, handle: "w" },
      {
        x: x + width - halfHandle,
        y: y + height / 2 - halfHandle,
        handle: "e",
      },
    ];

    for (const handle of handles) {
      if (
        mouseX >= handle.x - tolerance &&
        mouseX <= handle.x + handleSize + tolerance &&
        mouseY >= handle.y - tolerance &&
        mouseY <= handle.y + handleSize + tolerance
      ) {
        return handle.handle;
      }
    }
    return null;
  };

  // Helper function to get cursor style based on resize handle
  const getCursorForHandle = (handle: string): string => {
    const cursors: Record<string, string> = {
      nw: "nw-resize",
      ne: "ne-resize",
      sw: "sw-resize",
      se: "se-resize",
      n: "n-resize",
      s: "s-resize",
      w: "w-resize",
      e: "e-resize",
    };
    return cursors[handle] || "pointer";
  };

  // Check if mouse is over any annotation
  const getAnnotationAtPoint = (
    x: number,
    y: number
  ): ActivityLogEntry | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const scaleX = parseFloat(canvas.dataset.scaleX || "1");
    const scaleY = parseFloat(canvas.dataset.scaleY || "1");

    // Use raw coordinates without zoom/pan adjustments
    const adjustedX = x;
    const adjustedY = y;

    return (
      [...existingAnnotations].reverse().find((annotation) => {
        // Skip annotations without complete bounding box data
        if (!hasValidBbox(annotation)) {
          return false;
        }

        const ax = annotation.bboxX! / scaleX;
        const ay = annotation.bboxY! / scaleY;
        const aw = annotation.bboxW! / scaleX;
        const ah = annotation.bboxH! / scaleY;

        return (
          adjustedX >= ax &&
          adjustedX <= ax + aw &&
          adjustedY >= ay &&
          adjustedY <= ay + ah
        );
      }) || null
    );
  };

  // Handle mouse move for hover detection and cursor changes
  const handleMouseMoveHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing || isResizing || isDragging) return;

    // Disable hovering in draw mode
    if (activeToolbox === "draw") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // If in edit mode, only allow hover on the selected annotation
    if (isEditMode && selectedAnnotation) {
      const annotationForHandles = tempResizedAnnotation || selectedAnnotation;
      const scaleX = parseFloat(canvas.dataset.scaleX || "1");
      const scaleY = parseFloat(canvas.dataset.scaleY || "1");

      // Skip if annotation doesn't have complete bounding box data
      if (!hasValidBbox(annotationForHandles)) return;

      // Convert to screen coordinates with zoom and pan applied
      const ax = annotationForHandles.bboxX! / scaleX;
      const ay = annotationForHandles.bboxY! / scaleY;
      const aw = annotationForHandles.bboxW! / scaleX;
      const ah = annotationForHandles.bboxH! / scaleY;

      const isHoveringSelected =
        x >= ax && x <= ax + aw && y >= ay && y <= ay + ah;

      if (isHoveringSelected) {
        setHoveredAnnotation(selectedAnnotation);

        // Check for resize handles
        const handle = getResizeHandle(x, y, ax, ay, aw, ah);
        if (handle) {
          canvas.style.cursor = getCursorForHandle(handle);
        } else {
          canvas.style.cursor = "move"; // Show move cursor for dragging
        }
      } else {
        setHoveredAnnotation(null);
        canvas.style.cursor = "not-allowed"; // Show disabled cursor when in edit mode
      }
      return;
    }

    // Not in edit mode - allow normal hover on any annotation
    const hoveredAnnotationAtPoint = getAnnotationAtPoint(x, y);

    if (hoveredAnnotationAtPoint !== hoveredAnnotation) {
      setHoveredAnnotation(hoveredAnnotationAtPoint);
    }

    if (hoveredAnnotationAtPoint) {
      canvas.style.cursor = "pointer";
    } else {
      canvas.style.cursor = "crosshair";
    }
  };

  // Handle mouse down - check for annotation selection and resize handles first
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Don't prevent default for edit mode to allow dragging
    if (!isEditMode) {
      e.preventDefault();
    }

    // Allow double-click in edit mode, prevent it otherwise
    if (!isEditMode && e.detail > 1) return;

    const scaleX = parseFloat(canvas.dataset.scaleX || "1");
    const scaleY = parseFloat(canvas.dataset.scaleY || "1");

    // Use raw coordinates without zoom/pan adjustments
    const adjustedX = x;
    const adjustedY = y;

    // If already in edit mode, only allow interaction with the selected annotation
    if (isEditMode && selectedAnnotation && activeToolbox === "edit") {
      // Check if clicking on a resize handle for the currently selected annotation
      const annotationForHandles = tempResizedAnnotation || selectedAnnotation;

      if (!hasValidBbox(annotationForHandles)) return;

      const ax = annotationForHandles.bboxX! / scaleX;
      const ay = annotationForHandles.bboxY! / scaleY;
      const aw = annotationForHandles.bboxW! / scaleX;
      const ah = annotationForHandles.bboxH! / scaleY;

      const handle = getResizeHandle(x, y, ax, ay, aw, ah);

      if (handle) {
        // Start resizing the selected annotation
        setIsResizing(true);
        setResizeHandle(handle);
        setResizeStartPoint({ x: adjustedX, y: adjustedY });
        setResizeStartBox({
          x: annotationForHandles.bboxX!,
          y: annotationForHandles.bboxY!,
          width: annotationForHandles.bboxW!,
          height: annotationForHandles.bboxH!,
        });
        return;
      }

      // Check if clicking within the selected annotation area (to allow dragging)
      const clickedOnSelected =
        x >= ax && x <= ax + aw && y >= ay && y <= ay + ah;

      if (clickedOnSelected) {
        // Start dragging the annotation
        setIsDragging(true);
        setDragStartPoint({ x: adjustedX, y: adjustedY });
        setDragStartBox({
          x: annotationForHandles.bboxX!,
          y: annotationForHandles.bboxY!,
          width: annotationForHandles.bboxW!,
          height: annotationForHandles.bboxH!,
        });
        return;
      }

      // Clicking outside the selected annotation while in edit mode - do nothing
      return;
    }

    // Check if clicking on any annotation for selection (only in edit mode)
    if (activeToolbox === "edit") {
      const clickedAnnotation = [...existingAnnotations]
        .reverse()
        .find((annotation) => {
          if (!hasValidBbox(annotation)) return false;

          const ax = annotation.bboxX! / scaleX;
          const ay = annotation.bboxY! / scaleY;
          const aw = annotation.bboxW! / scaleX;
          const ah = annotation.bboxH! / scaleY;

          return x >= ax && x <= ax + aw && y >= ay && y <= ay + ah;
        });

      if (clickedAnnotation) {
        // Select annotation for editing
        setSelectedAnnotation(clickedAnnotation);
        setIsEditMode(true);
        setSelectedFaultType(
          CLASS_ID_TO_FAULT_TYPE[clickedAnnotation.classId] || FAULT_TYPES[0]
        );
        setComments(clickedAnnotation.comments || "");
        setDrawnBox(null); // Clear any drawn box
        setTempResizedAnnotation(null); // Clear any temp resize state
        return;
      }
    }

    // Start drawing new annotation (only in draw mode)
    if (activeToolbox === "draw" && !isEditMode) {
      setIsDrawing(true);
      setStartPoint({ x: adjustedX, y: adjustedY });
      setCurrentBox(null);
      setDrawnBox(null);
      setSelectedAnnotation(null);
      setTempResizedAnnotation(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only prevent default for non-edit mode to avoid interfering with dragging
    if (!isEditMode && activeToolbox !== "view") {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle hover detection first
    handleMouseMoveHover(e);

    // Use raw coordinates without zoom/pan adjustments
    const adjustedX = x;
    const adjustedY = y;

    // Handle dragging (moving the entire annotation)
    if (isDragging && selectedAnnotation && dragStartPoint && dragStartBox) {
      const scaleX = parseFloat(canvas.dataset.scaleX || "1");
      const scaleY = parseFloat(canvas.dataset.scaleY || "1");

      const deltaX = (adjustedX - dragStartPoint.x) * scaleX;
      const deltaY = (adjustedY - dragStartPoint.y) * scaleY;

      // Calculate new position
      const newX = Math.max(0, dragStartBox.x + deltaX);
      const newY = Math.max(0, dragStartBox.y + deltaY);

      // Update the temp annotation for visual feedback only
      const updatedAnnotation = {
        ...selectedAnnotation,
        bboxX: newX,
        bboxY: newY,
        bboxW: dragStartBox.width,
        bboxH: dragStartBox.height,
      };

      // Only update temporary state, don't modify the main annotations list
      setTempResizedAnnotation(updatedAnnotation);

      return;
    }

    // Handle resizing (only allow resize, not move)
    if (
      isResizing &&
      selectedAnnotation &&
      resizeStartPoint &&
      resizeStartBox &&
      resizeHandle
    ) {
      const scaleX = parseFloat(canvas.dataset.scaleX || "1");
      const scaleY = parseFloat(canvas.dataset.scaleY || "1");

      const deltaX = (adjustedX - resizeStartPoint.x) * scaleX;
      const deltaY = (adjustedY - resizeStartPoint.y) * scaleY;

      let newX = resizeStartBox.x;
      let newY = resizeStartBox.y;
      let newWidth = resizeStartBox.width;
      let newHeight = resizeStartBox.height;

      // Apply resize based on handle - this ensures only resize, never move
      switch (resizeHandle) {
        case "nw":
          newX = resizeStartBox.x + deltaX;
          newY = resizeStartBox.y + deltaY;
          newWidth = resizeStartBox.width - deltaX;
          newHeight = resizeStartBox.height - deltaY;
          break;
        case "ne":
          newY = resizeStartBox.y + deltaY;
          newWidth = resizeStartBox.width + deltaX;
          newHeight = resizeStartBox.height - deltaY;
          break;
        case "sw":
          newX = resizeStartBox.x + deltaX;
          newWidth = resizeStartBox.width - deltaX;
          newHeight = resizeStartBox.height + deltaY;
          break;
        case "se":
          newWidth = resizeStartBox.width + deltaX;
          newHeight = resizeStartBox.height + deltaY;
          break;
        case "n":
          newY = resizeStartBox.y + deltaY;
          newHeight = resizeStartBox.height - deltaY;
          break;
        case "s":
          newHeight = resizeStartBox.height + deltaY;
          break;
        case "w":
          newX = resizeStartBox.x + deltaX;
          newWidth = resizeStartBox.width - deltaX;
          break;
        case "e":
          newWidth = resizeStartBox.width + deltaX;
          break;
      }

      // Ensure minimum size
      const minSize = 10;
      if (newWidth < minSize) {
        if (resizeHandle.includes("w")) {
          newX = resizeStartBox.x + resizeStartBox.width - minSize;
        }
        newWidth = minSize;
      }
      if (newHeight < minSize) {
        if (resizeHandle.includes("n")) {
          newY = resizeStartBox.y + resizeStartBox.height - minSize;
        }
        newHeight = minSize;
      }

      // Update the temp annotation for visual feedback only
      const updatedAnnotation = {
        ...selectedAnnotation,
        bboxX: Math.max(0, newX),
        bboxY: Math.max(0, newY),
        bboxW: newWidth,
        bboxH: newHeight,
      };

      // Only update temporary state, don't modify the main annotations list
      setTempResizedAnnotation(updatedAnnotation);

      return;
    }

    // Handle drawing new box (only when in draw mode)
    if (!isDrawing || !startPoint || activeToolbox !== "draw") return;

    const width = adjustedX - startPoint.x;
    const height = adjustedY - startPoint.y;

    setCurrentBox({
      x: width < 0 ? adjustedX : startPoint.x,
      y: height < 0 ? adjustedY : startPoint.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleMouseUp = () => {
    // Handle drag completion
    if (isDragging && selectedAnnotation) {
      setIsDragging(false);
      setDragStartPoint(null);
      setDragStartBox(null);

      // Keep the temp annotation for visual feedback until user saves/cancels
      return;
    }

    // Handle resize completion - don't auto-save, just end resize mode
    if (isResizing && selectedAnnotation) {
      setIsResizing(false);
      setResizeHandle(null);
      setResizeStartPoint(null);
      setResizeStartBox(null);

      // Keep the temp annotation for visual feedback until user saves/cancels
      return;
    }

    // Handle drawing completion
    if (!isDrawing || !currentBox) return;

    // Finalize the box
    setDrawnBox(currentBox);
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentBox(null);
  };

  // Handle edit
  const handleEdit = async () => {
    if (!selectedAnnotation) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use temp resized annotation if it exists, otherwise use selected annotation
    const annotationToSave = tempResizedAnnotation || selectedAnnotation;

    if (!hasValidBbox(annotationToSave)) return;

    // Convert annotation coordinates to model coordinates
    const x1 = annotationToSave.bboxX!;
    const y1 = annotationToSave.bboxY!;
    const x2 = annotationToSave.bboxX! + annotationToSave.bboxW!;
    const y2 = annotationToSave.bboxY! + annotationToSave.bboxH!;

    const faultTypeToClassId: Record<string, number> = {
      "Point Overload (Faulty)": 0,
      "Loose Joint (Faulty)": 1,
      "Point Overload (Potential)": 2,
      "Loose Joint (Potential)": 3,
      "Full Wire Overload": 4,
    };

    try {
      const response = await fetch(
        `http://localhost:8080/api/detections/${selectedAnnotation.detectionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authService.getAuthHeader(),
          },
          body: JSON.stringify({
            predictionId: predictionId,
            classId: faultTypeToClassId[selectedFaultType],
            confidence: 1.0,
            x1: Math.round(x1!),
            y1: Math.round(y1!),
            x2: Math.round(x2),
            y2: Math.round(y2),
            comments: comments || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update annotation");
      }

      // Refresh annotations
      const refreshResponse = await fetch(
        `http://localhost:8080/api/predictions/${predictionId}/detections`,
        {
          headers: authService.getAuthHeader(),
        }
      );
      const data: ActivityLogEntry[] = await refreshResponse.json();
      setExistingAnnotations(data.filter((d) => d.actionType !== "DELETED"));

      // Refresh activity log after successful edit
      if (onEditSave) {
        await onEditSave();
      }

      setSelectedAnnotation(null);
      setIsEditMode(false);
      setComments("");
      setSelectedFaultType(FAULT_TYPES[0]);
      setTempResizedAnnotation(null); // Clear temp state
      setActiveToolbox("draw"); // Return to drawing mode after editing
    } catch (err) {
      console.error("Failed to edit annotation:", err);
      setError("Failed to update annotation");
    }
  };

  // Handle save and continue - save changes but stay in edit mode
  const handleSaveAndContinue = async () => {
    if (!selectedAnnotation) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use temp resized annotation if it exists, otherwise use selected annotation
    const annotationToSave = tempResizedAnnotation || selectedAnnotation;

    if (!hasValidBbox(annotationToSave)) return;

    // Convert annotation coordinates to model coordinates
    const x1 = annotationToSave.bboxX!;
    const y1 = annotationToSave.bboxY!;
    const x2 = annotationToSave.bboxX! + annotationToSave.bboxW!;
    const y2 = annotationToSave.bboxY! + annotationToSave.bboxH!;

    const faultTypeToClassId: Record<string, number> = {
      "Point Overload (Faulty)": 0,
      "Loose Joint (Faulty)": 1,
      "Point Overload (Potential)": 2,
      "Loose Joint (Potential)": 3,
      "Full Wire Overload": 4,
    };

    try {
      const response = await fetch(
        `http://localhost:8080/api/detections/${selectedAnnotation.detectionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authService.getAuthHeader(),
          },
          body: JSON.stringify({
            predictionId: predictionId,
            classId: faultTypeToClassId[selectedFaultType],
            confidence: 1.0,
            x1: Math.round(x1!),
            y1: Math.round(y1!),
            x2: Math.round(x2),
            y2: Math.round(y2),
            comments: comments || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update annotation");
      }

      // Refresh annotations
      const refreshResponse = await fetch(
        `http://localhost:8080/api/predictions/${predictionId}/detections`,
        {
          headers: authService.getAuthHeader(),
        }
      );
      const data: ActivityLogEntry[] = await refreshResponse.json();
      const filteredData = data.filter((d) => d.actionType !== "DELETED");
      setExistingAnnotations(filteredData);

      // Refresh activity log after successful edit
      if (onEditSave) {
        await onEditSave();
      }

      // Exit edit mode and return to default drawing mode
      setSelectedAnnotation(null);
      setIsEditMode(false);
      setComments("");
      setSelectedFaultType(FAULT_TYPES[0]);
      setTempResizedAnnotation(null);
      setHoveredAnnotation(null); // Clear any hover highlights
      setError(null);
      setActiveToolbox("draw"); // Return to drawing mode after editing

      // Keep drawing mode active for continued annotation
    } catch (err) {
      console.error("Failed to save annotation:", err);
      setError("Failed to save annotation");
    }
  };

  // Handle save and finish - save changes and exit edit mode
  const handleSaveAndFinish = async () => {
    await handleEdit(); // Use existing logic which saves and exits
    // Navigate to comparison page after saving edit
    if (onEditFinish) {
      onEditFinish();
    }
  };

  // Handle delete - show confirmation dialog
  const handleDeleteClick = () => {
    if (!selectedAnnotation) {
      console.error("No annotation selected for deletion");
      setError("No annotation selected");
      return;
    }

    setAnnotationToDelete(selectedAnnotation);
    setDeleteDialogOpen(true);
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!annotationToDelete) return;

    setDeleteDialogOpen(false);

    try {
      const response = await fetch(
        `http://localhost:8080/api/detections/${annotationToDelete.detectionId}?reason=User%20deleted`,
        {
          method: "DELETE",
          headers: authService.getAuthHeader(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to delete annotation: ${response.status} ${errorText}`
        );
      }

      // Refresh annotations
      const refreshResponse = await fetch(
        `http://localhost:8080/api/predictions/${predictionId}/detections`,
        {
          headers: authService.getAuthHeader(),
        }
      );

      if (!refreshResponse.ok) {
        throw new Error("Failed to refresh annotations");
      }

      const data: ActivityLogEntry[] = await refreshResponse.json();
      setExistingAnnotations(data.filter((d) => d.actionType !== "DELETED"));

      setSelectedAnnotation(null);
      setIsEditMode(false);
      setComments("");
      setSelectedFaultType(FAULT_TYPES[0]);
      setError(null);
      setAnnotationToDelete(null);
      setActiveToolbox("draw"); // Return to drawing mode after deleting
    } catch (err) {
      console.error("Failed to delete annotation:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete annotation"
      );
      setAnnotationToDelete(null);
    }
  };

  // Cancel delete handler
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setAnnotationToDelete(null);
  };

  const handleSave = () => {
    if (!drawnBox) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas coordinates to model coordinates (640x640)
    const scaleX = parseFloat(canvas.dataset.scaleX || "1");
    const scaleY = parseFloat(canvas.dataset.scaleY || "1");

    const modelBox: BoundingBox = {
      x: drawnBox.x * scaleX,
      y: drawnBox.y * scaleY,
      width: drawnBox.width * scaleX,
      height: drawnBox.height * scaleY,
    };

    onSave(modelBox, selectedFaultType, comments);

    // Reset state
    setDrawnBox(null);
    setComments("");
    setSelectedFaultType(FAULT_TYPES[0]);
  };

  // Handle save and continue for new annotations - save without navigating away
  const handleSaveNewAndContinue = async () => {
    if (!drawnBox) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas coordinates to model coordinates (640x640)
    const scaleX = parseFloat(canvas.dataset.scaleX || "1");
    const scaleY = parseFloat(canvas.dataset.scaleY || "1");

    const modelBox: BoundingBox = {
      x: drawnBox.x * scaleX,
      y: drawnBox.y * scaleY,
      width: drawnBox.width * scaleX,
      height: drawnBox.height * scaleY,
    };

    const faultTypeToClassId: Record<string, number> = {
      "Point Overload (Faulty)": 0,
      "Loose Joint (Faulty)": 1,
      "Point Overload (Potential)": 2,
      "Loose Joint (Potential)": 3,
      "Full Wire Overload": 4,
    };

    try {
      // Save annotation directly to backend without using onSave prop
      const response = await fetch(`http://localhost:8080/api/detections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authService.getAuthHeader(),
        },
        body: JSON.stringify({
          predictionId: predictionId,
          classId: faultTypeToClassId[selectedFaultType],
          confidence: 1.0,
          x1: Math.round(modelBox.x),
          y1: Math.round(modelBox.y),
          x2: Math.round(modelBox.x + modelBox.width),
          y2: Math.round(modelBox.y + modelBox.height),
          comments: comments || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save annotation");
      }

      // Refresh annotations to show the new one
      const refreshResponse = await fetch(
        `http://localhost:8080/api/predictions/${predictionId}/detections`,
        {
          headers: authService.getAuthHeader(),
        }
      );
      const data: ActivityLogEntry[] = await refreshResponse.json();
      setExistingAnnotations(data.filter((d) => d.actionType !== "DELETED"));

      // Refresh activity log in parent component too
      if (onEditSave) {
        await onEditSave();
      }

      // Reset state for next annotation but stay in draw mode
      setDrawnBox(null);
      setComments("");
      setSelectedFaultType(FAULT_TYPES[0]);
      setSelectedAnnotation(null); // Clear any selection
      setHoveredAnnotation(null); // Clear any hover highlights
      setIsEditMode(false); // Ensure we're not in edit mode
      setTempResizedAnnotation(null); // Clear any temp state
      setActiveToolbox("draw"); // Ensure we're in draw mode
      setError(null);
    } catch (err) {
      console.error("Failed to save annotation:", err);
      setError("Failed to save annotation");
    }
  };

  // Handle save and finish for new annotations - save and navigate away
  const handleSaveNewAndFinish = () => {
    handleSave(); // Use existing logic which calls onSave and navigates
  };

  const handleReset = () => {
    setDrawnBox(null);
    setCurrentBox(null);
    setIsDrawing(false);
    setStartPoint(null);
    setSelectedAnnotation(null);
    setIsEditMode(false);
    setHoveredAnnotation(null);
    setIsResizing(false);
    setResizeHandle(null);
    setResizeStartPoint(null);
    setResizeStartBox(null);
    setIsDragging(false);
    setDragStartPoint(null);
    setDragStartBox(null);
    setTempResizedAnnotation(null); // Clear temp state
    setActiveToolbox("draw");
  };

  if (!isActive) return null;

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Loading state */}
      {isLoading && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={200}
        >
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography>Loading annotations...</Typography>
        </Box>
      )}

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Annotation stats */}
      <Box sx={{ mb: 2, display: "flex", gap: 1, alignItems: "center" }}>
        <Chip
          label={`AI: ${
            existingAnnotations.filter((a) => a.source === "AI_GENERATED")
              .length
          }`}
          color="info"
          size="small"
        />
        <Chip
          label={`Manual: ${
            existingAnnotations.filter((a) => a.source === "MANUALLY_ADDED")
              .length
          }`}
          color="success"
          size="small"
        />
        {hoveredAnnotation && (
          <Chip
            label={`Hovering: ${
              CLASS_ID_TO_FAULT_TYPE[hoveredAnnotation.classId] || "Unknown"
            }`}
            color="warning"
            size="small"
            variant="outlined"
          />
        )}
        {selectedAnnotation && (
          <Chip
            label={`Selected: ${
              CLASS_ID_TO_FAULT_TYPE[selectedAnnotation.classId] || "Unknown"
            }`}
            color="error"
            size="small"
          />
        )}
      </Box>

      {/* Image Container with Zoom Controls */}
      <Box sx={{ position: "relative", width: "100%", height: 400, mb: 1 }}>
        <Box
          ref={containerRef}
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            bgcolor: "#f5f5f5",
            borderRadius: 2,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: activeToolbox === "draw" ? "crosshair" : "default",
          }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Thermal"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              userSelect: "none",
              pointerEvents: "none",
            }}
            draggable={false}
          />

          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={(e) => {
              // Allow double-click in edit mode
              if (!isEditMode) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onContextMenu={(e) => {
              // Prevent right-click context menu
              e.preventDefault();
              return false;
            }}
            onMouseLeave={() => {
              if (isDrawing) handleMouseUp();
              // Don't reset resize, drag, or pan state when mouse leaves canvas
              // Only reset hover state
              if (!isResizing && !isDragging) {
                setHoveredAnnotation(null);
              }
            }}
            draggable={false}
            style={
              {
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
                WebkitTouchCallout: "none",
                KhtmlUserSelect: "none",
                pointerEvents: "auto",
              } as React.CSSProperties
            }
          />
        </Box>
      </Box>

      {/* Simplified Toolbox */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Paper
          sx={{
            p: 0.5,
            bgcolor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 1,
            display: "inline-block",
          }}
        >
          <Stack direction="row" spacing={0.5} alignItems="center">
            {/* Draw New Box */}
            <Button
              size="small"
              variant={
                activeToolbox === "draw" && !isEditMode
                  ? "contained"
                  : "outlined"
              }
              onClick={() => {
                setActiveToolbox("draw");
                setIsEditMode(false);
                setSelectedAnnotation(null);
                setTempResizedAnnotation(null);
              }}
              disabled={isEditMode}
              sx={{
                minWidth: 32,
                width: 32,
                height: 32,
                p: 0,
              }}
              title="Draw New Box"
            >
              <Add fontSize="small" />
            </Button>

            {/* Edit Box */}
            <Button
              size="small"
              variant={activeToolbox === "edit" ? "contained" : "outlined"}
              color={activeToolbox === "edit" ? "warning" : "primary"}
              onClick={() => {
                setActiveToolbox("edit");
                setIsEditMode(false);
                setSelectedAnnotation(null);
                setTempResizedAnnotation(null);
              }}
              sx={{
                minWidth: 32,
                width: 32,
                height: 32,
                p: 0,
              }}
              title="Edit Box"
            >
              <Edit fontSize="small" />
            </Button>
          </Stack>
        </Paper>
      </Box>

      {/* Form - Show for both new and edit mode */}
      {(drawnBox || isEditMode) && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Stack spacing={2}>
            {isEditMode && selectedAnnotation && (
              <Alert severity="info" icon={false}>
                <Typography variant="caption" fontWeight={600}>
                  Editing:{" "}
                  {selectedAnnotation.source === "AI_GENERATED"
                    ? "AI"
                    : "Manual"}{" "}
                  Detection (ID:{" "}
                  {selectedAnnotation.logEntryId ||
                    selectedAnnotation.detectionId}
                  )
                </Typography>
              </Alert>
            )}

            <FormControl fullWidth size="small">
              <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 600 }}>
                Fault Type
              </Typography>
              <Select
                value={selectedFaultType}
                onChange={(e) => setSelectedFaultType(e.target.value)}
              >
                {FAULT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Comments (optional)"
              multiline
              rows={2}
              size="small"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any additional notes about this fault..."
            />

            <Stack direction="row" spacing={1} justifyContent="space-between">
              <Box>
                {isEditMode && (
                  <Button color="error" onClick={handleDeleteClick}>
                    Delete
                  </Button>
                )}
              </Box>
              <Stack direction="row" spacing={1}>
                {!isEditMode && <Button onClick={handleReset}>Redraw</Button>}
                <Button
                  onClick={() => {
                    setSelectedAnnotation(null);
                    setIsEditMode(false);
                    setDrawnBox(null);
                    setComments("");
                    setSelectedFaultType(FAULT_TYPES[0]);
                    setTempResizedAnnotation(null); // Clear temp state when canceling
                    setIsDragging(false);
                    setDragStartPoint(null);
                    setDragStartBox(null);
                    setIsResizing(false);
                    setResizeHandle(null);
                    setResizeStartPoint(null);
                    setResizeStartBox(null);
                    setActiveToolbox("draw"); // Return to drawing mode after canceling
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="outlined"
                  onClick={
                    isEditMode
                      ? handleSaveAndContinue
                      : handleSaveNewAndContinue
                  }
                >
                  Save and Continue
                </Button>
                <Button
                  variant="contained"
                  onClick={
                    isEditMode ? handleSaveAndFinish : handleSaveNewAndFinish
                  }
                >
                  Save and Finish
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this annotation?
            {annotationToDelete && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Type:</strong>{" "}
                  {annotationToDelete.source === "AI_GENERATED"
                    ? "AI"
                    : "Manual"}{" "}
                  Detection
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Fault:</strong>{" "}
                  {CLASS_ID_TO_FAULT_TYPE[annotationToDelete.classId] ||
                    "Unknown"}
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DrawingCanvas;
