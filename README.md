# 🧠 DocuMind AI - Intelligent Document Processing

A full-stack AI-powered document reading and analysis SaaS application built with FastAPI, Next.js, and Firebase.

## ✨ Features

- **📄 Document Processing**: Upload PDF, JPG, PNG files for AI analysis
- **🔍 OCR Extraction**: Advanced text extraction using PaddleOCR
- **🤖 AI Summarization**: GPT-4o-mini powered document summaries
- **💬 Interactive Chat**: Ask questions about your documents
- **☁️ Cloud Storage**: Automatic Firebase Storage integration
- **🔐 Authentication**: Firebase Auth with Google Sign-In
- **📱 Responsive Design**: Modern SaaS UI with TailwindCSS
- **🚀 Production Ready**: Deployment configurations for all platforms

## 🏗️ Architecture

```
DocuMind AI/
├── backend/                 # FastAPI Backend
│   ├── main.py             # Main application
│   ├── models/             # AI models (OCR, LLM, CV)
│   ├── utils/              # Firebase storage utilities
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Container configuration
│   └── Procfile           # Platform deployment
├── frontend/               # Next.js Frontend
│   ├── app/                # App Router pages
│   ├── components/         # React components
│   ├── contexts/           # Authentication context
│   ├── utils/              # Utilities and configs
│   ├── package.json        # Node.js dependencies
│   └── vercel.json         # Vercel deployment
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** for backend
- **Node.js 18+** for frontend
- **Firebase Project** for authentication and storage
- **OpenAI API Key** for AI processing

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd DocuMind
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp env_example.txt .env

# Edit .env with your API keys
# OPENAI_API_KEY=your_key
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Run backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp env.example .env.local

# Edit .env.local with Firebase config
# NEXT_PUBLIC_FIREBASE_API_KEY=your_key
# NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000

# Run frontend
npm run dev
```

### 4. Access Application

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 🔥 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project or select existing
3. Enable Authentication (Email/Password + Google)
4. Enable Storage with test rules

### 2. Get Configuration
1. Project Settings → General → Your Apps
2. Add Web App
3. Copy configuration to frontend `.env.local`

### 3. Service Account (Backend)
1. Project Settings → Service Accounts
2. Generate new private key
3. Copy JSON content to backend `.env`

## 🚀 Deployment

### Backend Deployment

#### Render (Recommended)
1. Connect GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables
5. Deploy automatically

#### Railway
1. Import GitHub repository
2. Configure as web service
3. Set environment variables
4. Deploy with automatic builds

#### Docker
```bash
# Build image
docker build -t documind-backend .

# Run container
docker run -p 8000:8000 --env-file .env documind-backend
```

### Frontend Deployment

#### Vercel (Recommended)
1. Import GitHub repository
2. Add environment variables
3. Deploy automatically on push
4. Custom domain configuration

#### Other Platforms
- **Netlify**: Similar to Vercel
- **AWS Amplify**: Full-stack solution
- **Docker**: Containerized deployment

## 📚 API Documentation

### Endpoints

- **POST** `/process-document` - Upload and process documents
- **POST** `/ask-question` - Ask questions about extracted text
- **GET** `/health` - System health check

### Example Usage

```bash
# Process document
curl -X POST "http://localhost:8000/process-document" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf"

# Ask question
curl -X POST "http://localhost:8000/ask-question" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic?", "extracted_text": "..."}'
```

## 🛠️ Development

### Backend Development

```bash
cd backend

# Install development dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests (when implemented)
pytest

# Code formatting
black .
isort .
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

### Docker Development

```bash
# Backend
cd backend
docker-compose up --build

# Frontend
cd frontend
docker build -t documind-frontend .
docker run -p 3000:3000 documind-frontend
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
OPENAI_API_KEY=your_openai_api_key
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.vercel.app
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
```

## 📱 Features

### Document Processing
- **Supported Formats**: PDF, JPG, JPEG, PNG
- **AI Analysis**: Automatic text extraction and summarization
- **File Storage**: Cloud storage with Firebase
- **Progress Tracking**: Real-time upload progress

### AI Capabilities
- **OCR**: Advanced text recognition with PaddleOCR
- **Summarization**: GPT-4o-mini powered document summaries
- **Q&A**: Interactive chat about document content
- **Document Detection**: YOLOv8 for image preprocessing

### User Experience
- **Authentication**: Secure login with Firebase Auth
- **Responsive Design**: Mobile-first SaaS interface
- **Real-time Updates**: Live chat and processing feedback
- **Modern UI**: Glass-morphism design with TailwindCSS

## 🚀 Performance

### Backend Optimization
- **Async Processing**: Non-blocking document processing
- **Model Caching**: Efficient AI model loading
- **Memory Management**: Automatic cleanup of temporary files
- **Error Handling**: Graceful fallbacks and retries

### Frontend Optimization
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js built-in image optimization
- **Bundle Analysis**: Webpack bundle analyzer
- **Performance Monitoring**: Core Web Vitals tracking

## 🔒 Security

### Authentication & Authorization
- **Firebase Auth**: Industry-standard authentication
- **JWT Tokens**: Secure session management
- **Role-based Access**: User permission management
- **Secure Storage**: Environment variable protection

### API Security
- **CORS Protection**: Configurable cross-origin policies
- **Input Validation**: Pydantic model validation
- **File Upload Security**: Type and size validation
- **Rate Limiting**: API abuse prevention

### Data Protection
- **Encrypted Storage**: Firebase Storage encryption
- **Secure Communication**: HTTPS enforcement
- **Data Privacy**: GDPR compliance considerations
- **Audit Logging**: Access and modification tracking

## 📊 Monitoring & Logging

### Health Checks
- **System Status**: Model availability monitoring
- **Performance Metrics**: Response time tracking
- **Error Rates**: Failure rate monitoring
- **Resource Usage**: Memory and CPU monitoring

### Logging
- **Structured Logging**: JSON format logs
- **Log Levels**: Configurable logging verbosity
- **Error Tracking**: Detailed error information
- **Performance Logs**: Request/response timing

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- **Python**: Black, isort, flake8
- **TypeScript**: ESLint, Prettier
- **CSS**: TailwindCSS best practices
- **Testing**: Unit and integration tests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- **API Docs**: `/docs` endpoint when backend is running
- **Component Library**: Frontend components documentation
- **Deployment Guides**: Platform-specific deployment instructions

### Community
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Wiki**: Project wiki for detailed guides

### Contact
- **Email**: [your-email@domain.com]
- **GitHub**: [your-github-username]
- **Website**: [your-website.com]

## 🙏 Acknowledgments

- **OpenAI** for GPT-4o-mini API
- **PaddlePaddle** for OCR capabilities
- **Ultralytics** for YOLOv8 models
- **Firebase** for authentication and storage
- **Vercel** for frontend hosting
- **Render/Railway** for backend hosting

---

**Built with ❤️ for intelligent document processing**
