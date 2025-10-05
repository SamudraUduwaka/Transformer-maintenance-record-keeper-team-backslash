package com.teambackslash.transformer_api.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.ZoneId;

import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "inspection")
@Data
public class Inspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inspection_id")
    private Integer inspectionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transformer_no", nullable = false)
    private Transformer transformer;

    @Column(name = "inspection_time", nullable = false)
    private LocalDateTime inspectionTime;

    @Column(name = "branch", nullable = false, length = 100)
    private String branch;

    @Column(name = "inspector", nullable = false, length = 100)
    private String inspector;

    @Column(name = "favorite", nullable = false)
    private boolean favorite = false;

    @OneToOne(mappedBy = "inspection", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private Image image;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now(ZoneId.of("Asia/Colombo"));
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now(ZoneId.of("Asia/Colombo"));
    }

}
