package com.teambackslash.transformer_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prediction_id", nullable = false)
    private Prediction prediction;

    @Column(name = "class_id")
    private Integer classId;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", referencedColumnName = "class_id", insertable = false, updatable = false)
    private DetectionClass detectionClass;

    @Column(name = "confidence")
    private Double confidence;

    // Bounding box
    @Column(name = "bbox_x")
    private Integer bboxX;
    @Column(name = "bbox_y")
    private Integer bboxY;
    @Column(name = "bbox_w")
    private Integer bboxW;
    @Column(name = "bbox_h")
    private Integer bboxH;

    // Polygon stored as JSON. Use LONGTEXT to avoid truncation for large masks.
    @Lob
    @Column(name = "polygon_json", columnDefinition = "LONGTEXT")
    private String polygonJson;
}
