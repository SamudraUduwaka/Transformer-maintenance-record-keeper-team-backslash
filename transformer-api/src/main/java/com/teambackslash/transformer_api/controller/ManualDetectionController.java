package com.teambackslash.transformer_api.controller;

import com.teambackslash.transformer_api.entity.PredictionDetection;
import com.teambackslash.transformer_api.entity.User;
import com.teambackslash.transformer_api.service.ManualDetectionService;
import com.teambackslash.transformer_api.repository.PredictionDetectionRepository;
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
        // Extract userId from Spring Security context (or use default if not authenticated)
        Long userId = extractUserIdFromSecurityContext();
        
        log.info("Creating manual detection for prediction {} by user {}", 
                 request.getPredictionId(), userId);
        
        PredictionDetection detection = manualDetectionService.addManualDetection(
            request.getPredictionId(),
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
     * Soft delete a detection
     */
    @DeleteMapping("/detections/{detectionId}")
    public ResponseEntity<Void> deleteDetection(
            @PathVariable Long detectionId,
            @RequestParam(required = false, defaultValue = "User deleted") String reason) {
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
     * GET /api/predictions/{predictionId}/activity-log
     * Get activity log for a prediction showing AI and Manual annotations
     */
    @GetMapping("/predictions/{predictionId}/activity-log")
    public ResponseEntity<List<ActivityLogEntry>> getActivityLog(@PathVariable Long predictionId) {
        log.info("Fetching activity log for prediction {}", predictionId);
        
        List<PredictionDetection> detections = detectionRepository.findByPredictionId(predictionId);
        
        List<ActivityLogEntry> logEntries = detections.stream()
            .filter(d -> d.getActionType() != null)
            .map(d -> {
                ActivityLogEntry entry = new ActivityLogEntry();
                entry.setDetectionId(d.getId());
                entry.setSource(d.getSource());
                entry.setActionType(d.getActionType());
                entry.setClassId(d.getClassId());
                entry.setComments(d.getComments());
                entry.setCreatedAt(d.getCreatedAt());
                entry.setUserId(d.getUser() != null ? d.getUser().getId() : null);
                entry.setUserName(d.getUser() != null ? d.getUser().getName() : "AI System");
                return entry;
            })
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt())) // Most recent first
            .collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(logEntries);
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
        private String source;
        private String actionType;
        private Integer classId;
        private String comments;
        private java.time.LocalDateTime createdAt;
        private Long userId;
        private String userName;
    }
}
