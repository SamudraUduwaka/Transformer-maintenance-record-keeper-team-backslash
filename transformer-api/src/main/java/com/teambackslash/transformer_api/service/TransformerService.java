package com.teambackslash.transformer_api.service;

import com.teambackslash.transformer_api.dto.TransformerDTO;
import com.teambackslash.transformer_api.entity.Transformer;
import com.teambackslash.transformer_api.exception.ResourceNotFoundException;
import com.teambackslash.transformer_api.mapper.TransformerMapper;
import com.teambackslash.transformer_api.repository.TransformerRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransformerService {

    private final TransformerRepository transformerRepository;
    private final TransformerMapper transformerMapper;

    public TransformerService(TransformerRepository transformerRepository,
                              TransformerMapper transformerMapper) {
        this.transformerRepository = transformerRepository;
        this.transformerMapper = transformerMapper;
    }

    // Get all transformers as DTOs
    public List<TransformerDTO> getAllTransformers() {
        return transformerRepository.findAll().stream()
                .map(transformerMapper::toDTO)
                .collect(Collectors.toList());
    }

    // Get transformer by ID as DTO
    public TransformerDTO getTransformerById(String transformerNo) {
        Transformer transformer = transformerRepository.findById(transformerNo)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Transformer not found with ID: " + transformerNo
                ));
        return transformerMapper.toDTO(transformer);
    }

    // Save or update transformer from DTO
    public TransformerDTO saveTransformer(TransformerDTO transformerDTO) {
        Transformer transformer = transformerMapper.toEntity(transformerDTO);
        transformer = transformerRepository.save(transformer);
        return transformerMapper.toDTO(transformer);
    }

    // Delete transformer by ID
    public void deleteTransformer(String transformerNo) {
        if (!transformerRepository.existsById(transformerNo)) {
            throw new ResourceNotFoundException(
                    "Transformer not found with ID: " + transformerNo
            );
        }
        transformerRepository.deleteById(transformerNo);
    }
}
