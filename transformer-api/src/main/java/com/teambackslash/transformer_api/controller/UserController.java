package com.teambackslash.transformer_api.controller;

import com.teambackslash.transformer_api.dto.auth.UserDto;
import com.teambackslash.transformer_api.dto.user.UpdateUserRequest;
import com.teambackslash.transformer_api.entity.User;
import com.teambackslash.transformer_api.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName(); // Get email from JWT
            UserDto updatedUser = userService.updateProfile(userEmail, request);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    record ErrorResponse(String message) {}
}
