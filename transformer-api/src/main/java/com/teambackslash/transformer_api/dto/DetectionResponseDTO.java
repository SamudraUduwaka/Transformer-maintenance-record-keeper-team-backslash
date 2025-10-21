package com.teambackslash.transformer_api.dto;

import lombok.Data;
import lombok.Builder;
import java.time.LocalDateTime;

@Data
@Builder
public class DetectionResponseDTO {
    private Long detectionId;
    private Integer classId;
    private String className;
    private Double confidence;
    private Integer bboxX;
    private Integer bboxY;
    private Integer bboxW;
    private Integer bboxH;
    private String source; // "AI_GENERATED" or "MANUALLY_ADDED"
    private String actionType; // "ADDED", "EDITED", "DELETED"
    private String comments;
    private LocalDateTime createdAt;
    
    // User information
    private Long userId;
    private String userName;
    private String userEmail;
}
