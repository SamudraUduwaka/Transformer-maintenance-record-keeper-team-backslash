package com.teambackslash.transformer_api.service;

import com.teambackslash.transformer_api.dto.BoundingBoxDTO;
import com.teambackslash.transformer_api.dto.ThermalAnalysisDTO;
import com.teambackslash.transformer_api.dto.ThermalIssueDTO;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.net.URI;
import java.net.URL;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ThermalAnalysisService {

    private static final Random random = new Random();
    
    // Thermal issue types based on the specifications
    private static final Map<String, ThermalIssueConfig> THERMAL_ISSUE_TYPES = Map.of(
        "Loose Joint (Faulty)", new ThermalIssueConfig("Loose Joint (Faulty)", "critical",
            "Middle area reddish/orange-yellowish, background blue/black", 
            Arrays.asList("Immediate inspection required", "Tighten connections", "Schedule emergency maintenance")),
        "Loose Joint (Potential)", new ThermalIssueConfig("Loose Joint (Potential)", "warning",
            "Middle area yellowish (not reddish/orange), background blue/black",
            Arrays.asList("Schedule inspection within 30 days", "Monitor temperature trends", "Check connection torque")),
        "Point Overload (Faulty)", new ThermalIssueConfig("Point Overload (Faulty)", "critical",
            "Small spot reddish/orange-yellowish, rest of the wire black/blue or yellowish",
            Arrays.asList("Immediate load assessment required", "Check electrical connections", "Emergency maintenance needed")),
        "Point Overload (Potential)", new ThermalIssueConfig("Point Overload (Potential)", "warning",
            "Small spot yellowish, rest of the wire black/blue",
            Arrays.asList("Monitor load conditions", "Schedule inspection", "Check for loose connections")),
        "Full Wire Overload", new ThermalIssueConfig("Full Wire Overload", "critical",
            "The entire wire is reddish or yellowish",
            Arrays.asList("Immediate load reduction required", "Emergency inspection needed", "Check circuit capacity"))
    );

    public ThermalAnalysisDTO analyzeThermalImage(String imageUrl) {
        long startTime = System.currentTimeMillis();
        
        try {
            // Download and validate the image
            BufferedImage image = downloadImage(imageUrl);
            
            // Generate random thermal issues based on the image dimensions
            List<ThermalIssueDTO> issues = generateRandomThermalIssues(image.getWidth(), image.getHeight());
            
            // Calculate overall score based on issues
            double overallScore = calculateOverallScore(issues);
            
            long processingTime = System.currentTimeMillis() - startTime;
            
            return new ThermalAnalysisDTO(
                imageUrl,
                LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                issues,
                overallScore,
                processingTime
            );
            
        } catch (IOException e) {
            throw new RuntimeException("Failed to download or process thermal image: " + e.getMessage(), e);
        }
    }

    private BufferedImage downloadImage(String imageUrl) throws IOException {
        try {
            URI uri = URI.create(imageUrl);
            URL url = uri.toURL();
            BufferedImage image = ImageIO.read(url);
            if (image == null) {
                throw new IOException("Invalid image format or corrupted image");
            }
            return image;
        } catch (Exception e) {
            throw new IOException("Failed to download image from URL: " + imageUrl, e);
        }
    }

    private List<ThermalIssueDTO> generateRandomThermalIssues(int imageWidth, int imageHeight) {
        List<ThermalIssueDTO> issues = new ArrayList<>();
        
        // Generate 2-5 random issues (only actual problems, no normal conditions)
        int numIssues = random.nextInt(4) + 2;
        
        for (int i = 0; i < numIssues; i++) {
            String issueType = selectRandomIssueType();
            ThermalIssueConfig config = THERMAL_ISSUE_TYPES.get(issueType);
            BoundingBoxDTO boundingBox = generateRandomBoundingBox(imageWidth, imageHeight, issueType);
            
            ThermalIssueDTO issue = new ThermalIssueDTO(
                UUID.randomUUID().toString(),
                issueType,
                config.severity,
                generateConfidenceScore(config.severity),
                boundingBox,
                config.description,
                config.recommendations
            );
            
            issues.add(issue);
        }
        
        return issues;
    }

    private String selectRandomIssueType() {
        // Select from actual issue types only (no normal conditions)
        String[] issueTypes = {
            "Loose Joint (Faulty)",
            "Loose Joint (Potential)", 
            "Point Overload (Faulty)",
            "Point Overload (Potential)",
            "Full Wire Overload"
        };
        
        return issueTypes[random.nextInt(issueTypes.length)];
    }

    private BoundingBoxDTO generateRandomBoundingBox(int imageWidth, int imageHeight, String issueType) {
        // Generate appropriate size based on issue type
        int width, height;
        
        switch (issueType) {
            case "Point Overload (Faulty)", "Point Overload (Potential)" -> {
                // Small spots for point overloads
                width = random.nextInt(60) + 30;  // 30-90 pixels
                height = random.nextInt(60) + 30;
            }
            case "Full Wire Overload" -> {
                // Larger areas for wire overloads
                width = random.nextInt(200) + 100; // 100-300 pixels
                height = random.nextInt(100) + 50;  // 50-150 pixels
            }
            default -> {
                // Medium areas for joint issues
                width = random.nextInt(120) + 60;  // 60-180 pixels
                height = random.nextInt(120) + 60;
            }
        }
        
        // Ensure bounding box fits within image
        width = Math.min(width, imageWidth - 20);
        height = Math.min(height, imageHeight - 20);
        
        int x = random.nextInt(Math.max(1, imageWidth - width));
        int y = random.nextInt(Math.max(1, imageHeight - height));
        
        return new BoundingBoxDTO(x, y, width, height);
    }

    private double generateConfidenceScore(String severity) {
        return switch (severity) {
            case "critical" -> 0.8 + (random.nextDouble() * 0.2); // 0.8-1.0
            case "warning" -> 0.6 + (random.nextDouble() * 0.3);  // 0.6-0.9
            default -> 0.7 + (random.nextDouble() * 0.2);         // 0.7-0.9 fallback
        };
    }

    private double calculateOverallScore(List<ThermalIssueDTO> issues) {
        double score = 100.0;
        
        for (ThermalIssueDTO issue : issues) {
            switch (issue.getSeverity()) {
                case "critical" -> score -= 15.0;
                case "warning" -> score -= 5.0;
                // Only actual issues affect the score
            }
        }
        
        return Math.max(score, 0.0);
    }

    // Inner class for thermal issue configuration
    private static class ThermalIssueConfig {
        final String severity;
        final String description;
        final List<String> recommendations;

        ThermalIssueConfig(String type, String severity, String description, List<String> recommendations) {
            this.severity = severity;
            this.description = description;
            this.recommendations = recommendations;
        }
    }
}