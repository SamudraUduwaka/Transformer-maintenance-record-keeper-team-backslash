package com.teambackslash.transformer_api.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

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
    private Inspection inspection;

    @Column(name = "image_url", nullable = false, length = 200)
    private String imageUrl;

    @Column(name = "type", nullable = false, length = 200)
    private String type;

    @Column(name = "date_time", nullable = false)
    private LocalDateTime dateTime;

    @Column(name = "weather_condition", nullable = false, length = 50)
    private String weatherCondition;

}
