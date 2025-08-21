package com.teambackslash.transformer_api.controller;

import com.teambackslash.transformer_api.dto.InspectionDTO;
import com.teambackslash.transformer_api.service.InspectionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inspections")
public class InspectionController {

    private final InspectionService inspectionService;

    public InspectionController(InspectionService inspectionService) {
        this.inspectionService = inspectionService;
    }

    @GetMapping
    public ResponseEntity<List<InspectionDTO>> getAllInspections() {
        return ResponseEntity.ok(inspectionService.getAllInspections());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InspectionDTO> getInspectionById(@PathVariable Integer id) {
        return ResponseEntity.ok(inspectionService.getInspectionById(id));
    }

    @PostMapping
    public ResponseEntity<InspectionDTO> createInspection(@RequestBody InspectionDTO inspectionDTO) {
        InspectionDTO saved = inspectionService.saveInspection(inspectionDTO);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InspectionDTO> updateInspection(@PathVariable Integer id,
            @RequestBody InspectionDTO inspectionDTO) {
        inspectionDTO.setInspectionId(id); // ensure ID consistency
        InspectionDTO updated = inspectionService.saveInspection(inspectionDTO);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<InspectionDTO> patchInspection(@PathVariable Integer id,
            @RequestBody Map<String, Object> updates) {
        InspectionDTO updated = inspectionService.updateInspection(id, updates);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInspection(@PathVariable Integer id) {
        inspectionService.deleteInspection(id);
        return ResponseEntity.noContent().build();
    }
}
