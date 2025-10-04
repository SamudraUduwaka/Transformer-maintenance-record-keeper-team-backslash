package com.teambackslash.transformer_api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teambackslash.transformer_api.dto.DetectionDTO;
import com.teambackslash.transformer_api.dto.BoundingBoxDTO;
import com.teambackslash.transformer_api.dto.PredictionDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.net.URI;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PythonInferenceService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${inference.python:python}")
    private String pythonCommand;

    @Value("${inference.script.path:anomaly-detector/Fault Detection v11-2/seg_infer_and_label_5c.py}")
    private String scriptPath;

    @Value("${inference.weights.path:anomaly-detector/Fault Detection v11/runs_yolo/tx_seg_5c_v11_cpu2/weights/best.pt}")
    private String weightsPath;

    @Value("${inference.temp.dir:inference-uploads}")
    private String uploadDir;

    public PredictionDTO runInference(MultipartFile file) {
        try {
            // Ensure upload dir exists
            Path uploadRoot = Path.of(uploadDir);
            Files.createDirectories(uploadRoot);
            String savedName = UUID.randomUUID() + "-" + file.getOriginalFilename();
            Path savedPath = uploadRoot.resolve(savedName);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, savedPath, StandardCopyOption.REPLACE_EXISTING);
            }

            // Validate script and weights exist (helpful diagnostics)
            Path script = Path.of(scriptPath);
            Path weights = Path.of(weightsPath);
            if (!Files.exists(script)) {
                throw new RuntimeException("Script not found: " + script.toAbsolutePath());
            }
            if (!Files.exists(weights)) {
                throw new RuntimeException("Weights not found: " + weights.toAbsolutePath());
            }

            // Build command
            List<String> cmd = new ArrayList<>();
            cmd.add(pythonCommand);
            cmd.add(scriptPath);
            cmd.add("--weights");
            cmd.add(weightsPath);
            cmd.add("--source");
            cmd.add(savedPath.toString());
            cmd.add("--out");
            cmd.add(uploadDir + "/pred-" + UUID.randomUUID());
            cmd.add("--conf");
            cmd.add("0.25");
            cmd.add("--iou");
            cmd.add("0.025");
            cmd.add("--imgsz");
            cmd.add("640");
            cmd.add("--stdout_json");

            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true); // merge stderr for easier debugging
            Process p = pb.start();

            String line = null;
            StringBuilder fullLog = new StringBuilder();
            try (BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
                String l;
                while ((l = br.readLine()) != null) {
                    fullLog.append(l).append('\n');
                    if (l.startsWith("{") && l.contains("\"image\"")) {
                        line = l; // last JSON line
                    }
                }
            }
            int code = p.waitFor();
            if (code != 0) {
                throw new RuntimeException("Python inference failed with exit code " + code + "\nCommand: " + String.join(" ", cmd) + "\nOutput:\n" + fullLog);
            }
            if (line == null) {
                throw new RuntimeException("No JSON prediction captured from Python script output. Full log:\n" + fullLog);
            }

            JsonNode root = objectMapper.readTree(line);
            String image = root.path("image").asText();
            String predLabel = root.path("pred_image_label").asText();
            String timestamp = root.path("timestamp").asText();

            List<DetectionDTO> detections = new ArrayList<>();
            for (JsonNode det : root.withArray("detections")) {
                Integer classId = det.path("class_id").isMissingNode() ? null : det.path("class_id").asInt();
                String className = det.path("class_name").asText();
                String reason = det.path("reason").asText();
                Double conf = det.path("confidence").asDouble();
                List<List<Double>> polygon = new ArrayList<>();
                for (JsonNode pt : det.withArray("polygon_xy")) {
                    List<Double> pair = new ArrayList<>();
                    pair.add(pt.get(0).asDouble());
                    pair.add(pt.get(1).asDouble());
                    polygon.add(pair);
                }
                // Derive simple axis-aligned bounding box from polygon
                int minX = Integer.MAX_VALUE, minY = Integer.MAX_VALUE, maxX = Integer.MIN_VALUE, maxY = Integer.MIN_VALUE;
                for (List<Double> ptPair : polygon) {
                    int px = ptPair.get(0).intValue();
                    int py = ptPair.get(1).intValue();
                    if (px < minX) minX = px;
                    if (py < minY) minY = py;
                    if (px > maxX) maxX = px;
                    if (py > maxY) maxY = py;
                }
                BoundingBoxDTO box = new BoundingBoxDTO(minX, minY, Math.max(0, maxX - minX), Math.max(0, maxY - minY));
                detections.add(new DetectionDTO(classId, className, reason, conf, polygon, box));
            }

            return new PredictionDTO(image, predLabel, detections, timestamp, line);
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("Inference error: " + e.getMessage(), e);
        }
    }

    public PredictionDTO runInferenceFromUrl(String imageUrl) {
        try (InputStream in = URI.create(imageUrl).toURL().openStream()) {
            byte[] data = in.readAllBytes();
            String originalName = extractName(imageUrl);
            String contentType = guessContentType(originalName);
            MultipartFile mf = new InMemoryMultipartFile("file", originalName, contentType, data);
            return runInference(mf);
        } catch (IOException e) {
            throw new RuntimeException("Failed to download image from URL: " + imageUrl, e);
        }
    }

    private String extractName(String url) {
        int idx = url.lastIndexOf('/') ;
        if (idx >=0 && idx < url.length()-1) return url.substring(idx+1);
        return "image.jpg";
    }

    private String guessContentType(String name) {
        String lower = name.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".bmp")) return "image/bmp";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg"; // default
    }

    /** Simple in-memory MultipartFile implementation to avoid depending on spring-test's MockMultipartFile */
    private static class InMemoryMultipartFile implements MultipartFile {
        private final String name;
        private final String originalFilename;
        private final String contentType;
        private final byte[] content;

        InMemoryMultipartFile(String name, String originalFilename, String contentType, byte[] content) {
            this.name = name;
            this.originalFilename = originalFilename;
            this.contentType = contentType;
            this.content = content != null ? content : new byte[0];
        }

        @Override public String getName() { return name; }
        @Override public String getOriginalFilename() { return originalFilename; }
        @Override public String getContentType() { return contentType; }
        @Override public boolean isEmpty() { return content.length == 0; }
        @Override public long getSize() { return content.length; }
        @Override public byte[] getBytes() { return content.clone(); }
        @Override public InputStream getInputStream() { return new ByteArrayInputStream(content); }
        @Override public void transferTo(File dest) throws IOException { try (FileOutputStream fos = new FileOutputStream(dest)) { fos.write(content); } }
    }
}
