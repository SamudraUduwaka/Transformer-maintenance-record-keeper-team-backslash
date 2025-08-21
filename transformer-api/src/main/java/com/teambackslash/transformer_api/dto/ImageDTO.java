package com.teambackslash.transformer_api.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ImageDTO {
    private Integer imageId;
    private String imageUrl;
    private String type;
    private String weatherCondition;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Parent reference
    private Integer inspectionId;
}
