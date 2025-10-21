package com.teambackslash.transformer_api.controller;

import com.teambackslash.transformer_api.entity.PredictionDetection;
import com.teambackslash.transformer_api.entity.User;
import com.teambackslash.transformer_api.entity.Prediction;
import com.teambackslash.transformer_api.service.ManualDetectionService;
import com.teambackslash.transformer_api.repository.PredictionDetectionRepository;
import com.teambackslash.transformer_api.repository.PredictionRepository;
import com.teambackslash.transformer_api.repository.UserRepository;
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
    private final PredictionRepository predictionRepository;
    private final UserRepository userRepository;

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
        // Extract userId from Spring Security context
        Long userId = extractUserIdFromSecurityContext();
        
        log.info("Creating manual detection for original prediction {} by user {}", 
                 request.getPredictionId(), userId);
        
        PredictionDetection detection = manualDetectionService.addManualDetection(
            request.getPredictionId(), // This is now the original prediction ID
            userId,
            request.getClassId(),
            request.getConfidence(),
            request.getX1(),
            request.getY1(),
            request.getX2() - request.getX1(),
            request.getY2() - request.getY1(),
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
            @RequestBody CreateDetectionRequest request) {
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
     * Soft delete a detection (creates new prediction entry for the deletion)
     */
    @DeleteMapping("/detections/{detectionId}")
    public ResponseEntity<PredictionDetection> deleteDetection(
            @PathVariable Long detectionId,
            @RequestParam(required = false, defaultValue = "User deleted") String reason) {
        Long userId = extractUserIdFromSecurityContext();
        log.info("Deleting detection {} by user {} with reason: {}", detectionId, userId, reason);
        
        try {
            PredictionDetection deletedDetection = manualDetectionService.deleteDetection(detectionId, userId, reason);
            return ResponseEntity.ok(deletedDetection);
        } catch (RuntimeException e) {
            log.error("Failed to delete detection {}: {}", detectionId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * POST /api/predictions/{predictionId}/finish-editing
     * Finish the current editing session for the logged-in user
     */
    @PostMapping("/predictions/{predictionId}/finish-editing")
    public ResponseEntity<Void> finishEditingSession(@PathVariable Long predictionId) {
        Long userId = extractUserIdFromSecurityContext();
        log.info("Finishing editing session for prediction {} by user {}", predictionId, userId);
        
        try {
            manualDetectionService.finishEditingSession(predictionId, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Failed to finish editing session for prediction {}: {}", predictionId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * GET /api/predictions/{predictionId}/activity-log
     * Get activity log for a prediction showing AI and Manual annotations grouped by prediction sessions
     */
    @GetMapping("/predictions/{predictionId}/activity-log")
    public ResponseEntity<List<PredictionSessionResponse>> getActivityLog(@PathVariable Long predictionId) {
        log.info("Fetching session-based activity log for prediction {}", predictionId);
        
        // Find the original prediction to get the inspection
        Prediction originalPrediction = predictionRepository.findById(predictionId)
                .orElseThrow(() -> new RuntimeException("Prediction not found: " + predictionId));
        
        // Get all predictions for this inspection (AI + all editing sessions)
        List<Prediction> allPredictions = predictionRepository
                .findAllByInspectionIdOrderByCreatedAt(originalPrediction.getInspection().getInspectionId());
        
        List<PredictionSessionResponse> sessionResponses = allPredictions.stream()
                .map(prediction -> {
                    PredictionSessionResponse session = new PredictionSessionResponse();
                    session.setPredictionId(prediction.getId());
                    session.setSessionType(prediction.getSessionType());
                    session.setUserName(prediction.getUser().getName());
                    session.setUserId(prediction.getUser().getId());
                    session.setCreatedAt(prediction.getCreatedAt());
                    session.setIssueCount(prediction.getIssueCount());
                    
                    // Get all detections for this prediction session
                    List<ActivityLogEntry> detections = prediction.getDetections().stream()
                            .map(d -> {
                                ActivityLogEntry entry = new ActivityLogEntry();
                                entry.setDetectionId(d.getId());
                                entry.setOriginalDetectionId(d.getOriginalDetection() != null ? d.getOriginalDetection().getId() : null);
                                entry.setSource(d.getSource());
                                entry.setActionType(d.getActionType());
                                entry.setClassId(d.getClassId());
                                entry.setComments(d.getComments());
                                entry.setCreatedAt(d.getCreatedAt());
                                entry.setUserId(prediction.getUser().getId());
                                entry.setUserName(prediction.getUser().getName());
                                // Include bounding box coordinates
                                entry.setBboxX(d.getBboxX());
                                entry.setBboxY(d.getBboxY());
                                entry.setBboxW(d.getBboxW());
                                entry.setBboxH(d.getBboxH());
                                entry.setConfidence(d.getConfidence());
                                return entry;
                            })
                            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                            .collect(java.util.stream.Collectors.toList());
                    
                    session.setDetections(detections);
                    return session;
                })
                .collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(sessionResponses);
    }

    /**
     * Extract user ID from Spring Security context
     */
    private Long extractUserIdFromSecurityContext() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication != null && authentication.isAuthenticated()) {
                String email = authentication.getName();
                log.debug("Authenticated user email: {}", email);
                
                User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));
                
                log.info("Extracted user ID: {} for email: {}", user.getId(), email);
                return user.getId();
            }
        } catch (Exception e) {
            log.error("Failed to extract user ID: {}", e.getMessage(), e);
            throw new RuntimeException("Authentication required", e);
        }
        
        throw new RuntimeException("User not authenticated");
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

    // DTO for activity log entry
    @lombok.Data
    public static class ActivityLogEntry {
        private Long detectionId;
        private Long originalDetectionId; // Reference to original detection for EDITED/DELETED
        private String source;
        private String actionType;
        private Integer classId;
        private String comments;
        private java.time.LocalDateTime createdAt;
        private Long userId;
        private String userName;
        // Bounding box coordinates
        private Integer bboxX;
        private Integer bboxY;
        private Integer bboxW;
        private Integer bboxH;
        private Double confidence;
    }
    
    // DTO for prediction session response
    @lombok.Data
    public static class PredictionSessionResponse {
        private Long predictionId;
        private String sessionType; // AI_ANALYSIS, MANUAL_EDITING
        private String userName;
        private Long userId;
        private java.time.LocalDateTime createdAt;
        private Integer issueCount;
        private List<ActivityLogEntry> detections;
    }
}
