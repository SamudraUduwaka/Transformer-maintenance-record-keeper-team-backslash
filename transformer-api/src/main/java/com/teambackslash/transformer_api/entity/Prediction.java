package com.teambackslash.transformer_api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "prediction")
@Getter
@Setter
@NoArgsConstructor
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prediction_id")
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id")
    private Inspection inspection;

    @Column(name = "predicted_label", length = 100)
    private String predictedLabel;

    @Column(name = "model_timestamp", length = 50)
    private String modelTimestamp; 

    @Column(name = "issue_count")
    private Integer issueCount;

    @OneToMany(mappedBy = "prediction", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PredictionDetection> detections = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate(){ this.createdAt = LocalDateTime.now(ZoneId.of("Asia/Colombo")); }

    public void addDetection(PredictionDetection d){
        d.setPrediction(this);
        detections.add(d);
    }
    
    public List<PredictionDetection> getActiveDetections() {
        return detections.stream()
            .filter(d -> !"DELETED".equals(d.getActionType()))
            .collect(java.util.stream.Collectors.toList());
    }
}
