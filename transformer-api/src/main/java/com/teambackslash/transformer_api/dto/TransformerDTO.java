package com.teambackslash.transformer_api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true) // tolerate extra fields from client
@Data
public class TransformerDTO {
    private String transformerNo;
    private String poleNo;           // now String
    private String region;
    private String type;
    private String location;         // new
    private Boolean favorite;        // new
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<InspectionDTO> inspections;
}
