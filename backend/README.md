# DocuMind AI Backend

An AI-powered document reading and analysis service built with FastAPI, featuring OCR, document detection, and AI-powered summarization.

## Features

- **Document Processing**: Support for PDF, JPG, PNG files
- **OCR Text Extraction**: Using PaddleOCR for accurate text recognition
- **Document Detection**: Optional YOLOv8-based document cropping
- **AI Summarization**: GPT-4o-mini powered document summaries
- **Question Answering**: Ask questions about extracted text
- **Firebase Storage**: Automatic file upload to Firebase Storage
- **CORS Support**: Frontend integration ready
- **File Cleanup**: Automatic temporary file management

## Architecture

The backend is built with a modular architecture:

- `main.py` - FastAPI application with endpoints and middleware
- `models/cv_model.py` - YOLOv8 document detection and cropping
- `models/ocr_model.py` - PaddleOCR text extraction
- `models/llm_model.py` - OpenAI GPT-4o-mini integration
- `utils/firebase_storage.py` - Firebase Storage file management

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy `env_example.txt` to `.env` and configure:

```bash
cp env_example.txt .env
```

Edit `.env` and add your API keys:
```
OPENAI_API_KEY=your_actual_api_key_here

# Firebase Configuration (copy the entire JSON from your service account)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

#### Firebase Setup Instructions

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing one

2. **Enable Storage**:
   - Go to Storage section
   - Click "Get Started"
   - Choose security rules (start with test mode)

3. **Create Service Account**:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file
   - Copy the entire JSON content to `FIREBASE_SERVICE_ACCOUNT_JSON`

4. **Configure Storage Rules** (optional):
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if true; // For testing only
       }
     }
   }
   ```

### 3. Run the Application

#### **Development Mode**
```bash
# Using uvicorn with auto-reload
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Or using the main.py script
python main.py
```

#### **Docker Development**
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or run Docker container directly
docker build -t documind-backend .
docker run -p 8000:8000 --env-file .env documind-backend
```

#### **Production Mode**
```bash
# Using gunicorn (recommended for production)
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Or using uvicorn without reload
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check
- **GET** `/` - Basic health check
- **GET** `/health` - Detailed model status

### Document Processing
- **POST** `/process-document` - Upload and process documents
  - Accepts: PDF, JPG, PNG files
  - Returns: `{extracted_text, summary, file_url, success, message}`
  - Automatically uploads file to Firebase Storage

### Question Answering
- **POST** `/ask-question` - Ask questions about extracted text
  - Body: `{question: string, extracted_text: string}`
  - Returns: `{answer: string, success: boolean, message: string}`

## API Documentation

Once running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Usage Examples

### Process Document
```bash
curl -X POST "http://localhost:8000/process-document" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your_document.pdf"
```

### Ask Question
```bash
curl -X POST "http://localhost:8000/ask-question" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the total amount?",
    "extracted_text": "Your extracted text here..."
  }'
```

## Model Details

### Document Detection (YOLOv8)
- Uses pretrained YOLOv8 model for document boundary detection
- Automatically crops images to focus on document content
- Falls back to original image if detection fails

### OCR (PaddleOCR)
- Supports multiple languages (configured for English)
- Handles rotated text and various document layouts
- Confidence-based text filtering

### LLM (OpenAI GPT-4o-mini)
- Generates concise document summaries
- Provides contextual question answering
- Configurable response lengths and temperature

### Firebase Storage
- Automatic file upload to Firebase Storage
- Organized folder structure with timestamps
- Public URLs for easy access
- Metadata preservation (original filename, upload time)

## Error Handling

The API includes comprehensive error handling:
- File type validation
- Model initialization checks
- Graceful fallbacks for failed operations
- Detailed error messages and logging

## Security Considerations

- **CORS**: Currently allows all origins (restrict in production)
- **File Uploads**: Validates file types and extensions
- **API Keys**: Store securely in environment variables
- **Firebase Security**: Configure Firebase Storage rules appropriately
- **File Cleanup**: Automatic temporary file removal

## Production Deployment

### Render (Recommended)

#### **1. Connect Repository**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository and branch

#### **2. Configure Service**
- **Name**: `documind-backend` (or your preferred name)
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Plan**: Choose appropriate plan (Free tier available)

#### **3. Environment Variables**
Add these in Render dashboard → Environment:

```bash
OPENAI_API_KEY=your_openai_api_key
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```

#### **4. Deploy**
- Render will automatically build and deploy
- Service will be available at `https://your-app-name.onrender.com`
- Automatic deployments on every push to main branch

### Railway

#### **1. Connect Repository**
1. Go to [Railway Dashboard](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository

#### **2. Configure Service**
- **Service Type**: Web Service
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### **3. Environment Variables**
Add environment variables in Railway dashboard:
- `OPENAI_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `FIREBASE_STORAGE_BUCKET`
- `HOST=0.0.0.0`
- `PORT=$PORT`

#### **4. Deploy**
- Railway will automatically deploy
- Service available at provided Railway URL
- Automatic deployments on Git pushes

### Docker Deployment

#### **Local Docker**
```bash
# Build the Docker image
docker build -t documind-backend .

# Run the container
docker run -d -p 8000:8000 --env-file .env documind-backend

# Using Docker Compose
docker-compose up -d
```

#### **Production Docker**
```bash
# Build optimized image
docker build -t documind-backend:prod .

# Run with production settings
docker run -d \
  -p 8000:8000 \
  --env-file .env.prod \
  --restart unless-stopped \
  documind-backend:prod
```

### Traditional Server Deployment

#### **1. Server Requirements**
- **Minimum**: 2GB RAM, 1 CPU core
- **Recommended**: 4GB RAM, 2 CPU cores
- **OS**: Ubuntu 20.04+ or CentOS 8+

#### **2. Installation**
```bash
# Clone repository
git clone <your-repo>
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp env_example.txt .env
# Edit .env with your values
```

#### **3. Process Management**
```bash
# Using systemd
sudo systemctl enable documind-backend
sudo systemctl start documind-backend

# Using supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start documind-backend
```

#### **4. Reverse Proxy (Nginx)**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### **5. SSL Certificate**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### Environment Variables
- Restrict `ALLOWED_ORIGINS` to your frontend domain
- Use proper secret management for API keys
- Configure Firebase Storage rules and permissions
- Configure logging levels appropriately

### Performance
- Consider model caching for repeated requests
- Implement rate limiting for API endpoints
- Monitor memory usage with large document processing

### Scaling
- Use async processing for large documents
- Implement queue systems for batch processing
- Consider containerization with Docker

## Troubleshooting

### Common Issues

1. **Model Loading Errors**
   - Check internet connection for model downloads
   - Verify sufficient disk space
   - Check Python version compatibility

2. **OCR Failures**
   - Ensure image quality is sufficient
   - Check file format support
   - Verify PaddleOCR installation

3. **OpenAI API Errors**
   - Verify API key is correct
   - Check API quota and billing
   - Ensure network connectivity

4. **Firebase Storage Errors**
   - Verify service account JSON is valid
   - Check Firebase project permissions
   - Ensure bucket name is correct
   - Verify Firebase Storage rules

### Logs
Check application logs for detailed error information and debugging.

## License

This project is part of DocuMind AI. Please refer to your project's license terms.
