package com.teambackslash.transformer_api.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

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

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "image_id", referencedColumnName = "image_id")
    private Image image;


}
