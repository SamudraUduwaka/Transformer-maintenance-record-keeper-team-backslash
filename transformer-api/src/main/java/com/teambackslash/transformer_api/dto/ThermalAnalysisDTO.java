package com.teambackslash.transformer_api.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.ToString;

@Data
@AllArgsConstructor
@ToString
public class ThermalAnalysisDTO {
    private String imageUrl;
    private String analysisTimestamp;
    private List<ThermalIssueDTO> issues;
    private Double overallScore;
    private Long processingTime;
}