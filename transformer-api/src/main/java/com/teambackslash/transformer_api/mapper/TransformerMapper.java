package com.teambackslash.transformer_api.mapper;

import com.teambackslash.transformer_api.dto.TransformerDTO;
import com.teambackslash.transformer_api.entity.Transformer;
import org.mapstruct.Mapper;
import java.util.List;

@Mapper(componentModel = "spring", uses = { InspectionMapper.class })
public interface TransformerMapper {

    TransformerDTO toDTO(Transformer transformer);
    Transformer toEntity(TransformerDTO dto);

    List<TransformerDTO> toDTOs(List<Transformer> transformers);
    List<Transformer> toEntities(List<TransformerDTO> dtos);
}

