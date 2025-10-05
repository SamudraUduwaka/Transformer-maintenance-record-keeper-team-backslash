package com.teambackslash.transformer_api.repository;

import com.teambackslash.transformer_api.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {
	Optional<Prediction> findTopByInspection_InspectionIdOrderByCreatedAtDesc(Integer inspectionId);
}
