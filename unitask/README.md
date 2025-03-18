# UniTask - Freelancing Platform for University Students

A full-stack application that connects university students with freelancing opportunities.

## Project Structure

```
unitask/
├── backend/        # Express.js backend server
├── src/            # React frontend application
├── public/         # Static files
└── package.json    # Frontend dependencies
```

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- PostgreSQL database (we're using Neon.tech)

### Setup Instructions

1. **Clone the repository**

```bash
git clone <repository-url>
cd unitask
```

2. **Install frontend dependencies**

```bash
npm install
```

3. **Install backend dependencies**

```bash
cd backend
npm install
cd ..
```

4. **Start the backend server**

```bash
cd backend
npm run dev
```

The backend will start on http://localhost:5000

5. **Start the frontend development server**

```bash
# In a new terminal window
npm run dev
```

The frontend will start on http://localhost:5173

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
PORT=5000
DATABASE_URL=postgresql://url
```

## Deployment

### Detailed Backend Deployment Guide for Render

1. **Create a Render Account**
   - Sign up at [render.com](https://render.com/)
   - Verify your email and set up your account

2. **Connect Your GitHub Repository**
   - Go to the Render Dashboard
   - Click "New" and select "Web Service"
   - Connect your GitHub account
   - Select your UniTask repository

3. **Configure the Web Service**
   - **Name**: unitask-backend (or your preferred name)
   - **Environment**: Node
   - **Region**: Choose closest to your target users
   - **Branch**: main (or your deployment branch)
   - **Root Directory**: backend  
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`  
   - **Plan**: Select Free (or Hobby for production)

4. **Set Environment Variables**
   - Scroll down to the "Environment" section
   - Add all variables from your backend/.env file
   - Make sure to update these with your actual values:
     ```
     PORT=10000
     SERVER_URL=https://your-app-name.onrender.com
     FRONTEND_URL=https://your-frontend-url.com
     DATABASE_URL=your_actual_neon_db_connection_string
     GOOGLE_CLIENT_ID=your_actual_google_client_id
     GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
     GITHUB_CLIENT_ID=your_actual_github_client_id
     GITHUB_CLIENT_SECRET=your_actual_github_client_secret
     ```

5. **Advanced Settings (Optional)**
   - Set "Auto-Deploy" to Yes for automatic deployments
   - Configure "Health Check Path" to "/api/health" (you may need to add this endpoint)

6. **Deploy the Service**
   - Click "Create Web Service"
   - Monitor the deployment logs for any errors
   - Once deployed, Render will provide you with a URL for your service

7. **Update OAuth Callback URLs**
   - Go to Google Cloud Console and GitHub Developer Settings
   - Add your new Render backend URL to the authorized redirect URIs:
     - `https://your-app-name.onrender.com/api/auth/google/callback`
     - `https://your-app-name.onrender.com/api/auth/github/callback`

8. **Test Your Deployment**
   - Visit your backend URL to verify it's running
   - Check logs in the Render dashboard for any issues

## Important Deployment Notes

When properly deployed, your application will be:

1. **Fully Online**: The application will be accessible from any internet connection, not just localhost
   
2. **Production Ready**: With these configurations, your app will function as a real-world application

3. **Properly Connected**: The frontend will communicate with your backend through secure HTTPS connections

4. **Database Connected**: Your Neon.tech PostgreSQL database will be connected to your deployed backend

5. **Authentication Working**: OAuth providers will work with your deployed URLs (after updating callback URLs)

To ensure your site works properly online:

1. Make sure to update OAuth providers (Google/GitHub) with your production callback URLs
2. Verify CORS settings to allow connections from your frontend domain
3. Test all functionality after deployment, especially authentication and file uploads

## Online URLs After Deployment

- **Frontend**: https://unitask-black.vercel.app
- **Backend API**: https://unitask-backend.onrender.com
- **Websocket**: wss://unitask-backend.onrender.com (for real-time chat)

### Frontend Deployment (Vercel)

1. **Create a Vercel Account**
   - Sign up at [vercel.com](https://vercel.com/)
   - Link your GitHub account

2. **Configure Environment Variables**
   - Create a `.env` file in your frontend root with:
     ```
     VITE_API_URL=https://unitask-backend.onrender.com
     ```

3. **Deploy from GitHub**
   - Go to your Vercel dashboard and click "Add New..." > "Project"
   - Select your repository
   - Configure the project:
     - **Framework Preset**: Vite
     - **Root Directory**: ./ (leave empty if your package.json is at the root)
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Add environment variables under the "Environment Variables" section
   - Click "Deploy"

4. **Configure Custom Domain (Optional)**
   - Go to your project settings in Vercel
   - Navigate to the "Domains" section
   - Current domain: https://unitask-black.vercel.app

5. **Test Your Full Application**
   - Visit your Vercel URL
   - Test login, profile, and gig features
   - Check for CORS or API connection issues

### Frontend Deployment (Netlify)

1. **Create a Netlify Account**
   - Sign up at [netlify.com](https://netlify.com/)
   - Link your GitHub account

2. **Configure Environment Variables**
   - Create a `.env` file in your frontend root with:
     ```
     VITE_API_URL=https://your-app-name.onrender.com
     ```

3. **Deploy from GitHub**
   - Choose "New site from Git"
   - Select your repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables

4. **Configure Custom Domain (Optional)**
   - Set up a custom domain in Netlify settings
   - Update your backend CORS and OAuth settings

5. **Test Your Full Application**
   - Visit your Netlify URL
   - Test login, profile, and gig features
   - Check for CORS or API connection issues

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - Set environment variables in the Render dashboard (see backend/.env)
   
4. **Render Free Tier Usage**:
   - 750 hours of free instance usage per month
   - 100 GB of bandwidth per month
   - 500 build minutes per month
   - Note: Free tier instances spin down with inactivity. For production use, consider the Hobby plan ($7/month) to prevent spin down.

5. **Optimizing Free Tier Usage**:
   - Your backend will sleep after 15 minutes of inactivity
   - First request after inactivity will take longer to respond (cold start)
   - Deploy database-intensive operations as background jobs
   - Minimize build frequency to conserve build minutes

### Frontend Deployment

Deploy your frontend to Netlify or Vercel, pointing to your Render backend URL.

## Features

- User authentication (login/signup)
- Profile management
- Gig creation and management
- (Add more features as they are implemented)

## Technology Stack

- **Frontend**: React, TailwindCSS, Vite
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (hosted on Neon.tech)
- **Authentication**: JWT (JSON Web Tokens)

# UniTask

A freelancing platform for university students.

## Features

- User authentication with email/password or social auth (Google, GitHub)
- Profile management with skills and languages
- Gig creation, editing, and management
- Marketplace for browsing available gigs
- Real-time chat with desktop notifications
- Image uploads with Azure Blob Storage
- Responsive design with Tailwind CSS

## Development Setup

### Prerequisites

- Node.js (v16+)
- PostgreSQL database
- Azure Blob Storage account (for uploads)

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```
   cd ..
   npm install
   ```
4. Configure backend environment variables:
   - Copy `backend/.env.example` to `backend/.env` and fill in your details
   - Generate VAPID keys for push notifications:
     ```
     cd backend
     npm run generate-vapid
     ```
5. Configure frontend environment variables:
   - Copy `.env.example` to `.env` with your API URL

### Running the Application

#### Development mode

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```
2. In a new terminal, start the frontend:
   ```
   npm run dev
   ```

#### Production build

1. Build the frontend:
   ```
   npm run build
   ```
2. Start the backend:
   ```
   cd backend
   npm start
   ```

## Push Notifications Setup

Desktop notifications are enabled by default in the application. For them to work:

1. The backend must have VAPID keys configured (use the generate-vapid script)
2. Users need to grant notification permission in their browser
3. Service worker must be registered (handled automatically by the app)

## Azure Storage Setup

See the [Azure Storage Setup Guide](backend/AZURE_SETUP.md) for details on configuring image uploads.
