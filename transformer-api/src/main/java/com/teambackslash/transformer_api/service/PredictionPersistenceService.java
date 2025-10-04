package com.teambackslash.transformer_api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teambackslash.transformer_api.dto.BoundingBoxDTO;
import com.teambackslash.transformer_api.dto.DetectionDTO;
import com.teambackslash.transformer_api.dto.PredictionDTO;
import com.teambackslash.transformer_api.entity.Prediction;
import com.teambackslash.transformer_api.entity.PredictionDetection;
import com.teambackslash.transformer_api.repository.PredictionRepository;
import com.teambackslash.transformer_api.repository.TransformerRepository;
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
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public Long persistPrediction(String transformerNo, PredictionDTO dto) {
    log.debug("Persisting prediction for transformer={} label={} detections={}", transformerNo, dto.getPredictedImageLabel(), dto.getDetections()==null?0:dto.getDetections().size());
    // Optional validation: ensure transformer exists; if not, either throw or just log and continue.
    if (transformerNo != null && !transformerNo.isBlank()) {
        boolean transformerExists = transformerRepository.existsById(transformerNo);
        if (!transformerExists) {
            log.warn("Transformer {} not found; persisting prediction (column removed)", transformerNo);
        }
    }

        Prediction p = new Prediction();
    // No transformer reference stored on prediction anymore
        p.setSourceImagePath(dto.getImagePath());
        p.setPredictedLabel(dto.getPredictedImageLabel());
        p.setModelTimestamp(dto.getTimestamp());
        p.setIssueCount(dto.getDetections() != null ? dto.getDetections().size() : 0);

        if (dto.getDetections() != null) {
            for (DetectionDTO d : dto.getDetections()) {
                PredictionDetection pd = new PredictionDetection();
                pd.setClassId(d.getClassId());
                pd.setClassName(d.getClassName());
                pd.setReason(d.getReason());
                pd.setConfidence(d.getConfidence());
                if (d.getBoundingBox() != null) {
                    BoundingBoxDTO b = d.getBoundingBox();
                    pd.setBboxX(b.getX());
                    pd.setBboxY(b.getY());
                    pd.setBboxW(b.getWidth());
                    pd.setBboxH(b.getHeight());
                }
                // store polygon
                try {
                    // Reduce JSON size: round coordinates to 2 decimals
                    var rounded = d.getPolygon().stream().map(pair -> {
                        if (pair.size() >= 2) {
                            double x = Math.round(pair.get(0) * 100.0) / 100.0;
                            double y = Math.round(pair.get(1) * 100.0) / 100.0;
                            return java.util.List.of(x, y);
                        }
                        return pair;
                    }).toList();
                    pd.setPolygonJson(objectMapper.writeValueAsString(rounded));
                } catch (JsonProcessingException e) {
                    pd.setPolygonJson("[]");
                }
                p.addDetection(pd);
            }
        }

        Prediction saved = predictionRepository.save(p);
        log.info("Saved prediction id={} transformer={} detections={}", saved.getId(), transformerNo, p.getDetections().size());
        return saved.getId();
    }
}
