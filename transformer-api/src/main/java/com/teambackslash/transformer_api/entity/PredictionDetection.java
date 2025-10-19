package com.teambackslash.transformer_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "prediction_detection")
@Getter
@Setter
@NoArgsConstructor
public class PredictionDetection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detection_id")
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prediction_id", nullable = false)
    private Prediction prediction;

    @Column(name = "class_id")
    private Integer classId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", referencedColumnName = "class_id", insertable = false, updatable = false)
    private DetectionClass detectionClass;

    @Column(name = "confidence")
    private Double confidence;

    // Bounding box coordinates
    @Column(name = "bbox_x")
    private Integer bboxX;
    
    @Column(name = "bbox_y")
    private Integer bboxY;
    
    @Column(name = "bbox_w")
    private Integer bboxW;
    
    @Column(name = "bbox_h")
    private Integer bboxH;

    // ========== Annotation Tracking Fields ==========
    
    /**
     * Source of detection: "AI_GENERATED" (from model) or "MANUALLY_ADDED" (by user)
     */
    @Column(name = "source", length = 50, nullable = false)
    private String source = "AI_GENERATED";
    
    /**
     * Action type: "ADDED" (default), "EDITED", "DELETED"
     */
    @Column(name = "action_type", length = 50, nullable = false)
    private String actionType = "ADDED";
    
    /**
     * User who created/modified this detection (null for AI-generated)
     */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    /**
     * Reference to original detection if this is an EDIT or DELETE action
     */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_detection_id")
    private PredictionDetection originalDetection;
    
    /**
     * Optional comments/notes about this detection
     */
    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;
    
    /**
     * Timestamp when this detection was created (immutable audit trail)
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
