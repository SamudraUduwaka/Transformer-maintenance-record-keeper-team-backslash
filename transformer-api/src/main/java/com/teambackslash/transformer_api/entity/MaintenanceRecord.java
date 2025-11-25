package com.teambackslash.transformer_api.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "maintenance_record")
@Data
public class MaintenanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maintenance_record_id")
    private Integer maintenanceRecordId;

    @OneToOne
    @JoinColumn(name = "maintenance_form_id", nullable = false)
    @JsonBackReference
    private MaintenanceForm maintenanceForm;

    // Time Details
    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "completion_time")
    private LocalDateTime completionTime;

    // Personnel
    @Column(name = "supervised_by", length = 100)
    private String supervisedBy;

    @Column(name = "tech1", length = 100)
    private String tech1;

    @Column(name = "tech2", length = 100)
    private String tech2;

    @Column(name = "tech3", length = 100)
    private String tech3;

    @Column(name = "helpers", length = 255)
    private String helpers;

    // Inspection Details
    @Column(name = "maintenance_inspected_by", length = 100)
    private String maintenanceInspectedBy;

    @Column(name = "maintenance_inspected_date")
    private LocalDateTime maintenanceInspectedDate;

    @Column(name = "maintenance_rectified_by", length = 100)
    private String maintenanceRectifiedBy;

    @Column(name = "maintenance_rectified_date")
    private LocalDateTime maintenanceRectifiedDate;

    @Column(name = "maintenance_reinspected_by", length = 100)
    private String maintenanceReinspectedBy;

    @Column(name = "maintenance_reinspected_date")
    private LocalDateTime maintenanceReinspectedDate;

    // CSS Details
    @Column(name = "css_officer", length = 100)
    private String cssOfficer;

    @Column(name = "css_date")
    private LocalDateTime cssDate;

    // Correction Details
    @Column(name = "all_spots_corrected_by", length = 100)
    private String allSpotsCorrectedBy;

    @Column(name = "all_spots_corrected_date")
    private LocalDateTime allSpotsCorrectedDate;
}
