package com.teambackslash.transformer_api.dto;

import lombok.Data;
import java.util.List;

@Data
public class TransformerDTO {
    private String transformerNo;
    private Integer poleNo;
    private String region;
    private String type;

    // List of related inspections (nested DTOs)
    private List<InspectionDTO> inspections;
}
