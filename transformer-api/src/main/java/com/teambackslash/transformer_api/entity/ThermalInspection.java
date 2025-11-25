package com.teambackslash.transformer_api.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "thermal_inspection")
@Data
public class ThermalInspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "thermal_inspection_id")
    private Integer thermalInspectionId;

    @OneToOne
    @JoinColumn(name = "maintenance_form_id", nullable = false)
    @JsonBackReference
    private MaintenanceForm maintenanceForm;

    // Basic Details
    @Column(name = "branch", length = 100)
    private String branch;

    @Column(name = "transformer_no", length = 50)
    private String transformerNo;

    @Column(name = "pole_number", length = 50)
    private String poleNumber;

    @Column(name = "location_details", columnDefinition = "TEXT")
    private String locationDetails;

    // Inspection Metadata
    @Column(name = "inspection_date")
    private LocalDateTime inspectionDate;

    @Column(name = "inspection_time")
    private LocalDateTime inspectionTime;

    @Column(name = "inspected_by", length = 100)
    private String inspectedBy;

    // Baseline Imaging
    @Column(name = "baseline_imaging_right_no", length = 50)
    private String baselineImagingRightNo;

    @Column(name = "baseline_imaging_left_no", length = 50)
    private String baselineImagingLeftNo;

    // Load / kVA Details
    @Column(name = "last_month_kva", length = 50)
    private String lastMonthKva;

    @Column(name = "last_month_date")
    private LocalDateTime lastMonthDate;

    @Column(name = "last_month_time")
    private LocalDateTime lastMonthTime;

    @Column(name = "current_month_kva", length = 50)
    private String currentMonthKva;

    // Operating / Environment
    @Column(name = "baseline_condition", length = 50)
    private String baselineCondition;

    @Column(name = "transformer_type", length = 50)
    private String transformerType;

    // Meter Details
    @Column(name = "meter_serial", length = 100)
    private String meterSerial;

    @Column(name = "meter_ct_ratio", length = 50)
    private String meterCtRatio;

    @Column(name = "meter_make", length = 100)
    private String meterMake;

    // After Thermal
    @Column(name = "after_thermal_date")
    private LocalDateTime afterThermalDate;

    @Column(name = "after_thermal_time")
    private LocalDateTime afterThermalTime;

    // First Inspection Readings
    @Column(name = "first_inspection_voltage_r", length = 50)
    private String firstInspectionVoltageR;

    @Column(name = "first_inspection_voltage_y", length = 50)
    private String firstInspectionVoltageY;

    @Column(name = "first_inspection_voltage_b", length = 50)
    private String firstInspectionVoltageB;

    @Column(name = "first_inspection_current_r", length = 50)
    private String firstInspectionCurrentR;

    @Column(name = "first_inspection_current_y", length = 50)
    private String firstInspectionCurrentY;

    @Column(name = "first_inspection_current_b", length = 50)
    private String firstInspectionCurrentB;

    // Second Inspection Readings
    @Column(name = "second_inspection_voltage_r", length = 50)
    private String secondInspectionVoltageR;

    @Column(name = "second_inspection_voltage_y", length = 50)
    private String secondInspectionVoltageY;

    @Column(name = "second_inspection_voltage_b", length = 50)
    private String secondInspectionVoltageB;

    @Column(name = "second_inspection_current_r", length = 50)
    private String secondInspectionCurrentR;

    @Column(name = "second_inspection_current_y", length = 50)
    private String secondInspectionCurrentY;

    @Column(name = "second_inspection_current_b", length = 50)
    private String secondInspectionCurrentB;

    @OneToMany(mappedBy = "thermalInspection", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<WorkContent> workContent;
}
