package com.teambackslash.transformer_api.dto;

import lombok.Data;

@Data
public class WorkContentDTO {
    private Integer itemNo;
    private boolean doCheck;
    private boolean doClean;
    private boolean doTighten;
    private boolean doReplace;
    private String other;
    private String afterInspectionStatus;
    private String afterInspectionNos;
}
