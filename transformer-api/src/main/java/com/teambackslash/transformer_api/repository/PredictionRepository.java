package com.teambackslash.transformer_api.repository;

import com.teambackslash.transformer_api.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {
}
