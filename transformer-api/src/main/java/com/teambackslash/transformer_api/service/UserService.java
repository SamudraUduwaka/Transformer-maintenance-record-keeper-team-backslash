package com.teambackslash.transformer_api.service;

import com.teambackslash.transformer_api.dto.auth.UserDto;
import com.teambackslash.transformer_api.dto.user.UpdateUserRequest;
import com.teambackslash.transformer_api.entity.User;
import com.teambackslash.transformer_api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    
    @Transactional
    public UserDto updateProfile(String email, UpdateUserRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if email is being changed and if it's already taken
        if (!user.getEmail().equals(request.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email is already in use");
            }
        }
        
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        
        User updatedUser = userRepository.save(user);
        
        return UserDto.builder()
                .id(updatedUser.getId())
                .name(updatedUser.getName())
                .email(updatedUser.getEmail())
                .avatar(updatedUser.getAvatar())
                .role(updatedUser.getRole())
                .build();
    }
}
