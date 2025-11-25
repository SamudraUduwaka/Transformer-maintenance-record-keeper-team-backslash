package com.teambackslash.transformer_api.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MaintenanceRecordDTO {
    // Time Details
    private LocalDateTime startTime;
    private LocalDateTime completionTime;

    // Personnel
    private String supervisedBy;
    private String tech1;
    private String tech2;
    private String tech3;
    private String helpers;

    // Inspection Details
    private String maintenanceInspectedBy;
    private LocalDateTime maintenanceInspectedDate;
    private String maintenanceRectifiedBy;
    private LocalDateTime maintenanceRectifiedDate;
    private String maintenanceReinspectedBy;
    private LocalDateTime maintenanceReinspectedDate;

    // CSS Details
    private String cssOfficer;
    private LocalDateTime cssDate;

    // Correction Details
    private String allSpotsCorrectedBy;
    private LocalDateTime allSpotsCorrectedDate;
}
