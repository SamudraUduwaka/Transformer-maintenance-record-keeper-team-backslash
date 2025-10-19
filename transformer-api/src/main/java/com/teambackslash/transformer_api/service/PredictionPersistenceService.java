package com.teambackslash.transformer_api.service;

import com.teambackslash.transformer_api.dto.BoundingBoxDTO;
import com.teambackslash.transformer_api.dto.DetectionDTO;
import com.teambackslash.transformer_api.dto.PredictionDTO;
import com.teambackslash.transformer_api.entity.Prediction;
import com.teambackslash.transformer_api.entity.PredictionDetection;
import com.teambackslash.transformer_api.repository.PredictionRepository;
import com.teambackslash.transformer_api.repository.TransformerRepository;
import com.teambackslash.transformer_api.repository.InspectionRepository;
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
    // Removed ObjectMapper; polygon_json no longer stored

    @Transactional
    public Long persistPrediction(String transformerNo, PredictionDTO dto, Integer inspectionId) {
        log.debug("Persisting prediction for transformer={} label={} detections={}", 
            transformerNo, 
            dto.getPredictedImageLabel(), 
            dto.getDetections() == null ? 0 : dto.getDetections().size());
        
        // Optional validation: ensure transformer exists; if not, either throw or just log and continue.
        if (transformerNo != null && !transformerNo.isBlank()) {
            boolean transformerExists = transformerRepository.existsById(transformerNo);
            if (!transformerExists) {
                log.warn("Transformer {} not found; persisting prediction (column removed)", transformerNo);
            }
        }

        Prediction p = new Prediction();
        // Link to inspection if provided
        if (inspectionId != null) {
            inspectionRepository.findById(inspectionId).ifPresentOrElse(
                p::setInspection,
                () -> log.warn("Inspection {} not found; prediction will not link to inspection", inspectionId)
            );
        }
    // No transformer reference stored on prediction anymore
    // No longer storing source image path on predictions
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
                pd.setUser(null); // AI has no user
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
        
        log.info("Saved prediction id={} transformer={} totalDetections={} (AI={}, Manual={})", 
            saved.getId(), 
            transformerNo, 
            p.getDetections().size(),
            aiDetections,
            manualDetections);
        
        return saved.getId();
    }
}
