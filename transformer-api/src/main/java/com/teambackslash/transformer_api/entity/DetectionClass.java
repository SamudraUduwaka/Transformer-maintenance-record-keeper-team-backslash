package com.teambackslash.transformer_api.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "classes")
@Data
public class DetectionClass {

    @Id
    @Column(name = "class_id")
    private Integer classId;

    @Column(name = "class_name", nullable = false, length = 100)
    private String className;

    @Column(name = "reason", nullable = false, length = 300)
    private String reason;
}
