package com.teambackslash.transformer_api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.Map;

@Service
public class ModelTrainingService {
    private static final Logger logger = LoggerFactory.getLogger(ModelTrainingService.class);

    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;

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

    @Value("${inference.training.enabled:false}")
    private boolean trainingEnabled;

    @Value("${inference.training.dataset.path}")
    private String datasetPath;

    @Value("${inference.training.output.path}")
    private String outputPath;

    @Value("${inference.training.script.path}")
    private String trainingScriptPath;

    public ModelTrainingService(JdbcTemplate jdbcTemplate) {
        this.namedParameterJdbcTemplate = new NamedParameterJdbcTemplate(jdbcTemplate);
    }

    @PostConstruct
    public void init() {
        logger.info("Model training service initialized");
    }

    @Scheduled(cron = "${inference.training.cron}")  // Runs at configured time
    public void checkAndTriggerTraining() {
        // Test print to verify scheduler is working
        logger.info("\n\n==================================================");
        logger.info("SCHEDULER TEST: Triggered at {} {}", LocalDate.now(), java.time.LocalTime.now());
        logger.info("==================================================\n");

        if (!trainingEnabled) {
            logger.info("Model training is disabled");
            return;
        }

        // Get images edited today
        List<Map<String, Object>> todaysEdits = getTodaysEditedImages();
        int editCount = todaysEdits.size();

        logger.info("Found " + editCount + " images edited today");

        if (editCount > 0) {
            logger.info("Starting model retraining with today's " + editCount + " edited images...");
            startModelTraining(todaysEdits);
        } else {
            logger.info("No images were edited today. Skipping training.");
        }
    }

    private List<Map<String, Object>> getTodaysEditedImages() {
        LocalDate today = LocalDate.now();
        String sql = """
            SELECT DISTINCT 
                p.prediction_id as id,
                pd.created_at as edited_at
            FROM prediction p
            JOIN prediction_detection pd ON p.prediction_id = pd.prediction_id
            WHERE DATE(pd.created_at) = :today
            AND (pd.source = 'MANUALLY_ADDED' OR pd.action_type IN ('EDITED', 'DELETED'))
            ORDER BY pd.created_at
        """;
        
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("today", today);
        
        return namedParameterJdbcTemplate.queryForList(sql, params);
    }

    private void startModelTraining(List<Map<String, Object>> editedImages) {
        try {
            // Extract database details from URL
            String dbHost = dbUrl.split("//")[1].split(":")[0];
            String dbName = dbUrl.split("/")[3].split("\\?")[0];

            // Prepare training command
            ProcessBuilder pb = new ProcessBuilder(
                pythonPath,
                trainingScriptPath,
                "--best-pt", weightsPath,
                "--dataset", datasetPath,
                "--output", outputPath,
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
                logger.warn("Model training failed with exit code: {}", exitCode);
            }

        } catch (IOException | InterruptedException e) {
            logger.error("Error during model training: {}", e.getMessage());
        }
    }
}