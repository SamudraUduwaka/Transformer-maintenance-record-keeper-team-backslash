package com.teambackslash.transformer_api.service;

import com.teambackslash.transformer_api.dto.BoundingBoxDTO;
import com.teambackslash.transformer_api.dto.DetectionDTO;
import com.teambackslash.transformer_api.dto.PredictionDTO;
import com.teambackslash.transformer_api.entity.Prediction;
import com.teambackslash.transformer_api.entity.PredictionDetection;
import com.teambackslash.transformer_api.entity.User;
import com.teambackslash.transformer_api.repository.PredictionRepository;
import com.teambackslash.transformer_api.repository.TransformerRepository;
import com.teambackslash.transformer_api.repository.InspectionRepository;
import com.teambackslash.transformer_api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PredictionPersistenceService {

    private final PredictionRepository predictionRepository;
    private final TransformerRepository transformerRepository;
    private final InspectionRepository inspectionRepository;
    private final UserRepository userRepository;

    @Transactional
    public Long persistPrediction(String transformerNo, PredictionDTO dto, Integer inspectionId) {
        log.debug("Persisting prediction for transformer={} label={} detections={}", 
            transformerNo, 
            dto.getPredictedImageLabel(), 
            dto.getDetections() == null ? 0 : dto.getDetections().size());
        
        if (transformerNo != null && !transformerNo.isBlank()) {
            boolean transformerExists = transformerRepository.existsById(transformerNo);
            if (!transformerExists) {
                log.warn("Transformer {} not found; persisting prediction (column removed)", transformerNo);
            }
        }

        Prediction p = new Prediction();
        
        // Set AI user for AI-generated predictions
        User aiUser = getOrCreateAiUser();
        p.setUser(aiUser);
        p.setSessionType("AI_ANALYSIS");
        
        if (inspectionId != null) {
            inspectionRepository.findById(inspectionId).ifPresentOrElse(
                p::setInspection,
                () -> log.warn("Inspection {} not found; prediction will not link to inspection", inspectionId)
            );
        }

        p.setPredictedLabel(dto.getPredictedImageLabel());
        p.setModelTimestamp(dto.getTimestamp());
        p.setIssueCount(dto.getDetections() != null ? dto.getDetections().size() : 0);

        if (dto.getDetections() != null) {
            for (DetectionDTO d : dto.getDetections()) {
                PredictionDetection pd = new PredictionDetection();
                pd.setClassId(d.getClassId());
                pd.setConfidence(d.getConfidence());
                
                if (d.getBoundingBox() != null) {
                    BoundingBoxDTO b = d.getBoundingBox();
                    pd.setBboxX(b.getX());
                    pd.setBboxY(b.getY());
                    pd.setBboxW(b.getWidth());
                    pd.setBboxH(b.getHeight());
                }
                
                // Set annotation tracking fields for AI-generated detections
                pd.setSource("AI_GENERATED");
                pd.setActionType("ADDED");
                pd.setComments(null);
                
                p.addDetection(pd);
            }
        }

        Prediction saved = predictionRepository.save(p);
        
        long aiDetections = p.getDetections().stream()
            .filter(d -> "AI_GENERATED".equals(d.getSource()))
            .count();
        long manualDetections = p.getDetections().stream()
            .filter(d -> "MANUALLY_ADDED".equals(d.getSource()))
            .count();
        
        log.info("Saved AI prediction id={} transformer={} totalDetections={} (AI={}, Manual={})", 
            saved.getId(), 
            transformerNo, 
            p.getDetections().size(),
            aiDetections,
            manualDetections);
        
        return saved.getId();
    }
    
    /**
     * Get or create the special AI user for AI-generated predictions
     */
    private User getOrCreateAiUser() {
        return userRepository.findByEmail("ai@system.local")
            .orElseGet(() -> {
                User aiUser = User.builder()
                    .name("AI System")
                    .email("ai@system.local")
                    .password("$2a$10$dummy.hash.for.ai.user") // Dummy password hash
                    .role("SYSTEM")
                    .build();
                return userRepository.save(aiUser);
            });
    }
}
