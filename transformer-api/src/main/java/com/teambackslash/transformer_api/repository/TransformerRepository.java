package com.teambackslash.transformer_api.repository;

import com.teambackslash.transformer_api.entity.Image;
import com.teambackslash.transformer_api.entity.Transformer;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransformerRepository extends JpaRepository<Transformer, String> {

    Optional<Image> findByTransformerNo(String transformerNo);  
}

