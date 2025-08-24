package com.teambackslash.transformer_api.mapper;

import com.teambackslash.transformer_api.dto.ImageDTO;
import com.teambackslash.transformer_api.entity.Image;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ImageMapper {

    @Mapping(source = "inspection.inspectionId", target = "inspectionId")
    @Mapping(source = "transformer.transformerNo", target = "transformerNo")
    ImageDTO toDTO(Image image);

    @Mapping(source = "inspectionId", target = "inspection.inspectionId")
    @Mapping(source = "transformerNo", target = "transformer.transformerNo")
    Image toEntity(ImageDTO dto);
}

