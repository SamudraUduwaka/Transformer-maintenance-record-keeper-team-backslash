package com.teambackslash.transformer_api.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DetectionDTO {
    private Integer classId;
    private String className;
    private String reason;
    private Double confidence;
    // Polygon as list of [x,y] pairs flattened or nested
    private List<List<Double>> polygon; // each inner list is [x,y]
    private BoundingBoxDTO boundingBox; // derived axis-aligned rectangle
}
