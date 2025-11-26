package com.teambackslash.transformer_api.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class WorkDataSheetDTO {
    // Gang Leader & Job Details
    private String gangLeader;
    private LocalDateTime jobDate;
    private LocalDateTime jobStartTime;

    // Transformer Details
    private String serialNo;
    private String kvaRating;
    private String tapPosition;
    private String ctRatio;
    private String earthResistance;
    private String neutral;

    // Checks
    private boolean surgeChecked;
    private boolean bodyChecked;

    // FDS Fuse Details
    private String fdsFuseF1;
    private String fdsFuseF2;
    private String fdsFuseF3;
    private String fdsFuseF4;
    private String fdsFuseF5;

    // Job Completion
    private LocalDateTime jobCompletedTime;

    // Notes
    private String notes;

    // Materials
    private List<MaterialDTO> materials;
}
