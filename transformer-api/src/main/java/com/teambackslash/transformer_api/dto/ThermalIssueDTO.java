package com.teambackslash.transformer_api.dto;

import java.util.List;

public class ThermalIssueDTO {
    private String id;
    private String type;
    private String severity;
    private Double confidence;
    private BoundingBoxDTO boundingBox;
    private String description;
    private List<String> recommendations;

    // Default constructor
    public ThermalIssueDTO() {}

    // Constructor with parameters
    public ThermalIssueDTO(String id, String type, String severity, 
                          Double confidence, BoundingBoxDTO boundingBox, 
                          String description, List<String> recommendations) {
        this.id = id;
        this.type = type;
        this.severity = severity;
        this.confidence = confidence;
        this.boundingBox = boundingBox;
        this.description = description;
        this.recommendations = recommendations;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public BoundingBoxDTO getBoundingBox() {
        return boundingBox;
    }

    public void setBoundingBox(BoundingBoxDTO boundingBox) {
        this.boundingBox = boundingBox;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
    }

    @Override
    public String toString() {
        return "ThermalIssueDTO{" +
                "id='" + id + '\'' +
                ", type='" + type + '\'' +
                ", severity='" + severity + '\'' +
                ", confidence=" + confidence +
                ", boundingBox=" + boundingBox +
                ", description='" + description + '\'' +
                ", recommendations=" + recommendations +
                '}';
    }
}