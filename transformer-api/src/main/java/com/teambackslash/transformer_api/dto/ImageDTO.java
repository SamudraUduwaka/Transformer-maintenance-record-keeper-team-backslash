package com.teambackslash.transformer_api.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ImageDTO {
    private Integer imageId;
    private String imageUrl;
    private String type;
    private LocalDateTime dateTime;
    private String weatherCondition;

    // Parent reference
    private Integer inspectionId;
}
