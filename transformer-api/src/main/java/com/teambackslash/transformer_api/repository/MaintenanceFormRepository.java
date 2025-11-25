package com.teambackslash.transformer_api.repository;

import com.teambackslash.transformer_api.entity.MaintenanceForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MaintenanceFormRepository extends JpaRepository<MaintenanceForm, Integer> {
    Optional<MaintenanceForm> findByInspection_InspectionId(Integer inspectionId);
    boolean existsByInspection_InspectionId(Integer inspectionId);
}
