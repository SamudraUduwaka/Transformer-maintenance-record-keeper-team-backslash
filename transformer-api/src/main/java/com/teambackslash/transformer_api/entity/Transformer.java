package com.teambackslash.transformer_api.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "transformer")
@Data
public class Transformer {

    @Id
    @Column(name = "transformer_no", nullable = false, unique = true, length = 100)
    private String transformerNo;

    // CHANGED: Integer -> String (frontend uses values like "EN-122-A")
    @Column(name = "pole_no", nullable = false, length = 100)
    private String poleNo;

    @Column(name = "region", nullable = false, length = 100)
    private String region;

    @Column(name = "type", nullable = false, length = 50)
    private String type;

    // NEW: fields used by the frontend
    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "favorite", nullable = false)
    private boolean favorite = false;

    @OneToMany(mappedBy = "transformer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Inspection> inspections;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
