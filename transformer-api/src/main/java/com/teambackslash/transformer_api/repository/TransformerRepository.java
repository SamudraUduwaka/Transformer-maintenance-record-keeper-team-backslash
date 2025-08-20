package com.teambackslash.transformer_api.repository;

import com.teambackslash.transformer_api.entity.Transformer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransformerRepository extends JpaRepository<Transformer, String> {  
}

