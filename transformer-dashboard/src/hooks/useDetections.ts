import { useState, useCallback, useEffect } from 'react';
import { annotationService, AnnotationData, CreateAnnotationRequest } from '../services/annotationService';

interface UseDetectionsOptions {
  predictionId: number | null;
  autoLoad?: boolean;
}

interface UseDetectionsReturn {
  // State
  detections: AnnotationData[];
  loading: boolean;
  error: string | null;
  
  // Computed
  aiDetections: AnnotationData[];
  manualDetections: AnnotationData[];
  
  // Actions
  loadDetections: () => Promise<void>;
  createDetection: (data: CreateAnnotationRequest) => Promise<AnnotationData>;
  updateDetection: (detectionId: number, data: Partial<CreateAnnotationRequest>) => Promise<AnnotationData>;
  deleteDetection: (detectionId: number, reason?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDetections({ predictionId, autoLoad = true }: UseDetectionsOptions): UseDetectionsReturn {
  const [detections, setDetections] = useState<AnnotationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load detections from API
  const loadDetections = useCallback(async () => {
    if (!predictionId) {
      setDetections([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await annotationService.getDetectionsByPrediction(predictionId);
      setDetections(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load detections';
      setError(errorMessage);
      console.error('Failed to load detections:', err);
    } finally {
      setLoading(false);
    }
  }, [predictionId]);

  // Create new detection
  const createDetection = useCallback(async (data: CreateAnnotationRequest): Promise<AnnotationData> => {
    setError(null);
    
    try {
      const newDetection = await annotationService.createDetection(data);
      setDetections(prev => [...prev, newDetection]);
      return newDetection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create detection';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update existing detection
  const updateDetection = useCallback(async (
    detectionId: number,
    data: Partial<CreateAnnotationRequest>
  ): Promise<AnnotationData> => {
    setError(null);
    
    try {
      const updated = await annotationService.updateDetection(detectionId, data);
      setDetections(prev => prev.map(d => d.detectionId === detectionId ? updated : d));
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update detection';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Delete detection
  const deleteDetection = useCallback(async (detectionId: number, reason?: string): Promise<void> => {
    setError(null);
    
    try {
      await annotationService.deleteDetection(detectionId, reason);
      // Remove from local state (soft delete on backend)
      setDetections(prev => prev.filter(d => d.detectionId !== detectionId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete detection';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Refresh detections
  const refresh = useCallback(async () => {
    await loadDetections();
  }, [loadDetections]);

  // Computed values: separate AI vs Manual detections
  const aiDetections = detections.filter(d => d.source === 'AI_GENERATED');
  const manualDetections = detections.filter(d => d.source === 'MANUALLY_ADDED');

  // Auto-load on mount if enabled and predictionId is available
  useEffect(() => {
    if (autoLoad && predictionId) {
      loadDetections();
    }
  }, [autoLoad, predictionId, loadDetections]);

  return {
    // State
    detections,
    loading,
    error,
    
    // Computed
    aiDetections,
    manualDetections,
    
    // Actions
    loadDetections,
    createDetection,
    updateDetection,
    deleteDetection,
    refresh,
  };
}
