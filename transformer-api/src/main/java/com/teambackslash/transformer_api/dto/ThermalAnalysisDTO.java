package com.teambackslash.transformer_api.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ThermalAnalysisDTO {
    private String imageUrl;
    private String analysisTimestamp;
    private List<ThermalIssueDTO> issues;
    private double overallScore;
    private long processingTime;
    private Long predictionId; // VERIFY THIS FIELD EXISTS
}