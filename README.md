# Introduction

A full-stack data analytics chatbot with real-time dashboard visualization built using **React** and **FastAPI**, designed for enterprise-level data analysis and reporting.

## Overview

This application offers a comprehensive analytics platform featuring:

- Database connection and query feature
- Interactive data visualizations
- Real-time chart generation
- Multiple chart types: bar, line, pie

## Architecture

```
DashboardPlatform/
├── client/          # React frontend application
├── server/          # FastAPI backend server
└── README.md        # This file
```

# Getting Started


## 1. Installation

### Option 1: Docker Setup (Recommended)
1. **Install Docker Desktop**
   - Download from [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Install and start Docker Desktop
   - Ensure Docker is running (whale icon in system tray)

2. **Clone and Run**
   ```bash
   git clone <repository-url>
   cd DashboardPlatform
   docker-compose up --build
   ```

### Option 2: Manual Setup
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DashboardPlatform
   ```

2. **Backend Setup**
   ```bash
   cd server
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   ```

## 2. Software Dependencies

### For Docker Deployment (Recommended)
- Docker Desktop 4.0+
- Docker Compose (included with Docker Desktop)

### For Manual Development Setup
- Node.js 18+ and npm
- Python 3.8+
- Virtual environment (venv or conda)

# Build and Deploy

## 1. Project Structure

### Client Structure
```
client/
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable React components
│   │   ├── charts/  # Chart components (Bar, Line, Pie)
│   │   └── ...      # Other UI components
│   ├── pages/       # Page-level components
│   ├── hooks/       # Custom React hooks
│   ├── styles/      # Styling and animations
│   └── utils/       # Utility functions
├── package.json     # Dependencies and scripts
├── vite.config.js   # Vite configuration
├── Dockerfile       # Docker configuration for frontend
└── nginx.conf       # Nginx configuration
```

### Server Structure
```
server/
├── main.py          # FastAPI application entry point
├── services.py      # Business logic and services
├── db.py           # Database configuration and models
├── utils.py        # Utility functions
├── requirements.txt # Python dependencies
└── Dockerfile       # Docker configuration for backend
```

## 2. Docker Deployment (Recommended)

### Prerequisites
- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

### Quick Start with Docker
```bash
# Navigate to project root
cd DashboardPlatform

# Build and start all services
docker-compose up --build
```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **Health Check**: http://localhost:8001/health

### Docker Commands

#### Start Services
```bash
# Start in foreground (with logs)
docker-compose up --build

# Start in background (detached mode)
docker-compose up -d --build

# Start specific service
docker-compose up backend
docker-compose up frontend
```

#### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop and remove images
docker-compose down --rmi all
```

#### View Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f
```

#### Rebuild Services
```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Force rebuild (no cache)
docker-compose build --no-cache
```

### Troubleshooting
```bash
# Check service status
docker-compose ps

# Access container shell
docker-compose exec backend bash
docker-compose exec frontend sh

# View container resources
docker stats

# Clean up unused Docker resources
docker system prune
```

## 3. Development Setup (Alternative)

### Manual Setup Without Docker

1. **Start the backend server**
   ```bash
   cd server
   # Create virtual environment
   python -m venv venv
   venv\Scripts\activate       # Windows
   # source venv/bin/activate   # macOS/Linux
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Start server
   uvicorn main:app --reload --port 8001
   ```

2. **Start the frontend development server**
   ```bash
   cd client
   npm install
   npm run dev
   ```

## 4. Testing

### Docker Environment Testing
```bash
# Test backend health
curl http://localhost:8001/health

# Test frontend
curl http://localhost:5173

# Run tests inside containers
docker-compose exec backend python -m pytest
docker-compose exec frontend npm run test
```

### Local Development Testing
```bash
# Frontend testing
cd client
npm run test

# Backend testing
cd server
python -m pytest
```

## Configuration

### Environment Variables
Create a `.env` file in the server directory:
```bash
LLM_API_URL='LLM_CHAT_END_POINT'
LLM_API_KEY='YOUR_API_KEY'
```

# Contribute
To contribute, follow these steps:
```bash
- Fork the repository
- Create your feature branch (git checkout -b feature/AmazingFeature)
- Commit your changes (git commit -m 'Add some AmazingFeature')
- Push to the branch (git push origin feature/AmazingFeature)
- Open a Pull Request 
```

# Remark
This was built as a Proof of Concept(POC) under the period of internship May-Jul 2025.



