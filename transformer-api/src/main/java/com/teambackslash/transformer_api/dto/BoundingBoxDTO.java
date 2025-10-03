package com.teambackslash.transformer_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.ToString;
@AllArgsConstructor
@Data
@ToString
public class BoundingBoxDTO {
    private Integer x;
    private Integer y;
    private Integer width;
    private Integer height;

}