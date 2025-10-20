package com.teambackslash.transformer_api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true) 
@Data
public class TransformerDTO {
    private String transformerNo;
    private String poleNo;           
    private String region;
    private String type;
    private String location;         
    private Boolean favorite;        
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<InspectionDTO> inspections;
}
