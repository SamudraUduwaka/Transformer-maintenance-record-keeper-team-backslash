package com.teambackslash.transformer_api.controller;

import com.teambackslash.transformer_api.dto.MaintenanceFormDTO;
import com.teambackslash.transformer_api.service.MaintenanceFormService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inspections")
public class MaintenanceFormController {

    private final MaintenanceFormService maintenanceFormService;

    public MaintenanceFormController(MaintenanceFormService maintenanceFormService) {
        this.maintenanceFormService = maintenanceFormService;
    }

    /**
     * Get maintenance form data for a specific inspection
     */
    @GetMapping("/{inspectionId}/maintenance-form")
    public ResponseEntity<MaintenanceFormDTO> getMaintenanceForm(@PathVariable Integer inspectionId) {
        MaintenanceFormDTO dto = maintenanceFormService.getMaintenanceFormByInspectionId(inspectionId);
        
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(dto);
    }

    /**
     * Create a new maintenance form
     */
    @PostMapping("/maintenance-form")
    public ResponseEntity<MaintenanceFormDTO> createMaintenanceForm(@RequestBody MaintenanceFormDTO dto) {
        MaintenanceFormDTO saved = maintenanceFormService.saveMaintenanceForm(dto);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    /**
     * Update an existing maintenance form
     */
    @PutMapping("/{inspectionId}/maintenance-form")
    public ResponseEntity<MaintenanceFormDTO> updateMaintenanceForm(
            @PathVariable Integer inspectionId,
            @RequestBody MaintenanceFormDTO dto) {
        
        dto.setInspectionId(inspectionId);
        MaintenanceFormDTO updated = maintenanceFormService.saveMaintenanceForm(dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Submit final maintenance form
     */
    @PostMapping("/{inspectionId}/maintenance-form/submit")
    public ResponseEntity<MaintenanceFormDTO> submitMaintenanceForm(
            @PathVariable Integer inspectionId,
            @RequestBody MaintenanceFormDTO dto) {
        
        dto.setInspectionId(inspectionId);
        MaintenanceFormDTO submitted = maintenanceFormService.submitMaintenanceForm(inspectionId, dto);
        return ResponseEntity.ok(submitted);
    }
}
