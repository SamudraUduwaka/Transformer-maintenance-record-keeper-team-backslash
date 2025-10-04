package com.teambackslash.transformer_api.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PredictionDTO {
    private String imagePath;          // Source image path passed to script
    private String predictedImageLabel; // Faulty / Potentially Faulty / Normal
    private List<DetectionDTO> detections;
    private String timestamp;          // ISO timestamp from script
    private String rawJson;            // Raw JSON line for traceability
}
