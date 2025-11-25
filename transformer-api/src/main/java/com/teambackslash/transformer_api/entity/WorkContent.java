package com.teambackslash.transformer_api.entity;

import jakarta.persistence.*;
import lombok.Data;

import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "work_content")
@Data
public class WorkContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "work_content_id")
    private Integer workContentId;

    @ManyToOne
    @JoinColumn(name = "thermal_inspection_id", nullable = false)
    @JsonBackReference
    private ThermalInspection thermalInspection;

    @Column(name = "item_no", nullable = false)
    private Integer itemNo;

    @Column(name = "do_check", nullable = false)
    private boolean doCheck = false;

    @Column(name = "do_clean", nullable = false)
    private boolean doClean = false;

    @Column(name = "do_tighten", nullable = false)
    private boolean doTighten = false;

    @Column(name = "do_replace", nullable = false)
    private boolean doReplace = false;

    @Column(name = "other", columnDefinition = "TEXT")
    private String other;

    @Column(name = "after_inspection_status", length = 20)
    private String afterInspectionStatus;

    @Column(name = "after_inspection_nos", length = 100)
    private String afterInspectionNos;
}
