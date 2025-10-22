package com.teambackslash.transformer_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TransformerApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(TransformerApiApplication.class, args);
    }

}