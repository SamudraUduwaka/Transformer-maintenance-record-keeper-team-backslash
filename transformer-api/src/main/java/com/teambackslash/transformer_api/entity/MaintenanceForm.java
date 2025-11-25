package com.teambackslash.transformer_api.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.ZoneId;

import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "maintenance_form")
@Data
public class MaintenanceForm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maintenance_form_id")
    private Integer maintenanceFormId;

    @OneToOne
    @JoinColumn(name = "inspection_id", nullable = false, unique = true)
    private Inspection inspection;

    @Column(name = "submitted", nullable = false)
    private boolean submitted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "maintenanceForm", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private ThermalInspection thermalInspection;

    @OneToOne(mappedBy = "maintenanceForm", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private MaintenanceRecord maintenanceRecord;

    @OneToOne(mappedBy = "maintenanceForm", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private WorkDataSheet workDataSheet;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now(ZoneId.of("Asia/Colombo"));
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now(ZoneId.of("Asia/Colombo"));
    }
}
