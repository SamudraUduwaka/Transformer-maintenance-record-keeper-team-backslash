package com.teambackslash.transformer_api.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ThermalInspectionDTO {
    // Basic Details
    private String branch;
    private String transformerNo;
    private String poleNumber;
    private String locationDetails;

    // Inspection Metadata
    private LocalDateTime inspectionDate;
    private LocalDateTime inspectionTime;
    private String inspectedBy;

    // Baseline Imaging
    private String baselineImagingRightNo;
    private String baselineImagingLeftNo;

    // Load / kVA Details
    private String lastMonthKva;
    private LocalDateTime lastMonthDate;
    private LocalDateTime lastMonthTime;
    private String currentMonthKva;

    // Operating / Environment
    private String baselineCondition;
    private String transformerType;

    // Meter Details
    private String meterSerial;
    private String meterCtRatio;
    private String meterMake;

    // After Thermal
    private LocalDateTime afterThermalDate;
    private LocalDateTime afterThermalTime;

    // Work Content
    private List<WorkContentDTO> workContent;

    // First Inspection Readings
    private String firstInspectionVoltageR;
    private String firstInspectionVoltageY;
    private String firstInspectionVoltageB;
    private String firstInspectionCurrentR;
    private String firstInspectionCurrentY;
    private String firstInspectionCurrentB;

    // Second Inspection Readings
    private String secondInspectionVoltageR;
    private String secondInspectionVoltageY;
    private String secondInspectionVoltageB;
    private String secondInspectionCurrentR;
    private String secondInspectionCurrentY;
    private String secondInspectionCurrentB;
}
