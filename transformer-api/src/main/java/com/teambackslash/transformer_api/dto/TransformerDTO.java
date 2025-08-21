package com.teambackslash.transformer_api.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class TransformerDTO {
    private String transformerNo;
    private Integer poleNo;
    private String region;
    private String type;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // List of related inspections (nested DTOs)
    private List<InspectionDTO> inspections;
}
