package com.teambackslash.transformer_api.service;

import com.teambackslash.transformer_api.dto.*;
import com.teambackslash.transformer_api.entity.*;
import com.teambackslash.transformer_api.repository.MaintenanceFormRepository;
import com.teambackslash.transformer_api.repository.InspectionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
public class MaintenanceFormService {

    private final MaintenanceFormRepository maintenanceFormRepository;
    private final InspectionRepository inspectionRepository;

    public MaintenanceFormService(MaintenanceFormRepository maintenanceFormRepository,
                                   InspectionRepository inspectionRepository) {
        this.maintenanceFormRepository = maintenanceFormRepository;
        this.inspectionRepository = inspectionRepository;
    }

    @Transactional(readOnly = true)
    public MaintenanceFormDTO getMaintenanceFormByInspectionId(Integer inspectionId) {
        MaintenanceForm form = maintenanceFormRepository.findByInspection_InspectionId(inspectionId)
                .orElse(null);
        
        if (form == null) {
            return null;
        }

        return convertToDTO(form);
    }

    @Transactional
    public MaintenanceFormDTO saveMaintenanceForm(MaintenanceFormDTO dto) {
        Inspection inspection = inspectionRepository.findById(dto.getInspectionId())
                .orElseThrow(() -> new RuntimeException("Inspection not found with id: " + dto.getInspectionId()));

        MaintenanceForm form = maintenanceFormRepository.findByInspection_InspectionId(dto.getInspectionId())
                .orElse(new MaintenanceForm());

        if (form.getMaintenanceFormId() == null) {
            form.setInspection(inspection);
            form.setSubmitted(false);
        }

        // Update ThermalInspection
        ThermalInspection thermalInspection = form.getThermalInspection();
        if (thermalInspection == null) {
            thermalInspection = new ThermalInspection();
            thermalInspection.setMaintenanceForm(form);
            form.setThermalInspection(thermalInspection);
        }
        updateThermalInspection(thermalInspection, dto.getThermalInspection());

        // Update MaintenanceRecord
        MaintenanceRecord maintenanceRecord = form.getMaintenanceRecord();
        if (maintenanceRecord == null) {
            maintenanceRecord = new MaintenanceRecord();
            maintenanceRecord.setMaintenanceForm(form);
            form.setMaintenanceRecord(maintenanceRecord);
        }
        updateMaintenanceRecord(maintenanceRecord, dto.getMaintenanceRecord());

        // Update WorkDataSheet
        WorkDataSheet workDataSheet = form.getWorkDataSheet();
        if (workDataSheet == null) {
            workDataSheet = new WorkDataSheet();
            workDataSheet.setMaintenanceForm(form);
            form.setWorkDataSheet(workDataSheet);
        }
        updateWorkDataSheet(workDataSheet, dto.getWorkDataSheet());

        MaintenanceForm saved = maintenanceFormRepository.save(form);
        
        // Update the inspection's updatedAt timestamp by touching the entity
        inspection.setUpdatedAt(java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Colombo")));
        inspectionRepository.save(inspection);
        
        return convertToDTO(saved);
    }

    @Transactional
    public MaintenanceFormDTO submitMaintenanceForm(Integer inspectionId, MaintenanceFormDTO dto) {
        MaintenanceFormDTO saved = saveMaintenanceForm(dto);
        
        MaintenanceForm form = maintenanceFormRepository.findByInspection_InspectionId(inspectionId)
                .orElseThrow(() -> new RuntimeException("Maintenance form not found"));
        
        form.setSubmitted(true);
        maintenanceFormRepository.save(form);
        
        return saved;
    }

    private void updateThermalInspection(ThermalInspection entity, ThermalInspectionDTO dto) {
        entity.setBranch(dto.getBranch());
        entity.setTransformerNo(dto.getTransformerNo());
        entity.setPoleNumber(dto.getPoleNumber());
        entity.setLocationDetails(dto.getLocationDetails());
        entity.setInspectionDate(dto.getInspectionDate());
        entity.setInspectionTime(dto.getInspectionTime());
        entity.setInspectedBy(dto.getInspectedBy());
        entity.setBaselineImagingRightNo(dto.getBaselineImagingRightNo());
        entity.setBaselineImagingLeftNo(dto.getBaselineImagingLeftNo());
        entity.setLastMonthKva(dto.getLastMonthKva());
        entity.setLastMonthDate(dto.getLastMonthDate());
        entity.setLastMonthTime(dto.getLastMonthTime());
        entity.setCurrentMonthKva(dto.getCurrentMonthKva());
        entity.setBaselineCondition(dto.getBaselineCondition());
        entity.setTransformerType(dto.getTransformerType());
        entity.setMeterSerial(dto.getMeterSerial());
        entity.setMeterCtRatio(dto.getMeterCtRatio());
        entity.setMeterMake(dto.getMeterMake());
        entity.setAfterThermalDate(dto.getAfterThermalDate());
        entity.setAfterThermalTime(dto.getAfterThermalTime());
        entity.setFirstInspectionVoltageR(dto.getFirstInspectionVoltageR());
        entity.setFirstInspectionVoltageY(dto.getFirstInspectionVoltageY());
        entity.setFirstInspectionVoltageB(dto.getFirstInspectionVoltageB());
        entity.setFirstInspectionCurrentR(dto.getFirstInspectionCurrentR());
        entity.setFirstInspectionCurrentY(dto.getFirstInspectionCurrentY());
        entity.setFirstInspectionCurrentB(dto.getFirstInspectionCurrentB());
        entity.setSecondInspectionVoltageR(dto.getSecondInspectionVoltageR());
        entity.setSecondInspectionVoltageY(dto.getSecondInspectionVoltageY());
        entity.setSecondInspectionVoltageB(dto.getSecondInspectionVoltageB());
        entity.setSecondInspectionCurrentR(dto.getSecondInspectionCurrentR());
        entity.setSecondInspectionCurrentY(dto.getSecondInspectionCurrentY());
        entity.setSecondInspectionCurrentB(dto.getSecondInspectionCurrentB());

        // Update work content
        if (entity.getWorkContent() == null) {
            entity.setWorkContent(new ArrayList<>());
        }
        entity.getWorkContent().clear();
        
        if (dto.getWorkContent() != null) {
            for (WorkContentDTO wcDto : dto.getWorkContent()) {
                WorkContent wc = new WorkContent();
                wc.setThermalInspection(entity);
                wc.setItemNo(wcDto.getItemNo());
                wc.setDoCheck(wcDto.isDoCheck());
                wc.setDoClean(wcDto.isDoClean());
                wc.setDoTighten(wcDto.isDoTighten());
                wc.setDoReplace(wcDto.isDoReplace());
                wc.setOther(wcDto.getOther());
                wc.setAfterInspectionStatus(wcDto.getAfterInspectionStatus());
                wc.setAfterInspectionNos(wcDto.getAfterInspectionNos());
                entity.getWorkContent().add(wc);
            }
        }
    }

    private void updateMaintenanceRecord(MaintenanceRecord entity, MaintenanceRecordDTO dto) {
        entity.setStartTime(dto.getStartTime());
        entity.setCompletionTime(dto.getCompletionTime());
        entity.setSupervisedBy(dto.getSupervisedBy());
        entity.setTech1(dto.getTech1());
        entity.setTech2(dto.getTech2());
        entity.setTech3(dto.getTech3());
        entity.setHelpers(dto.getHelpers());
        entity.setMaintenanceInspectedBy(dto.getMaintenanceInspectedBy());
        entity.setMaintenanceInspectedDate(dto.getMaintenanceInspectedDate());
        entity.setMaintenanceRectifiedBy(dto.getMaintenanceRectifiedBy());
        entity.setMaintenanceRectifiedDate(dto.getMaintenanceRectifiedDate());
        entity.setMaintenanceReinspectedBy(dto.getMaintenanceReinspectedBy());
        entity.setMaintenanceReinspectedDate(dto.getMaintenanceReinspectedDate());
        entity.setCssOfficer(dto.getCssOfficer());
        entity.setCssDate(dto.getCssDate());
        entity.setAllSpotsCorrectedBy(dto.getAllSpotsCorrectedBy());
        entity.setAllSpotsCorrectedDate(dto.getAllSpotsCorrectedDate());
    }

    private void updateWorkDataSheet(WorkDataSheet entity, WorkDataSheetDTO dto) {
        entity.setGangLeader(dto.getGangLeader());
        entity.setJobDate(dto.getJobDate());
        entity.setJobStartTime(dto.getJobStartTime());
        entity.setSerialNo(dto.getSerialNo());
        entity.setKvaRating(dto.getKvaRating());
        entity.setTapPosition(dto.getTapPosition());
        entity.setCtRatio(dto.getCtRatio());
        entity.setEarthResistance(dto.getEarthResistance());
        entity.setNeutral(dto.getNeutral());
        entity.setSurgeChecked(dto.isSurgeChecked());
        entity.setBodyChecked(dto.isBodyChecked());
        entity.setFdsFuseF1(dto.getFdsFuseF1());
        entity.setFdsFuseF2(dto.getFdsFuseF2());
        entity.setFdsFuseF3(dto.getFdsFuseF3());
        entity.setFdsFuseF4(dto.getFdsFuseF4());
        entity.setFdsFuseF5(dto.getFdsFuseF5());
        entity.setJobCompletedTime(dto.getJobCompletedTime());
        entity.setNotes(dto.getNotes());

        // Update materials
        if (entity.getMaterials() == null) {
            entity.setMaterials(new ArrayList<>());
        }
        entity.getMaterials().clear();
        
        if (dto.getMaterials() != null) {
            for (MaterialDTO matDto : dto.getMaterials()) {
                Material mat = new Material();
                mat.setWorkDataSheet(entity);
                mat.setDescription(matDto.getDescription());
                mat.setCode(matDto.getCode());
                mat.setUsed(matDto.isUsed());
                entity.getMaterials().add(mat);
            }
        }
    }

    private MaintenanceFormDTO convertToDTO(MaintenanceForm form) {
        MaintenanceFormDTO dto = new MaintenanceFormDTO();
        dto.setInspectionId(form.getInspection().getInspectionId());
        dto.setTransformerNo(form.getInspection().getTransformer().getTransformerNo());

        // Convert ThermalInspection
        if (form.getThermalInspection() != null) {
            dto.setThermalInspection(convertThermalInspectionToDTO(form.getThermalInspection()));
        }

        // Convert MaintenanceRecord
        if (form.getMaintenanceRecord() != null) {
            dto.setMaintenanceRecord(convertMaintenanceRecordToDTO(form.getMaintenanceRecord()));
        }

        // Convert WorkDataSheet
        if (form.getWorkDataSheet() != null) {
            dto.setWorkDataSheet(convertWorkDataSheetToDTO(form.getWorkDataSheet()));
        }

        return dto;
    }

    private ThermalInspectionDTO convertThermalInspectionToDTO(ThermalInspection entity) {
        ThermalInspectionDTO dto = new ThermalInspectionDTO();
        dto.setBranch(entity.getBranch());
        dto.setTransformerNo(entity.getTransformerNo());
        dto.setPoleNumber(entity.getPoleNumber());
        dto.setLocationDetails(entity.getLocationDetails());
        dto.setInspectionDate(entity.getInspectionDate());
        dto.setInspectionTime(entity.getInspectionTime());
        dto.setInspectedBy(entity.getInspectedBy());
        dto.setBaselineImagingRightNo(entity.getBaselineImagingRightNo());
        dto.setBaselineImagingLeftNo(entity.getBaselineImagingLeftNo());
        dto.setLastMonthKva(entity.getLastMonthKva());
        dto.setLastMonthDate(entity.getLastMonthDate());
        dto.setLastMonthTime(entity.getLastMonthTime());
        dto.setCurrentMonthKva(entity.getCurrentMonthKva());
        dto.setBaselineCondition(entity.getBaselineCondition());
        dto.setTransformerType(entity.getTransformerType());
        dto.setMeterSerial(entity.getMeterSerial());
        dto.setMeterCtRatio(entity.getMeterCtRatio());
        dto.setMeterMake(entity.getMeterMake());
        dto.setAfterThermalDate(entity.getAfterThermalDate());
        dto.setAfterThermalTime(entity.getAfterThermalTime());
        dto.setFirstInspectionVoltageR(entity.getFirstInspectionVoltageR());
        dto.setFirstInspectionVoltageY(entity.getFirstInspectionVoltageY());
        dto.setFirstInspectionVoltageB(entity.getFirstInspectionVoltageB());
        dto.setFirstInspectionCurrentR(entity.getFirstInspectionCurrentR());
        dto.setFirstInspectionCurrentY(entity.getFirstInspectionCurrentY());
        dto.setFirstInspectionCurrentB(entity.getFirstInspectionCurrentB());
        dto.setSecondInspectionVoltageR(entity.getSecondInspectionVoltageR());
        dto.setSecondInspectionVoltageY(entity.getSecondInspectionVoltageY());
        dto.setSecondInspectionVoltageB(entity.getSecondInspectionVoltageB());
        dto.setSecondInspectionCurrentR(entity.getSecondInspectionCurrentR());
        dto.setSecondInspectionCurrentY(entity.getSecondInspectionCurrentY());
        dto.setSecondInspectionCurrentB(entity.getSecondInspectionCurrentB());

        if (entity.getWorkContent() != null) {
            dto.setWorkContent(entity.getWorkContent().stream()
                    .map(this::convertWorkContentToDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private WorkContentDTO convertWorkContentToDTO(WorkContent entity) {
        WorkContentDTO dto = new WorkContentDTO();
        dto.setItemNo(entity.getItemNo());
        dto.setDoCheck(entity.isDoCheck());
        dto.setDoClean(entity.isDoClean());
        dto.setDoTighten(entity.isDoTighten());
        dto.setDoReplace(entity.isDoReplace());
        dto.setOther(entity.getOther());
        dto.setAfterInspectionStatus(entity.getAfterInspectionStatus());
        dto.setAfterInspectionNos(entity.getAfterInspectionNos());
        return dto;
    }

    private MaintenanceRecordDTO convertMaintenanceRecordToDTO(MaintenanceRecord entity) {
        MaintenanceRecordDTO dto = new MaintenanceRecordDTO();
        dto.setStartTime(entity.getStartTime());
        dto.setCompletionTime(entity.getCompletionTime());
        dto.setSupervisedBy(entity.getSupervisedBy());
        dto.setTech1(entity.getTech1());
        dto.setTech2(entity.getTech2());
        dto.setTech3(entity.getTech3());
        dto.setHelpers(entity.getHelpers());
        dto.setMaintenanceInspectedBy(entity.getMaintenanceInspectedBy());
        dto.setMaintenanceInspectedDate(entity.getMaintenanceInspectedDate());
        dto.setMaintenanceRectifiedBy(entity.getMaintenanceRectifiedBy());
        dto.setMaintenanceRectifiedDate(entity.getMaintenanceRectifiedDate());
        dto.setMaintenanceReinspectedBy(entity.getMaintenanceReinspectedBy());
        dto.setMaintenanceReinspectedDate(entity.getMaintenanceReinspectedDate());
        dto.setCssOfficer(entity.getCssOfficer());
        dto.setCssDate(entity.getCssDate());
        dto.setAllSpotsCorrectedBy(entity.getAllSpotsCorrectedBy());
        dto.setAllSpotsCorrectedDate(entity.getAllSpotsCorrectedDate());
        return dto;
    }

    private WorkDataSheetDTO convertWorkDataSheetToDTO(WorkDataSheet entity) {
        WorkDataSheetDTO dto = new WorkDataSheetDTO();
        dto.setGangLeader(entity.getGangLeader());
        dto.setJobDate(entity.getJobDate());
        dto.setJobStartTime(entity.getJobStartTime());
        dto.setSerialNo(entity.getSerialNo());
        dto.setKvaRating(entity.getKvaRating());
        dto.setTapPosition(entity.getTapPosition());
        dto.setCtRatio(entity.getCtRatio());
        dto.setEarthResistance(entity.getEarthResistance());
        dto.setNeutral(entity.getNeutral());
        dto.setSurgeChecked(entity.isSurgeChecked());
        dto.setBodyChecked(entity.isBodyChecked());
        dto.setFdsFuseF1(entity.getFdsFuseF1());
        dto.setFdsFuseF2(entity.getFdsFuseF2());
        dto.setFdsFuseF3(entity.getFdsFuseF3());
        dto.setFdsFuseF4(entity.getFdsFuseF4());
        dto.setFdsFuseF5(entity.getFdsFuseF5());
        dto.setJobCompletedTime(entity.getJobCompletedTime());
        dto.setNotes(entity.getNotes());

        if (entity.getMaterials() != null) {
            dto.setMaterials(entity.getMaterials().stream()
                    .map(this::convertMaterialToDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private MaterialDTO convertMaterialToDTO(Material entity) {
        MaterialDTO dto = new MaterialDTO();
        dto.setDescription(entity.getDescription());
        dto.setCode(entity.getCode());
        dto.setUsed(entity.isUsed());
        return dto;
    }
}
