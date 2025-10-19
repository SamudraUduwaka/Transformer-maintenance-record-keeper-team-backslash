package com.teambackslash.transformer_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data                   // generates getters, setters, toString, equals, hashCode
@AllArgsConstructor     
@NoArgsConstructor      
public class ErrorResponse {
    private int status;
    private String message;
    private long timestamp;
}
