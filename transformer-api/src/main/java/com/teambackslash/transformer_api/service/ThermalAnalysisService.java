package com.teambackslash.transformer_api.service;

import com.teambackslash.transformer_api.dto.BoundingBoxDTO;
import com.teambackslash.transformer_api.dto.ThermalAnalysisDTO;
import com.teambackslash.transformer_api.dto.ThermalIssueDTO;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;
import com.teambackslash.transformer_api.repository.TransformerRepository;
import com.teambackslash.transformer_api.repository.ImageRepository;
import com.teambackslash.transformer_api.repository.PredictionRepository;
import com.teambackslash.transformer_api.entity.Transformer;
import com.teambackslash.transformer_api.entity.Prediction;
import com.teambackslash.transformer_api.entity.PredictionDetection;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.teambackslash.transformer_api.dto.PredictionDTO;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.net.URI;
import java.net.URL;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ThermalAnalysisService {

    private final PythonInferenceService pythonInferenceService;
    private final InferenceToThermalMapper inferenceToThermalMapper;
    private final PredictionPersistenceService predictionPersistenceService;
    private final TransformerRepository transformerRepository;
    private final ImageRepository imageRepository;
    private final PredictionRepository predictionRepository;

    @Value("${inference.real.enabled:false}")
    private boolean realInferenceEnabled;

    @Value("${inference.persist.enabled:false}")
    private boolean persistEnabled;

    @Value("${inference.persist.autocreate.transformer:false}")
    private boolean autoCreateTransformer;

    private static final Random random = new Random();
    
    // Issue generation constants
    private static final int MIN_ISSUES = 2;
    private static final int MAX_ADDITIONAL_ISSUES = 4; // Will generate MIN_ISSUES + random(0 to MAX_ADDITIONAL_ISSUES-1)
    
    // Issue type constants
    private static final String LOOSE_JOINT_FAULTY = "Loose Joint (Faulty)";
    private static final String LOOSE_JOINT_POTENTIAL = "Loose Joint (Potential)";
    private static final String POINT_OVERLOAD_FAULTY = "Point Overload (Faulty)";
    private static final String POINT_OVERLOAD_POTENTIAL = "Point Overload (Potential)";
    private static final String FULL_WIRE_OVERLOAD = "Full Wire Overload";
    
    // Thermal issue types based on the specifications
    private static final Map<String, ThermalIssueConfig> THERMAL_ISSUE_TYPES = Map.of(
        LOOSE_JOINT_FAULTY, new ThermalIssueConfig(LOOSE_JOINT_FAULTY, "critical",
            "Middle area reddish/orange-yellowish, background blue/black", 
            Arrays.asList("Immediate inspection required", "Tighten connections", "Schedule emergency maintenance")),
        LOOSE_JOINT_POTENTIAL, new ThermalIssueConfig(LOOSE_JOINT_POTENTIAL, "warning",
            "Middle area yellowish (not reddish/orange), background blue/black",
            Arrays.asList("Schedule inspection within 30 days", "Monitor temperature trends", "Check connection torque")),
        POINT_OVERLOAD_FAULTY, new ThermalIssueConfig(POINT_OVERLOAD_FAULTY, "critical",
            "Small spot reddish/orange-yellowish, rest of the wire black/blue or yellowish",
            Arrays.asList("Immediate load assessment required", "Check electrical connections", "Emergency maintenance needed")),
        POINT_OVERLOAD_POTENTIAL, new ThermalIssueConfig(POINT_OVERLOAD_POTENTIAL, "warning",
            "Small spot yellowish, rest of the wire black/blue",
            Arrays.asList("Monitor load conditions", "Schedule inspection", "Check for loose connections")),
        FULL_WIRE_OVERLOAD, new ThermalIssueConfig(FULL_WIRE_OVERLOAD, "critical",
            "The entire wire is reddish or yellowish",
            Arrays.asList("Immediate load reduction required", "Emergency inspection needed", "Check circuit capacity"))
    );

    public ThermalAnalysisDTO analyzeThermalImage(String imageUrl) {
        return analyzeThermalImage(imageUrl, null, null);
    }

    public ThermalAnalysisDTO analyzeThermalImage(String imageUrl, String transformerNo) {
        return analyzeThermalImage(imageUrl, transformerNo, null);
    }

    public ThermalAnalysisDTO analyzeThermalImage(String imageUrl, String transformerNo, Integer inspectionId) {
        long startTime = System.currentTimeMillis();

        // 1) Resolve inspection id upfront
        Integer finalInspectionId = resolveInspectionId(imageUrl, inspectionId);

        // 2) If we already have a prediction for this inspection, short‑circuit and return it
        if (finalInspectionId != null) {
            var existingOpt = predictionRepository.findTopByInspection_InspectionIdOrderByCreatedAtDesc(finalInspectionId);
            if (existingOpt.isPresent()) {
                Prediction existing = existingOpt.get();
                PredictionDTO dto = mapPredictionEntityToDTO(existing);
                long proc = System.currentTimeMillis() - startTime;
                ThermalAnalysisDTO adapted = inferenceToThermalMapper.adapt(imageUrl, dto, proc);
                adapted.setPredictionId(existing.getId());
                log.info("Reuse existing prediction id={} for inspectionId={} (no model run)", existing.getId(), finalInspectionId);
                return adapted;
            }
        }

        if (realInferenceEnabled) {
            PredictionDTO prediction = pythonInferenceService.runInferenceFromUrl(imageUrl);
            long proc = System.currentTimeMillis() - startTime;
            ThermalAnalysisDTO adapted = inferenceToThermalMapper.adapt(imageUrl, prediction, proc);
            if (persistEnabled) {
                String resolvedTransformer = transformerNo != null && !transformerNo.isBlank() ? transformerNo : extractTransformerNo(imageUrl);
                try {
                    if (!"UNKNOWN".equals(resolvedTransformer)) {
                        ensureTransformerExists(resolvedTransformer);
                        // Persist with resolved inspection id (if any)
                        Long id = predictionPersistenceService.persistPrediction(resolvedTransformer, prediction, finalInspectionId);
                        adapted.setPredictionId(id);
                        log.info("Persisted prediction id={} transformer={} detections={}", id, resolvedTransformer, prediction.getDetections().size());
                    } else {
                        log.warn("Skipping persistence - unresolved transformer number for imageUrl={} (provide transformerNo)", imageUrl);
                    }
                } catch (Exception e) {
                    log.error("Failed to persist prediction for transformer={} imageUrl={} : {}", resolvedTransformer, imageUrl, e.getMessage());
                }
            }
            return adapted;
        }

        // Fallback legacy random path
        try {
            BufferedImage image = downloadImage(imageUrl);
            List<ThermalIssueDTO> issues = generateRandomThermalIssues(image.getWidth(), image.getHeight());
            double overallScore = calculateOverallScore(issues);
            long processingTime = System.currentTimeMillis() - startTime;
            return new ThermalAnalysisDTO(
                imageUrl,
                LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                issues,
                overallScore,
                processingTime,
                null
            );
        } catch (IOException e) {
            throw new RuntimeException("Failed to download or process thermal image: " + e.getMessage(), e);
        }
    }

    private Integer resolveInspectionId(String imageUrl, Integer inspectionId) {
        if (inspectionId != null) return inspectionId;
        return imageRepository.findFirstByImageUrl(imageUrl)
            .map(img -> img.getInspection() != null ? img.getInspection().getInspectionId() : null)
            .orElse(null);
    }

    private PredictionDTO mapPredictionEntityToDTO(Prediction p) {
        var dto = new PredictionDTO();
        dto.setPredictedImageLabel(p.getPredictedLabel());
        dto.setTimestamp(p.getModelTimestamp());
        var detDtos = new ArrayList<com.teambackslash.transformer_api.dto.DetectionDTO>();
        if (p.getDetections() != null) {
            for (PredictionDetection d : p.getDetections()) {
                Integer classId = d.getClassId();
                String className = d.getDetectionClass() != null ? d.getDetectionClass().getClassName() : null;
                String reason = d.getDetectionClass() != null ? d.getDetectionClass().getReason() : null;
                var bbox = new BoundingBoxDTO(
                    d.getBboxX() != null ? d.getBboxX() : 0,
                    d.getBboxY() != null ? d.getBboxY() : 0,
                    d.getBboxW() != null ? d.getBboxW() : 0,
                    d.getBboxH() != null ? d.getBboxH() : 0
                );
                // polygon no longer stored; return empty list
                detDtos.add(new com.teambackslash.transformer_api.dto.DetectionDTO(
                    classId,
                    className,
                    reason,
                    d.getConfidence(),
                    java.util.List.of(),
                    bbox
                ));
            }
        }
        dto.setDetections(detDtos);
        return dto;
    }

    private BufferedImage downloadImage(String imageUrl) throws IOException {
        try {
            URI uri = URI.create(imageUrl);
            URL url = uri.toURL();
            BufferedImage image = ImageIO.read(url);
            if (image == null) {
                throw new IOException("Invalid image format or corrupted image");
            }
            return image;
        } catch (Exception e) {
            throw new IOException("Failed to download image from URL: " + imageUrl, e);
        }
    }

    private List<ThermalIssueDTO> generateRandomThermalIssues(int imageWidth, int imageHeight) {
        List<ThermalIssueDTO> issues = new ArrayList<>();
        
        // Generate 2-5 random issues (only actual problems, no normal conditions)
        int numIssues = random.nextInt(MAX_ADDITIONAL_ISSUES) + MIN_ISSUES;
        
        for (int i = 0; i < numIssues; i++) {
            String issueType = selectRandomIssueType();
            ThermalIssueConfig config = THERMAL_ISSUE_TYPES.get(issueType);
            BoundingBoxDTO boundingBox = generateRandomBoundingBox(imageWidth, imageHeight, issueType);
            
            ThermalIssueDTO issue = new ThermalIssueDTO(
                UUID.randomUUID().toString(),
                issueType,
                config.severity,
                generateConfidenceScore(config.severity),
                boundingBox,
                config.description,
                config.recommendations
            );
            
            issues.add(issue);
        }
        
        return issues;
    }

    private String selectRandomIssueType() {
        // Select from actual issue types only (no normal conditions)
        String[] issueTypes = {
            LOOSE_JOINT_FAULTY,
            LOOSE_JOINT_POTENTIAL, 
            POINT_OVERLOAD_FAULTY,
            POINT_OVERLOAD_POTENTIAL,
            FULL_WIRE_OVERLOAD
        };
        
        return issueTypes[random.nextInt(issueTypes.length)];
    }

    private BoundingBoxDTO generateRandomBoundingBox(int imageWidth, int imageHeight, String issueType) {
        // Generate appropriate size based on issue type
        int width, height;
        
        switch (issueType) {
            case POINT_OVERLOAD_FAULTY, POINT_OVERLOAD_POTENTIAL -> {
                // Small spots for point overloads
                width = random.nextInt(60) + 30;  // 30-90 pixels
                height = random.nextInt(60) + 30;
            }
            case FULL_WIRE_OVERLOAD -> {
                // Larger areas for wire overloads
                width = random.nextInt(200) + 100; // 100-300 pixels
                height = random.nextInt(100) + 50;  // 50-150 pixels
            }
            default -> {
                // Medium areas for joint issues
                width = random.nextInt(120) + 60;  // 60-180 pixels
                height = random.nextInt(120) + 60;
            }
        }
        
        // Ensure bounding box fits within image
        width = Math.min(width, imageWidth - 20);
        height = Math.min(height, imageHeight - 20);
        
        int x = random.nextInt(Math.max(1, imageWidth - width));
        int y = random.nextInt(Math.max(1, imageHeight - height));
        
        return new BoundingBoxDTO(x, y, width, height);
    }

    private double generateConfidenceScore(String severity) {
        return switch (severity) {
            case "critical" -> 0.8 + (random.nextDouble() * 0.2); // 0.8-1.0
            case "warning" -> 0.6 + (random.nextDouble() * 0.3);  // 0.6-0.9
            default -> 0.7 + (random.nextDouble() * 0.2);         // 0.7-0.9 fallback
        };
    }

    private double calculateOverallScore(List<ThermalIssueDTO> issues) {
        double score = 100.0;
        
        for (ThermalIssueDTO issue : issues) {
            switch (issue.getSeverity()) {
                case "critical" -> score -= 15.0;
                case "warning" -> score -= 5.0;
                // Only actual issues affect the score
            }
        }
        
        return Math.max(score, 0.0);
    }

    // Inner class for thermal issue configuration
    private static class ThermalIssueConfig {
        final String severity;
        final String description;
        final List<String> recommendations;

        ThermalIssueConfig(String type, String severity, String description, List<String> recommendations) {
            this.severity = severity;
            this.description = description;
            this.recommendations = recommendations;
        }
    }

    private String extractTransformerNo(String imageUrl) {
        // Placeholder heuristic: look for '/T' followed by digits and optional underscore, else return 'UNKNOWN'.
        // You should replace this with an explicit transformerNo parameter plumbed from controller/request DTO.
        String upper = imageUrl.toUpperCase();
        int idx = upper.indexOf("/T");
        if (idx == -1) idx = upper.indexOf("T");
        if (idx != -1) {
            int start = idx + 1; // after 'T'
            StringBuilder sb = new StringBuilder("T");
            for (int i = start; i < upper.length(); i++) {
                char c = upper.charAt(i);
                if (Character.isDigit(c) || c=='-' ) { sb.append(c); }
                else break;
            }
            if (sb.length() > 1) return sb.toString();
        }
        return "UNKNOWN";
    }

    private void ensureTransformerExists(String transformerNo) {
        if (transformerRepository.existsById(transformerNo)) return;
        if (!autoCreateTransformer) return;
        try {
            Transformer t = new Transformer();
            t.setTransformerNo(transformerNo);
            t.setPoleNo("AUTO");
            t.setRegion("AUTO");
            t.setType("AUTO");
            t.setLocation("AUTO-CREATED");
            t.setFavorite(false);
            transformerRepository.save(t);
            log.info("Auto-created transformer {} for prediction persistence", transformerNo);
        } catch (Exception e) {
            log.warn("Failed auto-create transformer {}: {}", transformerNo, e.getMessage());
        }
    }
}