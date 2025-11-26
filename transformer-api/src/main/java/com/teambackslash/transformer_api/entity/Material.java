package com.teambackslash.transformer_api.entity;

import jakarta.persistence.*;
import lombok.Data;

import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "material")
@Data
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "material_id")
    private Integer materialId;

    @ManyToOne
    @JoinColumn(name = "work_data_sheet_id", nullable = false)
    @JsonBackReference
    private WorkDataSheet workDataSheet;

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "used", nullable = false)
    private boolean used = false;
}
