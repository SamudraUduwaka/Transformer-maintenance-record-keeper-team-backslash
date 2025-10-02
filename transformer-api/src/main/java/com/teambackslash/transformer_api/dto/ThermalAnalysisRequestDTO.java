package com.teambackslash.transformer_api.dto;

public class ThermalAnalysisRequestDTO {
    private String imageUrl;
    private String analysisType;

    // Default constructor
    public ThermalAnalysisRequestDTO() {}

    // Constructor with parameters
    public ThermalAnalysisRequestDTO(String imageUrl, String analysisType) {
        this.imageUrl = imageUrl;
        this.analysisType = analysisType;
    }

    // Getters and Setters
    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getAnalysisType() {
        return analysisType;
    }

    public void setAnalysisType(String analysisType) {
        this.analysisType = analysisType;
    }

    @Override
    public String toString() {
        return "ThermalAnalysisRequestDTO{" +
                "imageUrl='" + imageUrl + '\'' +
                ", analysisType='" + analysisType + '\'' +
                '}';
    }
}