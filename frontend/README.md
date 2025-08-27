# DocuMind AI Frontend

A modern Next.js 14 frontend for DocuMind AI, featuring Firebase Authentication, document upload, AI-powered analysis, and interactive chat.

## Features

- **Modern UI/UX**: Built with Next.js 14, TypeScript, and TailwindCSS
- **Authentication**: Firebase Auth with Google Sign-In and email/password
- **Document Upload**: Drag-and-drop file upload with progress tracking
- **AI Analysis**: View extracted text and AI-generated summaries
- **Interactive Chat**: Ask questions about your documents using AI
- **Responsive Design**: Mobile-first responsive layout
- **Real-time Updates**: Live chat and real-time file processing

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Icons**: Lucide React
- **State Management**: React Context + Hooks

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (redirects)
│   ├── login/             # Authentication pages
│   └── dashboard/         # Main application
├── components/            # Reusable components
│   ├── FileUpload.tsx     # File upload component
│   ├── ResultsPanel.tsx   # Results display
│   └── ChatPanel.tsx      # AI chat interface
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication state
├── utils/                 # Utility functions
│   ├── firebaseConfig.ts  # Firebase configuration
│   └── cn.ts             # Class name utility
└── public/                # Static assets
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Firebase Configuration

#### **Step 1: Create Firebase Project**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing one
3. Enter project name (e.g., "DocuMind AI")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

#### **Step 2: Enable Authentication**
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Email/Password** and enable it
3. Click on **Google** and enable it
4. For Google Sign-in, add your domain to authorized domains
5. Click **Save**

#### **Step 3: Enable Storage**
1. Go to **Storage** section in Firebase Console
2. Click **"Get Started"**
3. Choose security rules:
   - **Start in test mode** (for development)
   - **Start in locked mode** (for production)
4. Choose storage location (closest to your users)
5. Click **Done**

#### **Step 4: Get Web App Configuration**
1. Go to **Project Settings** → **General**
2. Scroll down to **"Your apps"** section
3. Click the web app icon (</>)
4. Register app with a nickname (e.g., "DocuMind Web")
5. Copy the configuration object

#### **Step 5: Configure Environment Variables**
Copy `env.example` to `.env.local` and fill in your Firebase values:

```bash
cp env.example .env.local
```

Edit `.env.local` with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
```

### 3. Environment Variables

Copy `env.local.example` to `.env.local`:

```bash
cp env.local.example .env.local
```

Edit `.env.local` with your Firebase configuration:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Backend API URL
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
```

### 4. Run Development Server

#### **Prerequisites**
- Ensure your backend is running (see Backend README)
- Firebase configuration is properly set up
- Environment variables are configured

#### **Start Development Server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

#### **Access the Application**
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8000](http://localhost:8000)

#### **Development Features**
- Hot reload on file changes
- TypeScript compilation
- Tailwind CSS hot reload
- ESLint integration
- Error overlay for debugging

## Usage

### Authentication

1. **Sign Up/In**: Use email/password or Google Sign-In
2. **Dashboard Access**: Only authenticated users can access the dashboard

### Document Processing

1. **Upload**: Drag and drop or click to select files (PDF, JPG, PNG)
2. **Processing**: Files are sent to the backend for OCR and AI analysis
3. **Results**: View extracted text and AI-generated summary
4. **Storage**: Files are automatically uploaded to Firebase Storage

### AI Chat

1. **Ask Questions**: Type questions about your document
2. **Real-time Responses**: Get AI-powered answers based on extracted text
3. **Context Awareness**: Chat maintains context of your document

## Component Details

### FileUpload Component

- **Drag & Drop**: Modern drag-and-drop interface
- **File Validation**: Supports PDF, JPG, PNG formats
- **Progress Tracking**: Visual upload progress indicator
- **Error Handling**: Graceful error handling and user feedback

### ResultsPanel Component

- **Tabbed Interface**: Switch between summary and full text
- **Copy/Download**: Copy text to clipboard or download as files
- **File Preview**: Direct links to uploaded files in Firebase Storage
- **Responsive Layout**: Adapts to different screen sizes

### ChatPanel Component

- **Real-time Chat**: Interactive conversation with AI
- **Message History**: Persistent chat history during session
- **Context Preservation**: Maintains document context
- **Loading States**: Visual feedback during AI processing

## Firebase Security Rules

### Authentication Rules

```javascript
// Allow authenticated users to read/write their own data
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Storage Rules

```javascript
// Allow authenticated users to upload files
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## API Integration

The frontend integrates with the DocuMind AI backend:

- **POST** `/process-document` - Upload and process documents
- **POST** `/ask-question` - Ask questions about extracted text

## Deployment

### Vercel (Recommended)

#### 1. **Connect Repository**
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Click "New Project"
- Import your GitHub repository
- Vercel will automatically detect Next.js settings

#### 2. **Environment Variables Setup**
In your Vercel project dashboard, go to Settings → Environment Variables and add:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Backend API URL (update with your deployed backend)
NEXT_PUBLIC_BACKEND_API_URL=https://your-backend-app.onrender.com
```

#### 3. **Deploy**
- Vercel will automatically deploy on every push to main branch
- Custom domains can be configured in project settings
- Preview deployments are created for pull requests

#### 4. **Vercel Configuration**
The project includes `vercel.json` with:
- Build commands and output directory
- Function runtime configuration
- Environment variable mapping

### Other Platforms

#### **Netlify**
- Similar to Vercel
- Supports Next.js with proper build settings
- Environment variables in site settings

#### **AWS Amplify**
- Full-stack deployment solution
- Automatic builds from Git
- Environment variable management

#### **Docker**
- Use the provided Dockerfile
- Build and run locally or deploy to container services

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Automatic code formatting
- **TailwindCSS**: Utility-first CSS framework

### Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

## Troubleshooting

### Common Issues

1. **Firebase Initialization Errors**
   - Verify environment variables are correct
   - Check Firebase project configuration
   - Ensure Authentication and Storage are enabled

2. **API Connection Errors**
   - Verify backend is running on correct port
   - Check CORS configuration in backend
   - Ensure `NEXT_PUBLIC_BACKEND_API_URL` is set correctly

3. **Build Errors**
   - Clear `.next` folder and node_modules
   - Run `npm install` again
   - Check TypeScript compilation errors

4. **Authentication Issues**
   - Verify Firebase Auth is enabled
   - Check sign-in methods configuration
   - Ensure proper redirect URLs

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

## Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

## License

This project is part of DocuMind AI. Please refer to your project's license terms.

## Support

For support and questions:
- Check the troubleshooting section
- Review Firebase documentation
- Open an issue in the repository
