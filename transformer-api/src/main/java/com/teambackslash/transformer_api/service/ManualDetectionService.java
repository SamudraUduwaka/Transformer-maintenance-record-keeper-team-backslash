package com.teambackslash.transformer_api.service;

import com.teambackslash.transformer_api.entity.PredictionDetection;
import com.teambackslash.transformer_api.entity.Prediction;
import com.teambackslash.transformer_api.repository.PredictionDetectionRepository;
import com.teambackslash.transformer_api.repository.PredictionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ManualDetectionService {

    private final PredictionDetectionRepository detectionRepository;
    private final PredictionRepository predictionRepository;
    private final PredictionSessionService sessionService;

    /**
     * Add a manual detection (bounding box) by user within an editing session
     * Gets or creates an active editing session for the user
     */
    @Transactional
    public PredictionDetection addManualDetection(
            Long originalPredictionId,
            Long userId,
            Integer classId,
            Double confidence,
            Integer bboxX,
            Integer bboxY,
            Integer bboxW,
            Integer bboxH,
            String comments
    ) {
        // Get or create active editing session for this user
        Prediction editingSession = sessionService.getOrCreateEditingSession(originalPredictionId, userId);
        Integer inspectionId = editingSession.getInspection().getInspectionId();
        
        PredictionDetection detection = new PredictionDetection();
        detection.setPrediction(editingSession); // Use active editing session
        detection.setInspectionId(inspectionId);
        detection.setLogEntryId(getNextLogEntryId(inspectionId));
        detection.setOriginalDetection(null); // No original detection for manually added
        detection.setClassId(classId);
        detection.setConfidence(confidence);
        detection.setBboxX(bboxX);
        detection.setBboxY(bboxY);
        detection.setBboxW(bboxW);
        detection.setBboxH(bboxH);
        detection.setSource("MANUALLY_ADDED");
        detection.setActionType("ADDED");
        detection.setComments(comments);

        PredictionDetection saved = detectionRepository.save(detection);
        
        // Update detection count for the editing session
        sessionService.updateDetectionCount(editingSession.getId());
        
        log.info("Manual detection added: detection_id={} source=MANUALLY_ADDED by user={} in editing_session={}", 
            saved.getId(), userId, editingSession.getId());
        
        return saved;
    }

    /**
     * Edit an existing detection (creates new prediction-detection entry with EDITED tag)
     */
    @Transactional
    public PredictionDetection editDetection(
            Long detectionId,
            Long userId,
            Integer classId,
            Double confidence,
            Integer bboxX,
            Integer bboxY,
            Integer bboxW,
            Integer bboxH,
            String comments
    ) {
        PredictionDetection originalDetection = detectionRepository.findById(detectionId)
                .orElseThrow(() -> new RuntimeException("Detection not found"));
        
        // Get or create editing session for this user
        Prediction originalPrediction = originalDetection.getPrediction();
        Long inspectionPredictionId = findOriginalAIPredictionForInspection(originalPrediction);
        Prediction editingSession = sessionService.getOrCreateEditingSession(inspectionPredictionId, userId);
        Integer inspectionId = editingSession.getInspection().getInspectionId();

        // Create NEW detection entry for the edit (don't modify original)
        PredictionDetection editedDetection = new PredictionDetection();
        editedDetection.setPrediction(editingSession);
        editedDetection.setInspectionId(inspectionId);
        editedDetection.setLogEntryId(getNextLogEntryId(inspectionId));
        editedDetection.setOriginalDetection(originalDetection); // Reference to original
        editedDetection.setClassId(classId);
        editedDetection.setConfidence(confidence);
        editedDetection.setBboxX(bboxX);
        editedDetection.setBboxY(bboxY);
        editedDetection.setBboxW(bboxW);
        editedDetection.setBboxH(bboxH);
        editedDetection.setSource(originalDetection.getSource());
        editedDetection.setActionType("EDITED");
        editedDetection.setComments(comments);

        PredictionDetection saved = detectionRepository.save(editedDetection);
        
        // Update detection count for the editing session
        sessionService.updateDetectionCount(editingSession.getId());
        
        log.info("Detection edited: new_detection_id={} original_detection_id={} source={} actionType=EDITED by user={} in session={}", 
            saved.getId(), detectionId, originalDetection.getSource(), userId, editingSession.getId());
        
        return saved;
    }

    /**
     * Delete a detection (creates new prediction-detection entry with DELETED tag)
     */
    @Transactional
    public PredictionDetection deleteDetection(Long detectionId, Long userId, String reason) {
        PredictionDetection originalDetection = detectionRepository.findById(detectionId)
                .orElseThrow(() -> new RuntimeException("Detection not found"));
        // Get or create editing session for this user
        Prediction originalPrediction = originalDetection.getPrediction();
        Long inspectionPredictionId = findOriginalAIPredictionForInspection(originalPrediction);
        Prediction editingSession = sessionService.getOrCreateEditingSession(inspectionPredictionId, userId);
        Integer inspectionId = editingSession.getInspection().getInspectionId();

        // Create NEW detection entry for the deletion (don't modify original)
        PredictionDetection deletedDetection = new PredictionDetection();
        deletedDetection.setPrediction(editingSession);
        deletedDetection.setInspectionId(inspectionId);
        deletedDetection.setLogEntryId(getNextLogEntryId(inspectionId));
        deletedDetection.setOriginalDetection(originalDetection); // Reference to original
        deletedDetection.setClassId(originalDetection.getClassId());
        deletedDetection.setConfidence(originalDetection.getConfidence());
        deletedDetection.setBboxX(originalDetection.getBboxX());
        deletedDetection.setBboxY(originalDetection.getBboxY());
        deletedDetection.setBboxW(originalDetection.getBboxW());
        deletedDetection.setBboxH(originalDetection.getBboxH());
        deletedDetection.setSource(originalDetection.getSource());
        deletedDetection.setActionType("DELETED");
        deletedDetection.setComments(reason);

        PredictionDetection saved = detectionRepository.save(deletedDetection);
        
        // Update detection count for the editing session
        sessionService.updateDetectionCount(editingSession.getId());
        
        log.info("Detection deleted: new_detection_id={} original_detection_id={} source={} actionType=DELETED by user={} reason={} in session={}", 
            saved.getId(), detectionId, originalDetection.getSource(), userId, reason, editingSession.getId());
            
        return saved;
    }

    /**
     * Finish the current editing session for a user
     * This marks the session as complete
     */
    @Transactional
    public void finishEditingSession(Long originalPredictionId, Long userId) {
        // Find the active editing session
        Prediction editingSession = sessionService.getActiveEditingSession(originalPredictionId, userId);
        
        if (editingSession != null) {
            // Mark session as finished by updating a flag or status
            sessionService.finishEditingSession(editingSession.getId());
            
            log.info("Editing session finished: session_id={} by user={}", 
                editingSession.getId(), userId);
        }
    }

    /**
     * Helper method to find the original AI prediction for an inspection
     * If the given prediction is already an AI prediction, return its ID
     * If it's a manual editing session, find the AI prediction for the same inspection
     */
    private Long findOriginalAIPredictionForInspection(Prediction prediction) {
        if ("AI_ANALYSIS".equals(prediction.getSessionType())) {
            return prediction.getId();
        }
        
        // Find the AI prediction for this inspection
        Prediction aiPrediction = predictionRepository
                .findTopByInspection_InspectionIdOrderByCreatedAtDesc(prediction.getInspection().getInspectionId())
                .orElse(null);
        
        if (aiPrediction != null && "AI_ANALYSIS".equals(aiPrediction.getSessionType())) {
            return aiPrediction.getId();
        }
        
        // If no AI prediction found, use the current prediction ID as fallback
        return prediction.getId();
    }

    /**
     * Generate the next log entry ID for a given inspection
     * Log entry IDs are unique per inspection but not globally unique
     */
    private Integer getNextLogEntryId(Integer inspectionId) {
        Integer maxLogEntryId = detectionRepository.getMaxLogEntryIdForInspection(inspectionId);
        return maxLogEntryId + 1;
    }
}
