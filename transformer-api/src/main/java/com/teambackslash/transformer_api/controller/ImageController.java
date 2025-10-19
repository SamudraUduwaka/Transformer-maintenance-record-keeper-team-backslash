package com.teambackslash.transformer_api.controller;

import com.teambackslash.transformer_api.dto.ImageDTO;
import com.teambackslash.transformer_api.dto.ThermalAnalysisDTO;
import com.teambackslash.transformer_api.dto.ThermalAnalysisRequestDTO;
import com.teambackslash.transformer_api.service.ImageService;
import com.teambackslash.transformer_api.service.ThermalAnalysisService;
import com.teambackslash.transformer_api.entity.Prediction;
import com.teambackslash.transformer_api.repository.PredictionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/images")
@Slf4j
public class ImageController {

    private final ImageService imageService;
    private final ThermalAnalysisService thermalAnalysisService;
    private final PredictionRepository predictionRepository;

    public ImageController(ImageService imageService, ThermalAnalysisService thermalAnalysisService, PredictionRepository predictionRepository) {
        this.imageService = imageService;
        this.thermalAnalysisService = thermalAnalysisService;
        this.predictionRepository = predictionRepository;
    }

    @GetMapping
    public ResponseEntity<List<ImageDTO>> getAllImages() {
        return ResponseEntity.ok(imageService.getAllImages());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ImageDTO> getImageById(@PathVariable Integer id) {
        return ResponseEntity.ok(imageService.getImageById(id));
    }

    @PostMapping
    public ResponseEntity<ImageDTO> createImage(@RequestBody ImageDTO imageDTO) {
        ImageDTO saved = imageService.saveImage(imageDTO);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ImageDTO> updateImage(@PathVariable Integer id,
            @RequestBody ImageDTO imageDTO) {
        imageDTO.setImageId(id); // ensure ID consistency
        ImageDTO updated = imageService.saveImage(imageDTO);
        return ResponseEntity.ok(updated);
    }
    
    @PatchMapping("/{id}")
    public ResponseEntity<ImageDTO> patchImage(@PathVariable Integer id,
            @RequestBody Map<String, Object> updates) {
        ImageDTO updated = imageService.updateImage(id, updates);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable Integer id) {
        imageService.deleteImage(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/baseline")
    public ResponseEntity<ImageDTO> getBaselineImage(
            @RequestParam String transformerNo,
            @RequestParam String weatherCondition) {
        ImageDTO imageDTO = imageService.getBaselineImage(transformerNo, weatherCondition);
        if (imageDTO == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(imageDTO);
    }

    // ===== THERMAL ANALYSIS ENDPOINTS =====

    @PostMapping("/thermal-analysis")
    public ResponseEntity<ThermalAnalysisDTO> analyzeThermalImage(@RequestBody ThermalAnalysisRequestDTO request) {
        log.info("Thermal analysis request: {}", request);
        
        ThermalAnalysisDTO result = thermalAnalysisService.analyzeThermalImage(
            request.getThermalImageUrl(),
            request.getBaselineImageUrl(),
            request.getInspectionId()
        );

        return ResponseEntity.ok(result);
    }

    @GetMapping("/thermal-analysis")
    public ResponseEntity<ThermalAnalysisDTO> analyzeThermalImageByUrl(
        @RequestParam String imageUrl, 
        @RequestParam(required = false) String transformerNo
    ) {
        try {
            ThermalAnalysisDTO analysis = thermalAnalysisService.analyzeThermalImage(imageUrl, transformerNo);
            return ResponseEntity.ok(analysis);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
