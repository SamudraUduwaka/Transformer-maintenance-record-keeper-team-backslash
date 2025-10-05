package com.teambackslash.transformer_api.controller;

import com.teambackslash.transformer_api.dto.PredictionDTO;
import com.teambackslash.transformer_api.service.PythonInferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/inference")
@RequiredArgsConstructor
public class InferenceController {

    private final PythonInferenceService inferenceService;

    @PostMapping(value = "/predict", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PredictionDTO> predict(@RequestPart("file") MultipartFile file) {
        PredictionDTO dto = inferenceService.runInference(file);
        return ResponseEntity.ok(dto);
    }

    public static record ThresholdRequest(double percentage) {}

    @PostMapping("/config/class-threshold")
    public ResponseEntity<Void> setClassThreshold(@RequestBody ThresholdRequest req) {
        inferenceService.updateClassThresholdPercentage(req.percentage());
        return ResponseEntity.noContent().build();
    }
}
