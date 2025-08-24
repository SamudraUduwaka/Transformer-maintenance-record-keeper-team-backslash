package com.teambackslash.transformer_api.controller;

import com.teambackslash.transformer_api.dto.ImageDTO;
import com.teambackslash.transformer_api.service.ImageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    private final ImageService imageService;

    public ImageController(ImageService imageService) {
        this.imageService = imageService;
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
}
