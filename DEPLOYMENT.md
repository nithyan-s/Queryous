# 🚀 Queryous Deployment Guide

## 📋 Pre-Deployment Checklist ✅

### ✅ **Codebase Cleaned**
- [x] Removed all test files (auth_test.py, debug_auth.py, etc.)
- [x] Removed temporary Altair data files
- [x] Removed __pycache__ directories
- [x] Removed .env file (contains secrets)
- [x] Created .env.example template
- [x] Removed test_vega_lite.html

### ✅ **Production Ready Files**
```
Queryous/
├── client/ (React Frontend - Deploy to Vercel)
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── server/ (FastAPI Backend - Deploy to Render)
│   ├── main.py
│   ├── auth_routes.py
│   ├── auth_service.py
│   ├── auth_schemas.py
│   ├── auth_utils.py
│   ├── db.py
│   ├── models.py
│   ├── services.py
│   ├── utils.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🌐 Frontend Deployment (Vercel)

### 1. **Prepare Frontend**
```bash
cd client
npm install
npm run build
```

### 2. **Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Select the `client` folder as root directory
4. Set build command: `npm run build`
5. Set output directory: `dist`
6. Add environment variables:
   - `VITE_API_URL`: `https://your-backend.onrender.com`

## 🖥️ Backend Deployment (Render)

### 1. **Environment Variables**
Copy `.env.example` to `.env` and fill in:
```bash
# Required for production
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
LLM_API_URL=https://api.groq.com/openai/v1/chat/completions
LLM_API_KEY=your_groq_api_key_here
FRONTEND_URL=https://your-frontend.vercel.app
ENVIRONMENT=production
```

### 2. **Deploy to Render**
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repository
4. Set root directory: `server`
5. Set build command: `pip install -r requirements.txt`
6. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Add environment variables from your `.env` file

## 🔧 Local Development

### **Using Docker Compose**
```bash
# Start both frontend and backend
docker-compose up --build

# Frontend: http://localhost:5173
# Backend: http://localhost:8001
```

### **Manual Setup**
```bash
# Backend
cd server
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your values
uvicorn main:app --reload

# Frontend (new terminal)
cd client
npm install
npm run dev
```

## 🔐 Authentication System

### **Features**
- ✅ JWT-based authentication
- ✅ Secure password hashing (bcrypt)
- ✅ Database credentials storage
- ✅ User registration/login
- ✅ Automatic logout on token expiry

### **Endpoints**
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/store-db-credentials` - Store DB credentials
- `GET /auth/get-db-credentials` - Get DB credentials

## 📊 Features

### **Data Visualization**
- Interactive charts with Vega-Lite v6
- Support for: Bar, Line, Area, Pie, Scatter charts
- Responsive design with Material-UI

### **Database Integration**
- Dynamic database connections
- Support for MySQL, PostgreSQL, SQL Server
- Secure credential storage

### **Chat Interface**
- AI-powered SQL query generation
- Real-time chat with visualization
- Session history management

## 🛠️ Tech Stack

### **Frontend**
- React 18 + Vite
- Material-UI (MUI)
- Vega-Lite for charts
- Axios for API calls

### **Backend**
- FastAPI
- JWT authentication
- Groq API integration
- Docker support

## 📈 Performance

- ✅ Optimized chart rendering
- ✅ Lazy loading components
- ✅ Responsive design
- ✅ Error boundaries
- ✅ Loading states

## 🔒 Security

- ✅ JWT tokens with expiration
- ✅ Password hashing with bcrypt
- ✅ CORS configuration
- ✅ Environment variable protection
- ✅ Input validation

---

**🎉 Your codebase is now clean and ready for production deployment!**