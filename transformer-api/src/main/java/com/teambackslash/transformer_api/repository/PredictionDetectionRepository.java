package com.teambackslash.transformer_api.repository;

import com.teambackslash.transformer_api.entity.PredictionDetection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PredictionDetectionRepository extends JpaRepository<PredictionDetection, Long> {
    
    @Query("SELECT pd FROM PredictionDetection pd WHERE pd.prediction.id = :predictionId")
    List<PredictionDetection> findByPredictionId(@Param("predictionId") Long predictionId);
    
    // ADD: Method to fetch only non-deleted detections
    @Query("SELECT pd FROM PredictionDetection pd WHERE pd.prediction.id = :predictionId AND pd.actionType != 'DELETED'")
    List<PredictionDetection> findActiveByPredictionId(@Param("predictionId") Long predictionId);
    
    /**
     * Find detections by source (AI_GENERATED or MANUALLY_ADDED)
     */
    List<PredictionDetection> findBySource(String source);
    
    /**
     * Find detections by action type (ADDED, EDITED, DELETED)
     */
    List<PredictionDetection> findByActionType(String actionType);
    
    /**
     * Find detections created by a specific user
     */
    List<PredictionDetection> findByUserId(Long userId);
}
