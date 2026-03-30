# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

COPY pom.xml .
# Download dependencies first (cached layer)
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -B -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Install ICC color profiles (required for PDF/A output intent)
RUN apt-get update && apt-get install -y --no-install-recommends \
    icc-profiles-free \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

# Copy the fat jar
COPY --from=build /build/target/pdfa-generator-1.0.0.jar /app/pdfa-generator.jar

# Copy bundled TTF fonts (for /api/generate endpoint)
COPY fonts/ /app/fonts/

# Environment defaults
ENV PORT=8090
ENV ICC_PROFILE_PATH=/usr/share/color/icc/ghostscript/srgb.icc
ENV BUNDLED_FONT_DIR=/app/fonts
ENV UPLOAD_FONT_DIR=/tmp/pdf-creator-fonts

EXPOSE 8090

ENTRYPOINT ["java", "-jar", "/app/pdfa-generator.jar"]
