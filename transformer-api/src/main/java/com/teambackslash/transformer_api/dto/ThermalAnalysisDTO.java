package com.teambackslash.transformer_api.dto;

import java.util.List;

public class ThermalAnalysisDTO {
    private String imageUrl;
    private String analysisTimestamp;
    private List<ThermalIssueDTO> issues;
    private Double overallScore;
    private Long processingTime;

    // Default constructor
    public ThermalAnalysisDTO() {}

    // Constructor with parameters
    public ThermalAnalysisDTO(String imageUrl, String analysisTimestamp, 
                             List<ThermalIssueDTO> issues, Double overallScore, 
                             Long processingTime) {
        this.imageUrl = imageUrl;
        this.analysisTimestamp = analysisTimestamp;
        this.issues = issues;
        this.overallScore = overallScore;
        this.processingTime = processingTime;
    }

    // Getters and Setters
    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getAnalysisTimestamp() {
        return analysisTimestamp;
    }

    public void setAnalysisTimestamp(String analysisTimestamp) {
        this.analysisTimestamp = analysisTimestamp;
    }

    public List<ThermalIssueDTO> getIssues() {
        return issues;
    }

    public void setIssues(List<ThermalIssueDTO> issues) {
        this.issues = issues;
    }

    public Double getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(Double overallScore) {
        this.overallScore = overallScore;
    }

    public Long getProcessingTime() {
        return processingTime;
    }

    public void setProcessingTime(Long processingTime) {
        this.processingTime = processingTime;
    }

    @Override
    public String toString() {
        return "ThermalAnalysisDTO{" +
                "imageUrl='" + imageUrl + '\'' +
                ", analysisTimestamp='" + analysisTimestamp + '\'' +
                ", issues=" + issues +
                ", overallScore=" + overallScore +
                ", processingTime=" + processingTime +
                '}';
    }
}