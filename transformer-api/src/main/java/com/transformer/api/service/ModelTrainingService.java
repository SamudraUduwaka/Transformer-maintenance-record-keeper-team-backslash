package com.transformer.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

@Service
public class ModelTrainingService {
    private static final Logger logger = Logger.getLogger(ModelTrainingService.class.getName());

    private final JdbcTemplate jdbcTemplate;

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    @Value("${inference.weights.path}")
    private String weightsPath;

    @Value("${inference.python}")
    private String pythonPath;

    private static final int REQUIRED_SAMPLE_COUNT = 64;
    private static final String DATASET_PATH = "C:/Transformer-maintenance-record-keeper-team-backslash/anomaly-detector/Dataset";
    private static final String OUTPUT_PATH = "C:/Transformer-maintenance-record-keeper-team-backslash/anomaly-detector/Fault Detection v11-2/combined_dataset";

    public ModelTrainingService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Scheduled(fixedDelay = 1, timeUnit = TimeUnit.HOURS)
    public void checkAndTriggerTraining() {
        int manuallyEditedCount = getManuallyEditedImagesCount();
        
        if (manuallyEditedCount >= REQUIRED_SAMPLE_COUNT) {
            logger.info("Found " + manuallyEditedCount + " manually edited images. Starting model retraining...");
            startModelTraining();
        }
    }

    private int getManuallyEditedImagesCount() {
        String sql = "SELECT COUNT(DISTINCT p.id) FROM prediction p " +
                    "JOIN prediction_detection pd ON p.id = pd.prediction_id " +
                    "WHERE pd.manually_edited = true";
        
        return jdbcTemplate.queryForObject(sql, Integer.class);
    }

    private void startModelTraining() {
        try {
            // Extract database details from URL
            String dbHost = dbUrl.split("//")[1].split(":")[0];
            String dbName = dbUrl.split("/")[3].split("\\?")[0];

            // Prepare training command
            ProcessBuilder pb = new ProcessBuilder(
                pythonPath,
                "C:/Transformer-maintenance-record-keeper-team-backslash/anomaly-detector/Fault Detection v11-2/finetune.py",
                "--best-pt", weightsPath,
                "--dataset", DATASET_PATH,
                "--output", OUTPUT_PATH,
                "--db-host", dbHost,
                "--db-user", dbUsername,
                "--db-pass", dbPassword,
                "--db-name", dbName
            );

            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Log the training output
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    logger.info("Training: " + line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                logger.info("Model training completed successfully");
            } else {
                logger.warning("Model training failed with exit code: " + exitCode);
            }

        } catch (IOException | InterruptedException e) {
            logger.severe("Error during model training: " + e.getMessage());
        }
    }
}