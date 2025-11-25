package com.teambackslash.transformer_api.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "work_data_sheet")
@Data
public class WorkDataSheet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "work_data_sheet_id")
    private Integer workDataSheetId;

    @OneToOne
    @JoinColumn(name = "maintenance_form_id", nullable = false)
    @JsonBackReference
    private MaintenanceForm maintenanceForm;

    // Gang Leader & Job Details
    @Column(name = "gang_leader", length = 100)
    private String gangLeader;

    @Column(name = "job_date")
    private LocalDateTime jobDate;

    @Column(name = "job_start_time")
    private LocalDateTime jobStartTime;

    // Transformer Details
    @Column(name = "serial_no", length = 100)
    private String serialNo;

    @Column(name = "kva_rating", length = 50)
    private String kvaRating;

    @Column(name = "tap_position", length = 50)
    private String tapPosition;

    @Column(name = "ct_ratio", length = 50)
    private String ctRatio;

    @Column(name = "earth_resistance", length = 50)
    private String earthResistance;

    @Column(name = "neutral", length = 50)
    private String neutral;

    // Checks
    @Column(name = "surge_checked", nullable = false)
    private boolean surgeChecked = false;

    @Column(name = "body_checked", nullable = false)
    private boolean bodyChecked = false;

    // FDS Fuse Details
    @Column(name = "fds_fuse_f1", length = 50)
    private String fdsFuseF1;

    @Column(name = "fds_fuse_f2", length = 50)
    private String fdsFuseF2;

    @Column(name = "fds_fuse_f3", length = 50)
    private String fdsFuseF3;

    @Column(name = "fds_fuse_f4", length = 50)
    private String fdsFuseF4;

    @Column(name = "fds_fuse_f5", length = 50)
    private String fdsFuseF5;

    // Job Completion
    @Column(name = "job_completed_time")
    private LocalDateTime jobCompletedTime;

    // Notes
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "workDataSheet", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Material> materials;
}
