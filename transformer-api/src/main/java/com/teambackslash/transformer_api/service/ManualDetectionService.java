package com.teambackslash.transformer_api.service;

import com.teambackslash.transformer_api.entity.PredictionDetection;
import com.teambackslash.transformer_api.entity.Prediction;
import com.teambackslash.transformer_api.entity.User;
import com.teambackslash.transformer_api.repository.PredictionDetectionRepository;
import com.teambackslash.transformer_api.repository.PredictionRepository;
import com.teambackslash.transformer_api.repository.UserRepository;
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
    private final UserRepository userRepository;

    /**
     * Add a manual detection (bounding box) by user
     */
    @Transactional
    public PredictionDetection addManualDetection(
            Long predictionId,
            Long userId,
            Integer classId,
            Double confidence,
            Integer bboxX,
            Integer bboxY,
            Integer bboxW,
            Integer bboxH,
            String comments
    ) {
        Prediction prediction = predictionRepository.findById(predictionId)
                .orElseThrow(() -> new RuntimeException("Prediction not found: " + predictionId));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        PredictionDetection detection = new PredictionDetection();
        detection.setPrediction(prediction);
        detection.setClassId(classId);
        detection.setConfidence(confidence);
        detection.setBboxX(bboxX);
        detection.setBboxY(bboxY);
        detection.setBboxW(bboxW);
        detection.setBboxH(bboxH);
        detection.setSource("MANUALLY_ADDED");
        detection.setActionType("ADDED");
        detection.setUser(user);
        detection.setComments(comments);

        PredictionDetection saved = detectionRepository.save(detection);
        log.info("Manual detection added: detection_id={} source=MANUALLY_ADDED by user={} for prediction={}", 
            saved.getId(), userId, predictionId);
        
        return saved;
    }

    /**
     * Edit an existing detection (mark as edited)
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
        PredictionDetection detection = detectionRepository.findById(detectionId)
                .orElseThrow(() -> new RuntimeException("Detection not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        detection.setClassId(classId);
        detection.setConfidence(confidence);
        detection.setBboxX(bboxX);
        detection.setBboxY(bboxY);
        detection.setBboxW(bboxW);
        detection.setBboxH(bboxH);
        detection.setActionType("EDITED");
        detection.setUser(user);
        detection.setComments(comments);

        PredictionDetection saved = detectionRepository.save(detection);
        log.info("Detection edited: detection_id={} source={} actionType=EDITED by user={}", 
            detectionId, detection.getSource(), userId);
        
        return saved;
    }

    /**
     * Delete a detection (mark as deleted)
     */
    @Transactional
    public void deleteDetection(Long detectionId, Long userId, String reason) {
        PredictionDetection detection = detectionRepository.findById(detectionId)
                .orElseThrow(() -> new RuntimeException("Detection not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        detection.setActionType("DELETED");
        detection.setUser(user);
        detection.setComments(reason);
        
        detectionRepository.save(detection);
        log.info("Detection deleted: detection_id={} source={} actionType=DELETED by user={} reason={}", 
            detectionId, detection.getSource(), userId, reason);
    }
}
