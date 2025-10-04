package com.teambackslash.transformer_api.dto;

import lombok.Data;
import lombok.ToString;

@Data
@ToString
public class ThermalAnalysisRequestDTO {
    private String imageUrl;
    private String analysisType;
    private String transformerNo; // new: used for persistence of predictions
}