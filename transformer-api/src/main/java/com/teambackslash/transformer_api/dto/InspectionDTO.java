package com.teambackslash.transformer_api.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class InspectionDTO {
    private Integer inspectionId;
    private LocalDateTime inspectionTime;
    private String branch;
    private String inspector;
    private Boolean favorite;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Nested: transformer reference
    private String transformerNo;

    // Related images
    private ImageDTO image;
}
