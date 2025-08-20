package com.teambackslash.transformer_api.repository;

import com.teambackslash.transformer_api.entity.Inspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, Integer> {
}

