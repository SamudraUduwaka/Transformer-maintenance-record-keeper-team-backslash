package com.teambackslash.transformer_api.controller;

import com.teambackslash.transformer_api.dto.TransformerDTO;
import com.teambackslash.transformer_api.service.TransformerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transformers")
public class TransformerController {

    private final TransformerService transformerService;

    public TransformerController(TransformerService transformerService) {
        this.transformerService = transformerService;
    }

    @GetMapping
    public ResponseEntity<List<TransformerDTO>> getAllTransformers() {
        return ResponseEntity.ok(transformerService.getAllTransformers());
    }

    @GetMapping("/{transformerNo}")
    public ResponseEntity<TransformerDTO> getTransformerById(@PathVariable String transformerNo) {
        return ResponseEntity.ok(transformerService.getTransformerById(transformerNo));
    }

    @PostMapping
    public ResponseEntity<TransformerDTO> createTransformer(@RequestBody TransformerDTO transformerDTO) {
        TransformerDTO saved = transformerService.saveTransformer(transformerDTO);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{transformerNo}")
    public ResponseEntity<TransformerDTO> updateTransformer(@PathVariable String transformerNo,
                                                            @RequestBody TransformerDTO transformerDTO) {
        transformerDTO.setTransformerNo(transformerNo); // ensure ID consistency
        TransformerDTO updated = transformerService.saveTransformer(transformerDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{transformerNo}")
    public ResponseEntity<Void> deleteTransformer(@PathVariable String transformerNo) {
        transformerService.deleteTransformer(transformerNo);
        return ResponseEntity.noContent().build();
    }
}
