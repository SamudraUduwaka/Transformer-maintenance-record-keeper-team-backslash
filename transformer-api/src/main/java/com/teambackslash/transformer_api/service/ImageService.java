package com.teambackslash.transformer_api.service;

import com.teambackslash.transformer_api.dto.ImageDTO;
import com.teambackslash.transformer_api.entity.Image;
import com.teambackslash.transformer_api.exception.ResourceNotFoundException;
import com.teambackslash.transformer_api.mapper.ImageMapper;
import com.teambackslash.transformer_api.repository.ImageRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ImageService {

    private final ImageRepository imageRepository;
    private final ImageMapper imageMapper;

    public ImageService(ImageRepository imageRepository,
                        ImageMapper imageMapper) {
        this.imageRepository = imageRepository;
        this.imageMapper = imageMapper;
    }

    // Get all images as DTOs
    public List<ImageDTO> getAllImages() {
        return imageRepository.findAll().stream()
                .map(imageMapper::toDTO)
                .collect(Collectors.toList());
    }

    // Get image by ID as DTO
    public ImageDTO getImageById(Integer id) {
        Image image = imageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Image not found with ID: " + id
                ));
        return imageMapper.toDTO(image);
    }

    // Save or update image from DTO
    public ImageDTO saveImage(ImageDTO imageDTO) {
        Image image = imageMapper.toEntity(imageDTO);
        image = imageRepository.save(image);
        return imageMapper.toDTO(image);
    }

    // Delete image by ID
    public void deleteImage(Integer id) {
        if (!imageRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Image not found with ID: " + id
            );
        }
        imageRepository.deleteById(id);
    }
}
