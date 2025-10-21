import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationData {
  detectionId?: number;
  predictionId?: number;
  classId?: number;
  className?: string;
  confidence: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  source?: string; // "AI_GENERATED" or "MANUALLY_ADDED"
  actionType?: string; // "ADDED", "EDITED", "DELETED"
  userId?: number;
  userName?: string;
  originalDetectionId?: number;
  comments?: string;
  createdAt?: string;
}

export interface CreateAnnotationRequest {
  predictionId: number;
  classId: number;
  confidence: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  comments?: string;
}

class AnnotationService {
  /**
   * Get all detections (AI + Manual) for a prediction
   */
  async getDetectionsByPrediction(predictionId: number): Promise<AnnotationData[]> {
    const response = await fetch(
      `${API_BASE_URL}/predictions/${predictionId}/detections`,
      {
        headers: {
          ...authService.getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch detections: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a new manual detection
   */
  async createDetection(data: CreateAnnotationRequest): Promise<AnnotationData> {
    const response = await fetch(`${API_BASE_URL}/detections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create detection: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update an existing detection
   */
  async updateDetection(detectionId: number, data: Partial<CreateAnnotationRequest>): Promise<AnnotationData> {
    const response = await fetch(`${API_BASE_URL}/detections/${detectionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update detection: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a detection (soft delete - marks as DELETED)
   */
  async deleteDetection(detectionId: number, reason?: string): Promise<void> {
    const url = new URL(`${API_BASE_URL}/detections/${detectionId}`);
    if (reason) {
      url.searchParams.append('reason', reason);
    }

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        ...authService.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete detection: ${response.statusText}`);
    }
  }

  /**
   * Convert backend format (x1, y1, x2, y2) to frontend BoundingBox (x, y, width, height)
   */
  toBoundingBox(data: AnnotationData): BoundingBox {
    return {
      x: data.x1,
      y: data.y1,
      width: data.x2 - data.x1,
      height: data.y2 - data.y1,
    };
  }

  /**
   * Convert frontend BoundingBox to backend format
   */
  toBackendCoords(box: BoundingBox): { x1: number; y1: number; x2: number; y2: number } {
    return {
      x1: box.x,
      y1: box.y,
      x2: box.x + box.width,
      y2: box.y + box.height,
    };
  }
}

export const annotationService = new AnnotationService();
