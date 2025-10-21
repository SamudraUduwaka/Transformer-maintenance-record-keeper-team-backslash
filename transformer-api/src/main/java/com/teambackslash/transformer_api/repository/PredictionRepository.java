package com.teambackslash.transformer_api.repository;

import com.teambackslash.transformer_api.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {
	Optional<Prediction> findTopByInspection_InspectionIdOrderByCreatedAtDesc(Integer inspectionId);
	
	@Query("SELECT p FROM Prediction p WHERE p.inspection.inspectionId = " +
           "(SELECT orig.inspection.inspectionId FROM Prediction orig WHERE orig.id = :originalPredictionId) " +
           "AND p.user.id = :userId AND p.sessionType = 'MANUAL_EDITING' " +
           "AND p.predictedLabel != 'Completed Editing Session' " +
           "ORDER BY p.createdAt DESC")
    Prediction findActiveEditingSessionByOriginalPredictionAndUser(
        @Param("originalPredictionId") Long originalPredictionId, 
        @Param("userId") Long userId);
        
    @Query("SELECT p FROM Prediction p WHERE p.inspection.inspectionId = :inspectionId " +
           "ORDER BY p.createdAt ASC")
    List<Prediction> findAllByInspectionIdOrderByCreatedAt(@Param("inspectionId") Integer inspectionId);
}
