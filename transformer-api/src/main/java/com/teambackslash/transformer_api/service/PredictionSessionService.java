package com.teambackslash.transformer_api.service;

import com.teambackslash.transformer_api.entity.Prediction;
import com.teambackslash.transformer_api.entity.User;
import com.teambackslash.transformer_api.repository.PredictionRepository;
import com.teambackslash.transformer_api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PredictionSessionService {

    private final PredictionRepository predictionRepository;
    private final UserRepository userRepository;

    /**
     * Create a new editing session for a user
     * This creates a new prediction entity for tracking user edits
     */
    @Transactional
    public Prediction createEditingSession(Long originalPredictionId, Long userId) {
        // Find the original AI prediction
        Prediction originalPrediction = predictionRepository.findById(originalPredictionId)
                .orElseThrow(() -> new RuntimeException("Original prediction not found: " + originalPredictionId));
        
        // Find the user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        // Create new prediction for editing session
        Prediction editingSession = new Prediction();
        editingSession.setInspection(originalPrediction.getInspection());
        editingSession.setUser(user);
        editingSession.setSessionType("MANUAL_EDITING");
        editingSession.setPredictedLabel("User Editing Session");
        editingSession.setModelTimestamp(java.time.LocalDateTime.now().toString());
        editingSession.setIssueCount(0); // Will be updated as edits are made

        Prediction saved = predictionRepository.save(editingSession);
        
        log.info("Created editing session: prediction_id={} for user={} based on original_prediction={}", 
            saved.getId(), userId, originalPredictionId);
        
        return saved;
    }

    /**
     * Get the current active editing session for a user and original prediction
     * If no active session exists, create one
     */
    @Transactional
    public Prediction getOrCreateEditingSession(Long originalPredictionId, Long userId) {
        // Try to find existing active editing session
        Prediction existingSession = predictionRepository
            .findActiveEditingSessionByOriginalPredictionAndUser(originalPredictionId, userId);
        
        if (existingSession != null) {
            log.info("Found existing editing session: prediction_id={} for user={}", 
                existingSession.getId(), userId);
            return existingSession;
        }
        
        // Create new editing session if none exists
        return createEditingSession(originalPredictionId, userId);
    }

    /**
     * Get the current active editing session for a user (without creating one)
     */
    @Transactional(readOnly = true)
    public Prediction getActiveEditingSession(Long originalPredictionId, Long userId) {
        return predictionRepository
            .findActiveEditingSessionByOriginalPredictionAndUser(originalPredictionId, userId);
    }

    /**
     * Finish an editing session
     */
    @Transactional
    public void finishEditingSession(Long sessionId) {
        Prediction session = predictionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        
        // Update session status or add a finished timestamp
        // For now, we can add a comment or update the predicted label to indicate completion
        session.setPredictedLabel("Completed Editing Session");
        
        predictionRepository.save(session);
        
        log.info("Editing session finished: session_id={}", sessionId);
    }

    /**
     * Update the detection count for a prediction session
     */
    @Transactional
    public void updateDetectionCount(Long predictionId) {
        Prediction prediction = predictionRepository.findById(predictionId)
                .orElseThrow(() -> new RuntimeException("Prediction not found: " + predictionId));
        
        int activeDetections = prediction.getActiveDetections().size();
        prediction.setIssueCount(activeDetections);
        
        predictionRepository.save(prediction);
        
        log.info("Updated detection count for prediction_id={} to {}", predictionId, activeDetections);
    }
}