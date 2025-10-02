# Firebase Setup Guide for DocuMind

This guide will walk you through setting up Firebase for authentication, document storage, and session management in your DocuMind application.

## Prerequisites

- A Google account
- Node.js and npm installed
- Basic knowledge of Firebase

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "documind-ai")
4. Choose whether to enable Google Analytics (recommended)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the following providers:

### Email/Password Authentication
- Click "Email/Password"
- Toggle "Enable" to ON
- Toggle "Email link (passwordless sign-in)" if desired
- Click "Save"

### Google Authentication
- Click "Google"
- Toggle "Enable" to ON
- Add your authorized domain (localhost for development)
- Click "Save"

### Additional Providers (Optional)
- GitHub
- Facebook
- Twitter
- Apple

## Step 3: Set Up Firestore Database

1. Go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (you'll update security rules later)
4. Select a location closest to your users
5. Click "Done"

## Step 4: Set Up Cloud Storage

1. Go to "Storage" in the left sidebar
2. Click "Get started"
3. Choose "Start in test mode" for development
4. Select a location (same as Firestore)
5. Click "Done"

## Step 5: Configure Web App

1. In your Firebase project, click the gear icon next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Enter an app nickname (e.g., "DocuMind Web")
6. Click "Register app"
7. Copy the Firebase configuration object

## Step 6: Update Environment Variables

1. Copy your Firebase config to `frontend/env.local`:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

2. Replace the placeholder values with your actual Firebase configuration

## Step 7: Deploy Security Rules

### Firestore Rules
1. Copy the contents of `firestore.rules`
2. In Firebase Console, go to "Firestore Database" → "Rules"
3. Replace the existing rules with the copied content
4. Click "Publish"

### Storage Rules
1. Copy the contents of `storage.rules`
2. In Firebase Console, go to "Storage" → "Rules"
3. Replace the existing rules with the copied content
4. Click "Publish"

## Step 8: Set Up Authentication Triggers (Optional)

For enhanced user management, you can set up Cloud Functions:

1. Go to "Functions" in Firebase Console
2. Click "Get started"
3. Install Firebase CLI: `npm install -g firebase-tools`
4. Login: `firebase login`
5. Initialize: `firebase init functions`
6. Deploy: `firebase deploy --only functions`

## Step 9: Configure Authentication Settings

1. Go to "Authentication" → "Settings"
2. Configure the following:

### Authorized Domains
- Add your production domain
- Keep `localhost` for development

### User Actions
- Enable "Prevent abuse" if desired
- Configure password strength requirements

### Templates
- Customize email templates for verification, password reset, etc.

## Step 10: Set Up Indexes (If Needed)

1. Go to "Firestore Database" → "Indexes"
2. Create composite indexes for queries that use multiple fields
3. Common indexes for DocuMind:
   - Collection: `documents`, Fields: `uid` (Ascending), `uploadedAt` (Descending)
   - Collection: `documents`, Fields: `uid` (Ascending), `category` (Ascending)

## Step 11: Test Your Setup

1. Start your development server: `npm run dev`
2. Try to sign up with a new account
3. Verify the user appears in Firebase Console → Authentication → Users
4. Check that user profile is created in Firestore → users collection
5. Test file upload to verify Storage is working

## Step 12: Production Deployment

1. Update security rules to remove test mode
2. Set up proper domain restrictions
3. Configure backup and monitoring
4. Set up Firebase App Check for additional security

## Security Best Practices

### Authentication
- Enable email verification
- Implement rate limiting
- Use strong password policies
- Enable multi-factor authentication for admin users

### Data Security
- Always validate user permissions
- Use security rules to enforce access control
- Implement proper input validation
- Log security events

### Storage Security
- Limit file types and sizes
- Scan uploaded files for malware
- Implement proper access controls
- Use signed URLs for temporary access

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check domain is authorized
   - Verify API keys are correct
   - Check browser console for errors

2. **Storage uploads failing**
   - Verify storage rules are correct
   - Check file size limits
   - Ensure file types are allowed

3. **Firestore access denied**
   - Verify security rules are deployed
   - Check user authentication status
   - Ensure proper collection/document structure

### Debug Mode

Enable debug mode in your Firebase config:

```typescript
// In firebaseConfig.ts
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase config:', firebaseConfig)
}
```

## Monitoring and Analytics

1. **Firebase Analytics**: Track user engagement and app performance
2. **Crashlytics**: Monitor app crashes and errors
3. **Performance Monitoring**: Track app performance metrics
4. **Remote Config**: Manage app configuration remotely

## Cost Optimization

1. **Firestore**: Use appropriate read/write operations
2. **Storage**: Implement file compression and cleanup
3. **Functions**: Optimize function execution time
4. **Bandwidth**: Use CDN for static assets

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Community](https://firebase.google.com/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
- [Firebase YouTube Channel](https://www.youtube.com/user/Firebase)

## Next Steps

After completing this setup:

1. Implement user roles and permissions
2. Add advanced security features
3. Set up monitoring and alerting
4. Implement backup and disaster recovery
5. Add performance optimization features

---

**Note**: Keep your Firebase configuration secure and never commit API keys to version control. Use environment variables and proper security practices in production.
