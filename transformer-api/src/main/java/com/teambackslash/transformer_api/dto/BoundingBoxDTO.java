package com.teambackslash.transformer_api.dto;

public class BoundingBoxDTO {
    private Integer x;
    private Integer y;
    private Integer width;
    private Integer height;

    // Default constructor
    public BoundingBoxDTO() {}

    // Constructor with parameters
    public BoundingBoxDTO(Integer x, Integer y, Integer width, Integer height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    // Getters and Setters
    public Integer getX() {
        return x;
    }

    public void setX(Integer x) {
        this.x = x;
    }

    public Integer getY() {
        return y;
    }

    public void setY(Integer y) {
        this.y = y;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    @Override
    public String toString() {
        return "BoundingBoxDTO{" +
                "x=" + x +
                ", y=" + y +
                ", width=" + width +
                ", height=" + height +
                '}';
    }
}