package com.teambackslash.transformer_api.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class InspectionDTO {
    private Integer inspectionId;
    private LocalDateTime inspectionTime;
    private String branch;
    private String inspector;

    // Nested: transformer reference
    private String transformerNo;

    // Related images
    private List<ImageDTO> images;
}
