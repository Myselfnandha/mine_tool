---
title: Mine Notes Link Processor
emoji: 📑
colorFrom: yellow
colorTo: red
sdk: docker
app_port: 7860
pinned: false
---

# Mine Notes Link Processor & 24/7 Queue Server

High-performance, automated link queue processing and domain auto-categorization microservice for the **Mine Notes** Android & Web ecosystem.

## Features
- **24/7 Asynchronous Queue Processing**: Background queue consumer that extracts OpenGraph metadata, article titles, domain canonicals, and readability metrics.
- **Zero-Confirmation Domain Categorizer**: Automatically sorts incoming links into domain folders (`Development & Code`, `Research & Papers`, `Design & Visuals`, `Tools & SaaS`, `Writing & Essays`, `Finance & Tech`, `Media & Audio`).
- **REST API Endpoints**:
  - `POST /api/process-link`: Instant synchronous link analysis and classification.
  - `POST /api/queue`: Enqueue a link for background extraction and offline note archiving.
  - `GET /api/queue`: Retrieve current queue status and processed link archives.
  - `GET /api/stats`: Real-time queue metrics and processing telemetry.
  - `GET /health`: Health and uptime probe.
- **Embedded Dashboard**: Warm Editorial Utilitarian dashboard for interactive testing and queue monitoring.
