package com.teambackslash.transformer_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThermalAnalysisRequestDTO {
    private String thermalImageUrl;
    private String baselineImageUrl;
    private String transformerNo;
    private Integer inspectionId; // Make it nullable/optional
}