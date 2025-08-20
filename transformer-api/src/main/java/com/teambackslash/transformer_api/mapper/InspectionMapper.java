package com.teambackslash.transformer_api.mapper;

import com.teambackslash.transformer_api.dto.InspectionDTO;
import com.teambackslash.transformer_api.entity.Inspection;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import java.util.List;

@Mapper(componentModel = "spring", uses = { ImageMapper.class })
public interface InspectionMapper {

    @Mapping(source = "transformer.transformerNo", target = "transformerNo")
    InspectionDTO toDTO(Inspection inspection);

    @Mapping(source = "transformerNo", target = "transformer.transformerNo")
    Inspection toEntity(InspectionDTO dto);

    List<InspectionDTO> toDTOs(List<Inspection> inspections);
    List<Inspection> toEntities(List<InspectionDTO> dtos);
}

