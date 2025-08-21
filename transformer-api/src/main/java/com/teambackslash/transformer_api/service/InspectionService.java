package com.teambackslash.transformer_api.service;

import com.teambackslash.transformer_api.dto.InspectionDTO;
import com.teambackslash.transformer_api.entity.Inspection;
import com.teambackslash.transformer_api.exception.ResourceNotFoundException;
import com.teambackslash.transformer_api.mapper.InspectionMapper;
import com.teambackslash.transformer_api.repository.InspectionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InspectionService {

    private final InspectionRepository inspectionRepository;
    private final InspectionMapper inspectionMapper;

    public InspectionService(InspectionRepository inspectionRepository,
                             InspectionMapper inspectionMapper) {
        this.inspectionRepository = inspectionRepository;
        this.inspectionMapper = inspectionMapper;
    }

    // Get all inspections as DTOs
    public List<InspectionDTO> getAllInspections() {
        return inspectionRepository.findAll().stream()
                .map(inspectionMapper::toDTO)
                .collect(Collectors.toList());
    }

    // Get inspection by ID as DTO
    public InspectionDTO getInspectionById(Integer id) {
        Inspection inspection = inspectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inspection not found with ID: " + id
                ));
        return inspectionMapper.toDTO(inspection);
    }

    // Save inspection from DTO
    public InspectionDTO saveInspection(InspectionDTO inspectionDTO) {
        Inspection inspection = inspectionMapper.toEntity(inspectionDTO);
        inspection = inspectionRepository.save(inspection);
        return inspectionMapper.toDTO(inspection);
    }

    // Update inspection by ID
    public InspectionDTO updateInspection(Integer id, Map<String, Object> updates) {
        Inspection inspection = inspectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inspection not found with ID: " + id
                ));
        for (Map.Entry<String, Object> entry : updates.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            switch (key) {
                case "inspectionTime" -> inspection.setInspectionTime((LocalDateTime) value);
                case "branch" -> inspection.setBranch((String) value);
                case "inspector" -> inspection.setInspector((String) value);
            }
        }
        inspection = inspectionRepository.save(inspection);
        return inspectionMapper.toDTO(inspection);
    }

    // Delete inspection by ID
    public void deleteInspection(Integer id) {
        if (!inspectionRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Inspection not found with ID: " + id
            );
        }
        inspectionRepository.deleteById(id);
    }
}
