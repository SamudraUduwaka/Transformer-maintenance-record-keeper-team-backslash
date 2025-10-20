import React, { useRef, useEffect, useState } from 'react';
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
  DialogActions 
} from '@mui/material';
import { authService } from '../services/authService';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Detection {
  id: number;
  classId: number;
  confidence: number;
  bboxX: number;
  bboxY: number;
  bboxW: number;
  bboxH: number;
  source: 'AI_GENERATED' | 'MANUALLY_ADDED';
  actionType: 'ADDED' | 'EDITED' | 'DELETED';
  comments?: string;
  createdAt: string;
}

interface DrawingCanvasProps {
  imageUrl: string;
  onSave: (box: BoundingBox, faultType: string, comments: string) => void;
  onCancel: () => void;
  isActive: boolean;
  predictionId?: number; 
}

const FAULT_TYPES = [
  'Loose Joint (Faulty)',
  'Loose Joint (Potential)',
  'Point Overload (Faulty)',
  'Point Overload (Potential)',
  'Full Wire Overload',
];

const CLASS_ID_TO_FAULT_TYPE: Record<number, string> = {
  0: 'Point Overload (Faulty)',
  1: 'Loose Joint (Faulty)',
  2: 'Point Overload (Potential)',
  3: 'Loose Joint (Potential)',
  4: 'Full Wire Overload',
};

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  imageUrl,
  onSave,
  isActive,
  predictionId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<BoundingBox | null>(null);
  const [drawnBox, setDrawnBox] = useState<BoundingBox | null>(null);

  const [selectedFaultType, setSelectedFaultType] = useState(FAULT_TYPES[0]);
  const [comments, setComments] = useState('');

  // Existing annotations state
  const [existingAnnotations, setExistingAnnotations] = useState<Detection[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Detection | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [annotationToDelete, setAnnotationToDelete] = useState<Detection | null>(null);

  // Fetch existing annotations
  useEffect(() => {
    if (!predictionId || !isActive) return;

    const fetchAnnotations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:8080/api/predictions/${predictionId}/detections`, {
          headers: authService.getAuthHeader(),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch annotations');
        }

        const data: Detection[] = await response.json();
        // Filter out deleted annotations
        setExistingAnnotations(data.filter(d => d.actionType !== 'DELETED'));
      } catch (err) {
        console.error('Failed to fetch annotations:', err);
        setError('Failed to load existing annotations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnotations();
  }, [predictionId, isActive]);

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

      canvas.width = displayWidth;
      canvas.height = displayHeight;
      
      // Store scale factor for coordinate conversion (AI model uses 640x640)
      canvas.dataset.scaleX = String(640 / displayWidth);
      canvas.dataset.scaleY = String(640 / displayHeight);
    };

    if (img.complete) {
      handleImageLoad();
    } else {
      img.addEventListener('load', handleImageLoad);
      return () => img.removeEventListener('load', handleImageLoad);
    }
  }, [imageUrl]);

  // Redraw canvas with existing annotations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = parseFloat(canvas.dataset.scaleX || '1');
    const scaleY = parseFloat(canvas.dataset.scaleY || '1');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing annotations
    existingAnnotations.forEach((annotation) => {
      const x = annotation.bboxX / scaleX;
      const y = annotation.bboxY / scaleY;
      const width = annotation.bboxW / scaleX;
      const height = annotation.bboxH / scaleY;

      const isSelected = selectedAnnotation?.id === annotation.id;
      const isAI = annotation.source === 'AI_GENERATED';

      // Different colors for AI vs Manual
      ctx.strokeStyle = isSelected ? '#EF4444' : (isAI ? '#3B82F6' : '#10B981');
      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.setLineDash(isAI ? [5, 3] : []);
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = isSelected ? 'rgba(239, 68, 68, 0.15)' : (isAI ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)');
      ctx.fillRect(x, y, width, height);

      // Draw label
      const faultType = CLASS_ID_TO_FAULT_TYPE[annotation.classId] || 'Unknown';
      const label = isAI ? `AI: ${faultType}` : `Manual: ${faultType}`;
      
      ctx.fillStyle = isAI ? '#3B82F6' : '#10B981';
      ctx.font = 'bold 10px Arial';
      ctx.fillText(label, x + 5, y - 5);

      ctx.setLineDash([]);
    });

    // Draw current box if drawing
    if (currentBox) {
      ctx.strokeStyle = '#9333EA';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height);
      
      ctx.fillStyle = 'rgba(147, 51, 234, 0.1)';
      ctx.fillRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height);
      ctx.setLineDash([]);
    }

    // Draw finalized box
    if (drawnBox && !isDrawing) {
      ctx.strokeStyle = '#9333EA';
      ctx.lineWidth = 3;
      ctx.strokeRect(drawnBox.x, drawnBox.y, drawnBox.width, drawnBox.height);
      
      ctx.fillStyle = 'rgba(147, 51, 234, 0.15)';
      ctx.fillRect(drawnBox.x, drawnBox.y, drawnBox.width, drawnBox.height);
    }
  }, [currentBox, drawnBox, isDrawing, existingAnnotations, selectedAnnotation]);

  // Handle mouse down - check for annotation selection first
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = parseFloat(canvas.dataset.scaleX || '1');
    const scaleY = parseFloat(canvas.dataset.scaleY || '1');

    // Check if clicking on existing annotation (check in reverse order for overlapping boxes)
    const clickedAnnotation = [...existingAnnotations].reverse().find(annotation => {
      const ax = annotation.bboxX / scaleX;
      const ay = annotation.bboxY / scaleY;
      const aw = annotation.bboxW / scaleX;
      const ah = annotation.bboxH / scaleY;

      return x >= ax && x <= ax + aw && y >= ay && y <= ay + ah;
    });

    if (clickedAnnotation) {
      setSelectedAnnotation(clickedAnnotation);
      setIsEditMode(true);
      setSelectedFaultType(CLASS_ID_TO_FAULT_TYPE[clickedAnnotation.classId] || FAULT_TYPES[0]);
      setComments(clickedAnnotation.comments || '');
      setDrawnBox(null); // Clear any drawn box
      return;
    }

    // Start drawing new annotation
    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentBox(null);
    setDrawnBox(null);
    setSelectedAnnotation(null);
    setIsEditMode(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = x - startPoint.x;
    const height = y - startPoint.y;

    setCurrentBox({
      x: width < 0 ? x : startPoint.x,
      y: height < 0 ? y : startPoint.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleMouseUp = () => {
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

    // Convert selected annotation coordinates to model coordinates
    const x1 = selectedAnnotation.bboxX;
    const y1 = selectedAnnotation.bboxY;
    const x2 = selectedAnnotation.bboxX + selectedAnnotation.bboxW;
    const y2 = selectedAnnotation.bboxY + selectedAnnotation.bboxH;

    const faultTypeToClassId: Record<string, number> = {
      'Point Overload (Faulty)': 0,
      'Loose Joint (Faulty)': 1,
      'Point Overload (Potential)': 2,
      'Loose Joint (Potential)': 3,
      'Full Wire Overload': 4,
    };

    try {
      const response = await fetch(`http://localhost:8080/api/detections/${selectedAnnotation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader(),
        },
        body: JSON.stringify({
          predictionId: predictionId,
          classId: faultTypeToClassId[selectedFaultType],
          confidence: 1.0,
          x1: Math.round(x1),
          y1: Math.round(y1),
          x2: Math.round(x2),
          y2: Math.round(y2),
          comments: comments || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update annotation');
      }

      // Refresh annotations
      const refreshResponse = await fetch(`http://localhost:8080/api/predictions/${predictionId}/detections`, {
        headers: authService.getAuthHeader(),
      });
      const data: Detection[] = await refreshResponse.json();
      setExistingAnnotations(data.filter(d => d.actionType !== 'DELETED'));

      setSelectedAnnotation(null);
      setIsEditMode(false);
      setComments('');
      setSelectedFaultType(FAULT_TYPES[0]);
    } catch (err) {
      console.error('Failed to edit annotation:', err);
      setError('Failed to update annotation');
    }
  };

  // Handle delete - show confirmation dialog
  const handleDeleteClick = () => {
    if (!selectedAnnotation) {
      console.error('No annotation selected for deletion');
      setError('No annotation selected');
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
      const response = await fetch(`http://localhost:8080/api/detections/${annotationToDelete.id}?reason=User%20deleted`, {
        method: 'DELETE',
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete annotation: ${response.status} ${errorText}`);
      }

      // Refresh annotations
      const refreshResponse = await fetch(`http://localhost:8080/api/predictions/${predictionId}/detections`, {
        headers: authService.getAuthHeader(),
      });
      
      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh annotations');
      }

      const data: Detection[] = await refreshResponse.json();
      setExistingAnnotations(data.filter(d => d.actionType !== 'DELETED'));

      setSelectedAnnotation(null);
      setIsEditMode(false);
      setComments('');
      setSelectedFaultType(FAULT_TYPES[0]);
      setError(null);
      setAnnotationToDelete(null);
    } catch (err) {
      console.error('Failed to delete annotation:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete annotation');
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
    const scaleX = parseFloat(canvas.dataset.scaleX || '1');
    const scaleY = parseFloat(canvas.dataset.scaleY || '1');

    const modelBox: BoundingBox = {
      x: drawnBox.x * scaleX,
      y: drawnBox.y * scaleY,
      width: drawnBox.width * scaleX,
      height: drawnBox.height * scaleY,
    };

    onSave(modelBox, selectedFaultType, comments);
    
    // Reset state
    setDrawnBox(null);
    setComments('');
    setSelectedFaultType(FAULT_TYPES[0]);
  };

  const handleReset = () => {
    setDrawnBox(null);
    setCurrentBox(null);
    setIsDrawing(false);
    setStartPoint(null);
    setSelectedAnnotation(null);
    setIsEditMode(false);
  };

  if (!isActive) return null;

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Loading state */}
      {isLoading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
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
      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Chip 
          label={`AI: ${existingAnnotations.filter(a => a.source === 'AI_GENERATED').length}`} 
          color="info" 
          size="small" 
        />
        <Chip 
          label={`Manual: ${existingAnnotations.filter(a => a.source === 'MANUALLY_ADDED').length}`} 
          color="success" 
          size="small" 
        />
      </Box>

      {/* Image + Canvas Container */}
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: 400,
          bgcolor: '#f5f5f5',
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Thermal"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          draggable={false}
        />
        
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isDrawing) handleMouseUp();
          }}
          style={{
            position: 'absolute',
            cursor: isActive ? 'crosshair' : 'default',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </Box>

      {/* Instruction Banner */}
      <Paper sx={{ mt: 2, p: 2, bgcolor: isEditMode ? '#FEF3C7' : '#EEF2FF', border: `1px solid ${isEditMode ? '#FCD34D' : '#C7D2FE'}` }}>
        <Typography variant="body2" fontWeight={600} color={isEditMode ? 'warning.dark' : 'primary'}>
          {isEditMode
            ? '✏️ Editing annotation. Modify details below and click Update or Delete.'
            : drawnBox 
            ? '✓ Box drawn! Fill in the details below and click Save.'
            : '🖱️ Click on an existing box to edit/delete, or drag to draw a new bounding box.'}
        </Typography>
      </Paper>

      {/* Form - Show for both new and edit mode */}
      {(drawnBox || isEditMode) && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Stack spacing={2}>
            {isEditMode && selectedAnnotation && (
              <Alert severity="info" icon={false}>
                <Typography variant="caption" fontWeight={600}>
                  Editing: {selectedAnnotation.source === 'AI_GENERATED' ? 'AI' : 'Manual'} Detection (ID: {selectedAnnotation.id})
                </Typography>
              </Alert>
            )}

            <FormControl fullWidth size="small">
              <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 600 }}>
                Fault Type
              </Typography>
              <Select value={selectedFaultType} onChange={(e) => setSelectedFaultType(e.target.value)}>
                {FAULT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
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
                <Button onClick={() => {
                  setSelectedAnnotation(null);
                  setIsEditMode(false);
                  setDrawnBox(null);
                  setComments('');
                  setSelectedFaultType(FAULT_TYPES[0]);
                }}>
                  Cancel
                </Button>
                <Button variant="contained" onClick={isEditMode ? handleEdit : handleSave}>
                  {isEditMode ? 'Update' : 'Save'} Annotation
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
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this annotation?
            {annotationToDelete && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Type:</strong> {annotationToDelete.source === 'AI_GENERATED' ? 'AI' : 'Manual'} Detection
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Fault:</strong> {CLASS_ID_TO_FAULT_TYPE[annotationToDelete.classId] || 'Unknown'}
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DrawingCanvas;
