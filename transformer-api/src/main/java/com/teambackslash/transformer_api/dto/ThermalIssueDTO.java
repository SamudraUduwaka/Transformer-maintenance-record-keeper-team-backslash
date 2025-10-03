package com.teambackslash.transformer_api.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.ToString;

@Data
@AllArgsConstructor
@ToString
public class ThermalIssueDTO {
    private String id;
    private String type;
    private String severity;
    private Double confidence;
    private BoundingBoxDTO boundingBox;
    private String description;
    private List<String> recommendations;
}