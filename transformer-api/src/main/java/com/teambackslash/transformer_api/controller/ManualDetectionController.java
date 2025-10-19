package com.teambackslash.transformer_api.controller;

import com.teambackslash.transformer_api.entity.PredictionDetection;
import com.teambackslash.transformer_api.service.ManualDetectionService;
import com.teambackslash.transformer_api.repository.PredictionDetectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ManualDetectionController {

    private final ManualDetectionService manualDetectionService;
    private final PredictionDetectionRepository detectionRepository;

    /**
     * GET /api/predictions/{predictionId}/detections
     * Get all detections (AI + Manual) for a prediction
     */
    @GetMapping("/predictions/{predictionId}/detections")
    public ResponseEntity<List<PredictionDetection>> getDetectionsByPrediction(
            @PathVariable Long predictionId
    ) {
        log.info("Fetching detections for prediction {}", predictionId);
        
        // Find all detections for this prediction
        List<PredictionDetection> detections = detectionRepository.findByPredictionId(predictionId);
        
        return ResponseEntity.ok(detections);
    }

    /**
     * POST /api/detections
     * Create a new manual detection
     */
    @PostMapping("/detections")
    public ResponseEntity<PredictionDetection> createDetection(
            @RequestBody CreateDetectionRequest request
    ) {
        // Extract userId from Spring Security context (or use default if not authenticated)
        Long userId = extractUserIdFromSecurityContext();
        
        log.info("Creating manual detection for prediction {} by user {}", 
                 request.getPredictionId(), userId);
        
        // FIX: Convert x1,y1,x2,y2 to x,y,w,h
        PredictionDetection detection = manualDetectionService.addManualDetection(
            request.getPredictionId(),
            userId,
            request.getClassId(),
            request.getConfidence(),
            request.getX1(),        // bboxX
            request.getY1(),        // bboxY
            request.getX2() - request.getX1(),  // bboxW = x2 - x1
            request.getY2() - request.getY1(),  // bboxH = y2 - y1
            request.getComments()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(detection);
    }

    /**
     * PUT /api/detections/{detectionId}
     * Update an existing detection
     */
    @PutMapping("/detections/{detectionId}")
    public ResponseEntity<PredictionDetection> updateDetection(
            @PathVariable Long detectionId,
            @RequestBody CreateDetectionRequest request
    ) {
        Long userId = extractUserIdFromSecurityContext();
        
        log.info("Updating detection {} by user {}", detectionId, userId);
        
        PredictionDetection detection = manualDetectionService.editDetection(
            detectionId,
            userId,
            request.getClassId(),
            request.getConfidence(),
            request.getX1(),
            request.getY1(),
            request.getX2() - request.getX1(),
            request.getY2() - request.getY1(),
            request.getComments()
        );
        
        return ResponseEntity.ok(detection);
    }

    /**
     * DELETE /api/detections/{detectionId}
     * Soft delete a detection
     */
    @DeleteMapping("/detections/{detectionId}")
    public ResponseEntity<Void> deleteDetection(
            @PathVariable Long detectionId,
            @RequestParam(required = false, defaultValue = "User deleted") String reason
    ) {
        Long userId = extractUserIdFromSecurityContext();
        
        log.info("Deleting detection {} by user {} with reason: {}", detectionId, userId, reason);
        
        try {
            manualDetectionService.deleteDetection(detectionId, userId, reason);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Failed to delete detection {}: {}", detectionId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Extract user ID from Spring Security context
     * For now, returns a default user ID of 1
     * TODO: Implement proper JWT token parsing to get actual user ID
     */
    private Long extractUserIdFromSecurityContext() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication != null && authentication.isAuthenticated()) {
                // If you have a custom UserDetails implementation with userId, extract it here
                // Example: return ((CustomUserDetails) authentication.getPrincipal()).getUserId();
                
                // For now, return a default user ID
                log.debug("Authenticated user: {}", authentication.getName());
                return 1L; // Default user ID
            }
        } catch (Exception e) {
            log.warn("Failed to extract user ID from security context: {}", e.getMessage());
        }
        
        // Fallback to default user ID
        return 1L;
    }

    // DTO for request body
    @lombok.Data
    public static class CreateDetectionRequest {
        private Long predictionId;
        private Integer classId;
        private Double confidence;
        private Integer x1;
        private Integer y1;
        private Integer x2;
        private Integer y2;
        private String comments;
    }
}
