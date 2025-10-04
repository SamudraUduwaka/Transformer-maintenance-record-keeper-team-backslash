package com.teambackslash.transformer_api.service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.teambackslash.transformer_api.dto.BoundingBoxDTO;
import com.teambackslash.transformer_api.dto.PredictionDTO;
import com.teambackslash.transformer_api.dto.ThermalAnalysisDTO;
import com.teambackslash.transformer_api.dto.ThermalIssueDTO;

@Component
public class InferenceToThermalMapper {

    private static final Map<String, String> SEVERITY = Map.of(
        "loose_joint_red", "critical",
        "point_overload_red", "critical",
        "full_wire_yellow", "critical",
        "loose_joint_yellow", "warning",
        "point_overload_yellow", "warning"
    );

    private static final Map<String, String> DESCRIPTIONS = Map.of(
        "loose_joint_red", "Loose joint overheating (reddish core).",
        "loose_joint_yellow", "Loose joint warming (yellow core).",
        "point_overload_red", "Localized critical hot spot.",
        "point_overload_yellow", "Localized warm spot.",
        "full_wire_yellow", "Entire wire overheated."
    );

    private static final Map<String, List<String>> RECOMMENDATIONS = Map.of(
        "loose_joint_red", List.of("Immediate inspection", "Tighten connections", "Check torque"),
        "loose_joint_yellow", List.of("Schedule inspection (30 days)", "Monitor thermal trend"),
        "point_overload_red", List.of("Load assessment now", "Emergency maintenance"),
        "point_overload_yellow", List.of("Monitor load", "Check for emerging overload"),
        "full_wire_yellow", List.of("Reduce load immediately", "Urgent inspection")
    );

    public ThermalAnalysisDTO adapt(String originalImageUrl, PredictionDTO prediction, long processingMs) {
        var issues = prediction.getDetections().stream().map(d -> {
            String className = d.getClassName();
            return new ThermalIssueDTO(
                UUID.randomUUID().toString(),
                humanType(className),
                SEVERITY.getOrDefault(className, "info"),
                d.getConfidence(),
                new BoundingBoxDTO(
                    d.getBoundingBox().getX(),
                    d.getBoundingBox().getY(),
                    d.getBoundingBox().getWidth(),
                    d.getBoundingBox().getHeight()
                ),
                DESCRIPTIONS.getOrDefault(className, d.getReason()),
                RECOMMENDATIONS.getOrDefault(className, List.of("Monitor"))
            );
        }).collect(Collectors.toList());

        double score = overallScore(issues);

        return new ThermalAnalysisDTO(
            originalImageUrl,
            prediction.getTimestamp(),
            issues,
            score,
            processingMs,
            null // predictionId set later after persistence
        );
    }

    private String humanType(String className) {
        return switch (className) {
            case "loose_joint_red" -> "Loose Joint (Faulty)";
            case "loose_joint_yellow" -> "Loose Joint (Potential)";
            case "point_overload_red" -> "Point Overload (Faulty)";
            case "point_overload_yellow" -> "Point Overload (Potential)";
            case "full_wire_yellow" -> "Full Wire Overload";
            default -> className;
        };
    }

    private double overallScore(List<ThermalIssueDTO> issues) {
        double score = 100.0;
        for (var i : issues) {
            switch (i.getSeverity()) {
                case "critical" -> score -= 15;
                case "warning" -> score -= 5;
                default -> {}
            }
        }
        return Math.max(score, 0.0);
    }
}
