# Firebase Setup Guide for Pace Pilot

This guide walks you through setting up Firebase backend, Firestore database, and deploying your Pace Pilot app to Firebase Hosting.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Create Firebase Project](#create-firebase-project)
3. [Configure Firebase Authentication](#configure-firebase-authentication)
4. [Set Up Firestore Database](#set-up-firestore-database)
5. [Configure Environment Variables](#configure-environment-variables)
6. [Initialize Firebase in Your Project](#initialize-firebase-in-your-project)
7. [Deploy to Firebase Hosting](#deploy-to-firebase-hosting)
8. [Database Structure Reference](#database-structure-reference)

---

## Prerequisites

- Node.js 18+ installed
- A Google account
- Firebase CLI installed globally:
  ```bash
  npm install -g firebase-tools
  ```

---

## 1. Create Firebase Project

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**

### Step 2: Configure Your Project
1. **Project name**: Enter `pace-pilot` (or your preferred name)
2. **Google Analytics**: Enable (recommended) or skip
3. Click **"Create project"**
4. Wait for project creation to complete
5. Click **"Continue"**

### Step 3: Register Your Web App
1. In the Firebase console, click the **web icon** (</>) to add a web app
2. **App nickname**: Enter `Pace Pilot Web App`
3. **Firebase Hosting**: Check this box (we'll use it for deployment)
4. Click **"Register app"**
5. **Copy your Firebase config** - you'll need these values later:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "pace-pilot.firebaseapp.com",
     projectId: "pace-pilot",
     storageBucket: "pace-pilot.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```
6. Click **"Continue to console"**

---

## 2. Configure Firebase Authentication

### Step 1: Enable Authentication
1. In Firebase console sidebar, click **"Authentication"**
2. Click **"Get started"**

### Step 2: Enable Email/Password Authentication
1. Go to **"Sign-in method"** tab
2. Click on **"Email/Password"**
3. Toggle **"Enable"** switch ON
4. Click **"Save"**

### Step 3: Enable Google Authentication
1. Still in **"Sign-in method"** tab
2. Click on **"Google"**
3. Toggle **"Enable"** switch ON
4. **Project support email**: Select your email from dropdown
5. Click **"Save"**

### Step 4: Add Authorized Domains (Optional)
1. Scroll down to **"Authorized domains"**
2. Add your custom domain if you have one
3. `localhost` is already authorized by default for development

---

## 3. Set Up Firestore Database

### Step 1: Create Database
1. In Firebase console sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. **Choose location**: Select closest region to your users
   - Recommended: `us-central1` (for US) or `europe-west1` (for Europe)
4. Click **"Next"**

### Step 2: Choose Security Rules
1. Select **"Start in test mode"** (we'll update rules later)
2. Click **"Create"**
3. Wait for database creation

### Step 3: Update Security Rules
1. Go to **"Rules"** tab in Firestore
2. Replace the default rules with the following:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Tasks collection
    match /tasks/{taskId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
    }

    // Projects collection
    match /projects/{projectId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
    }

    // Calendar Events collection
    match /calendarEvents/{eventId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
    }

    // Recurring Tasks collection
    match /recurringTasks/{taskId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isOwner(resource.data.userId);
    }

    // Daily Reports collection
    match /dailyReports/{reportId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click **"Publish"**

### Step 4: Create Composite Indexes (Optional but Recommended)
For better query performance, create these indexes:

1. Go to **"Indexes"** tab
2. Click **"Add Index"**
3. Create the following indexes:

**Index 1: Tasks by User and Creation Date**
- Collection ID: `tasks`
- Fields to index:
  - `userId` (Ascending)
  - `createdAt` (Descending)
- Query scope: Collection

**Index 2: Daily Reports by User and Date**
- Collection ID: `dailyReports`
- Fields to index:
  - `userId` (Ascending)
  - `date` (Descending)
- Query scope: Collection

---

## 4. Configure Environment Variables

### Step 1: Create Environment File
In your project root, create or update `.env.local`:

```env
# Gemini API Key (for AI features)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 2: Verify Configuration
Copy the values from Firebase Console:
1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Select your web app
4. Copy each value to your `.env.local` file

---

## 5. Initialize Firebase in Your Project

### Step 1: Login to Firebase CLI
```bash
firebase login
```
Follow the browser prompt to authenticate.

### Step 2: Initialize Firebase in Your Project
```bash
firebase init
```

### Step 3: Select Firebase Features
Use arrow keys to navigate, spacebar to select:
- ✓ Firestore
- ✓ Hosting

Press Enter to continue.

### Step 4: Configure Firestore
- **Use existing project**: Select your `pace-pilot` project
- **Firestore rules file**: Press Enter (uses default `firestore.rules`)
- **Firestore indexes file**: Press Enter (uses default `firestore.indexes.json`)

### Step 5: Configure Hosting
- **Public directory**: Enter `dist` (this is where Vite builds to)
- **Single-page app**: Enter `y` (yes)
- **Set up automatic builds**: Enter `N` (no)
- **Overwrite index.html**: Enter `N` (no)

---

## 6. Deploy to Firebase Hosting

### Step 1: Build Your App
```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### Step 2: Deploy to Firebase
```bash
firebase deploy
```

This deploys:
- Firestore rules
- Firestore indexes
- Your app to Firebase Hosting

### Step 3: Access Your Deployed App
After deployment completes, you'll see:
```
✔  Deploy complete!

Hosting URL: https://your-project.firebaseapp.com
```

Visit the URL to see your live app!

---

## 7. Database Structure Reference

### Collections

#### `tasks`
```javascript
{
  id: "auto-generated",
  userId: "user-uid",
  title: "Complete project proposal",
  description: "Write and submit Q1 proposal",
  category: "Deep Work",
  projectId: "project-id",
  energyRequired: "High" | "Medium" | "Low",
  isCompleted: false,
  dueDate: "2025-01-15T10:00:00Z",
  createdAt: "2025-01-01T08:00:00Z",
  isRecurring: false
}
```

#### `projects`
```javascript
{
  id: "auto-generated",
  userId: "user-uid",
  name: "Q1 Marketing Campaign",
  color: "bg-pilot-orange",
  icon: "Folder"
}
```

#### `calendarEvents`
```javascript
{
  id: "auto-generated",
  userId: "user-uid",
  day: 15,
  title: "Team Standup",
  time: "09:00",
  color: "bg-pilot-orange",
  loc: "Remote"
}
```

#### `recurringTasks`
```javascript
{
  id: "auto-generated",
  userId: "user-uid",
  task: "Review weekly analytics",
  status: "Pending" | "Completed",
  last: "2025-01-10",
  interval: "Daily" | "Weekly" | "Monthly"
}
```

#### `dailyReports`
```javascript
{
  userId: "user-uid",
  date: "2025-01-15",
  energyLevel: "High" | "Medium" | "Low",
  notes: "Focused work day",
  momentumScore: 85,
  aiInsights: "Great productivity today!",
  completedTaskIds: ["task-id-1", "task-id-2"],
  goals: ["Finish proposal", "Review code"],
  taskBreakdown: [
    {
      task: "Project proposal",
      collaboration: "Solo",
      notes: "Completed ahead of schedule",
      timeSpent: "3h"
    }
  ]
}
```

---

## Continuous Deployment

### Option 1: Manual Deployment
Every time you make changes:
```bash
npm run build
firebase deploy
```

### Option 2: GitHub Actions (Automated)
Create `.github/workflows/firebase-hosting.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: your-project-id
```

Add your environment variables as GitHub Secrets in repository settings.

---

## Troubleshooting

### Issue: "Permission denied" errors
- **Solution**: Check Firestore security rules and ensure `userId` field matches authenticated user

### Issue: Build fails with environment variable errors
- **Solution**: Ensure all `VITE_*` variables are set in `.env.local`

### Issue: Firebase deploy fails
- **Solution**: Run `firebase login` again and ensure you're using the correct project:
  ```bash
  firebase use --add
  ```

### Issue: Google Sign-In doesn't work
- **Solution**: Add your domain to authorized domains in Firebase Console > Authentication > Settings

---

## Next Steps

- **Monitor Usage**: Check Firebase Console > Usage for database reads/writes
- **Set Up Billing**: Add a billing account to avoid hitting free tier limits
- **Enable Analytics**: Track user behavior with Firebase Analytics
- **Add Cloud Functions**: Implement serverless backend logic
- **Set Up Backups**: Configure automatic Firestore backups

---

## Support

For issues:
- Firebase Documentation: https://firebase.google.com/docs
- Pace Pilot GitHub Issues: [Your repository]
- Firebase Support: https://firebase.google.com/support

---

**Congratulations!** Your Pace Pilot app is now production-ready with Firebase backend and hosting! 🎉
