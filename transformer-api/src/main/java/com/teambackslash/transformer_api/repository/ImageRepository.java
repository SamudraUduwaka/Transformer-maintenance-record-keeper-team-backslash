package com.teambackslash.transformer_api.repository;

import com.teambackslash.transformer_api.entity.Image;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImageRepository extends JpaRepository<Image, Integer> {
    Optional<Image> findFirstByTransformer_TransformerNoAndTypeAndWeatherCondition(
        String transformerNo, String type, String weatherCondition);

}
