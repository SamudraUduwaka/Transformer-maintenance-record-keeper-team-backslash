package com.teambackslash.transformer_api.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.ZoneId;

import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "image")
@Data
public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "image_id")
    private Integer imageId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false, unique = true)
    @JsonBackReference
    private Inspection inspection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transformer_no", nullable = false)
    private Transformer transformer;

    @Column(name = "image_url", nullable = false, length = 200)
    private String imageUrl;

    @Column(name = "type", nullable = false, length = 200)
    private String type;

    @Column(name = "weather_condition", nullable = false, length = 50)
    private String weatherCondition;

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
