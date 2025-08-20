package com.teambackslash.transformer_api.mapper;

import com.teambackslash.transformer_api.dto.ImageDTO;
import com.teambackslash.transformer_api.entity.Image;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ImageMapper {

    @Mapping(source = "inspection.inspectionId", target = "inspectionId")
    ImageDTO toDTO(Image image);

    @Mapping(source = "inspectionId", target = "inspection.inspectionId")
    Image toEntity(ImageDTO dto);
}

