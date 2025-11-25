package com.teambackslash.transformer_api.dto;

import lombok.Data;

@Data
public class MaintenanceFormDTO {
    private Integer inspectionId;
    private String transformerNo;
    private ThermalInspectionDTO thermalInspection;
    private MaintenanceRecordDTO maintenanceRecord;
    private WorkDataSheetDTO workDataSheet;
}
