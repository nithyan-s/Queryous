# Queryous - AI-Powered Data Analytics Platform

A full-stack data analytics chatbot with real-time dashboard visualization built using **React** and **FastAPI**, designed for enterprise-level data analysis and reporting.

## 🚀 Features

- **JWT Authentication System** - Secure user registration and login
- **Database Connection Management** - Connect to MySQL, PostgreSQL, SQL Server
- **AI-Powered SQL Generation** - Natural language to SQL queries
- **Interactive Data Visualizations** - Charts powered by Vega-Lite v6
- **Real-time Chat Interface** - Conversational data analysis
- **Session History** - Track and revisit past queries
- **Responsive Dashboard** - Material-UI components

## 🏗️ Architecture

```
Queryous/
├── client/          # React frontend (Vite + MUI)
├── server/          # FastAPI backend (JWT + Groq)
└── docker-compose.yml
```

## 🚀 Quick Start

### **Option 1: Docker (Recommended)**
```bash
git clone <your-repo-url>
cd Queryous
docker-compose up --build
```
- Frontend: http://localhost:5173
- Backend: http://localhost:8001
- API Docs: http://localhost:8001/docs

### **Option 2: Manual Setup**
```bash
# Backend
cd server
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn main:app --reload

# Frontend (new terminal)
cd client
npm install
npm run dev
```

## 🔧 Configuration

Create `server/.env` from `.env.example`:
```bash
# JWT Secret (change in production)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# LLM Configuration
LLM_API_URL=https://api.groq.com/openai/v1/chat/completions
LLM_API_KEY=your_groq_api_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

## 📊 Tech Stack

### **Frontend**
- React 18 + Vite
- Material-UI (MUI)
- Vega-Lite for charts
- JWT Authentication

### **Backend**
- FastAPI
- JWT with bcrypt
- Groq API integration
- Database connections

## 🔐 Authentication

### **JWT-Based System**
- User registration/login
- Secure password hashing
- Token-based authentication
- Automatic logout on expiry

### **API Endpoints**
- `POST /auth/signup` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/store-db-credentials` - Store database credentials
- `GET /auth/get-db-credentials` - Retrieve database credentials

## 📈 Data Visualization

### **Chart Types**
- Bar Charts
- Line Charts
- Area Charts
- Pie Charts
- Scatter Plots
- Progress Circles

### **Features**
- Interactive tooltips
- Responsive design
- Export capabilities
- Real-time updates

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### **Production Platforms**
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: Your choice (MySQL, PostgreSQL, etc.)

## 🧪 Development

### **Project Structure**
```
client/
├── src/
│   ├── components/     # Reusable components
│   │   ├── charts/     # Chart components
│   │   └── ...
│   ├── pages/          # Page components
│   ├── contexts/       # React contexts
│   └── utils/          # Utilities
└── package.json

server/
├── main.py            # FastAPI app
├── auth_routes.py     # Authentication routes
├── auth_service.py    # Authentication logic
├── services.py        # Business logic
├── db.py             # Database utilities
└── requirements.txt
```

### **Available Scripts**

#### Frontend
```bash
npm run dev         # Development server
npm run build       # Production build
npm run preview     # Preview build
npm run test        # Run tests
```

#### Backend
```bash
uvicorn main:app --reload    # Development server
python -m pytest            # Run tests
```

## 🔒 Security Features

- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ CORS configuration
- ✅ Input validation
- ✅ Environment variable protection

## 🐛 Troubleshooting

### **Common Issues**

1. **Charts not rendering**: Ensure Vega-Lite v6 compatibility
2. **Authentication errors**: Check JWT secret configuration
3. **Database connection**: Verify credentials and network access
4. **CORS errors**: Update FRONTEND_URL in backend .env

### **Debug Mode**
Set `ENVIRONMENT=development` in `.env` for detailed error logging.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**Built with ❤️ for data analytics teams**




