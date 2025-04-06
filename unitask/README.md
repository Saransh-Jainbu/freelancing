# UniTask - Freelance Marketplace Platform

UniTask is a comprehensive freelancing platform designed to connect students with freelancing opportunities. This document provides an in-depth guide to the platform's features, architecture, and deployment setup.

---

## Table of Contents

1. [Features](#features)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Setup](#database-setup)
5. [Azure Blob Storage Setup](#azure-blob-storage-setup)
6. [Authentication](#authentication)
7. [Deployment](#deployment)
8. [Environment Variables](#environment-variables)

---

## Features

### Core Features
- **User Authentication**: Secure login and registration using Google and GitHub OAuth.
- **User Profiles**: Customizable profiles with skills, languages, and portfolio.
- **Task Management**: Create, edit, and manage tasks with milestones.
- **Marketplace**: Browse and filter gigs by category, price, and deadline.
- **Real-Time Chat**: Instant messaging with typing indicators and notifications.
- **Order Management**: Track orders, milestones, and revisions.
- **Payment Integration**: Secure transactions with escrow functionality.
- **Notifications**: Push and in-app notifications for updates.

### Admin Features
- **User Management**: Monitor and manage user accounts.
- **Analytics**: Generate reports on platform activity.

---

## Technology Stack

### Frontend
- **Framework**: React.js with Vite for fast builds.
- **Styling**: TailwindCSS for modern UI design.
- **State Management**: React Context API.
- **Routing**: React Router.
- **Real-Time Communication**: Socket.IO client.
- **Push Notifications**: Web Push API with service workers.

### Backend
- **Framework**: Express.js (Node.js).
- **Database**: PostgreSQL (Neon.tech).
- **Authentication**: Passport.js with Google and GitHub strategies.
- **Real-Time Communication**: Socket.IO.
- **File Storage**: Azure Blob Storage.
- **Push Notifications**: web-push library with VAPID keys.

### Deployment
- **Frontend**: Vercel.
- **Backend**: Render.

---

## Project Structure

```
unitask/
├── backend/        # Express.js backend server
├── src/            # React frontend application
├── public/         # Static files
└── package.json    # Frontend dependencies
```

---

## Database Setup

UniTask uses PostgreSQL hosted on Neon.tech. The database schema includes tables for users, profiles, gigs, orders, messages, and notifications. Key features include:

- **Users Table**: Stores user credentials and basic information.
- **Profiles Table**: Contains user profile details like skills, languages, and avatar.
- **Gigs Table**: Manages gig listings with pricing and categories.
- **Orders Table**: Tracks orders, milestones, and payment status.
- **Messages Table**: Stores chat messages with read status.
- **Notifications Table**: Handles in-app and push notifications.

---

## Azure Blob Storage Setup

Azure Blob Storage is used for storing user avatars, gig images, and other media files. The setup includes:

1. **Storage Account**: Create a storage account in Azure.
2. **Blob Container**: Create a container named `userimages` with private access.
3. **CORS Configuration**:
   - Allowed origins: Your frontend domain.
   - Allowed methods: GET, PUT, POST, DELETE.
   - Allowed headers: *
   - Exposed headers: *
   - Max age: 86400.
4. **Environment Variables**:
   - `AZURE_STORAGE_ACCOUNT_NAME`
   - `AZURE_STORAGE_ACCOUNT_KEY`
   - `AZURE_STORAGE_CONTAINER_NAME`

---

## Authentication

UniTask supports OAuth-based authentication using Google and GitHub. Key details:

- **Google OAuth**:
  - Client ID and Secret are configured in the `.env` file.
  - Callback URL: `/api/auth/google/callback`.
- **GitHub OAuth**:
  - Client ID and Secret are configured in the `.env` file.
  - Callback URL: `/api/auth/github/callback`.

---

## Deployment

### Frontend (Vercel)
1. **Create a Vercel Account**: Sign up at [vercel.com](https://vercel.com/).
2. **Configure Environment Variables**:
   - `VITE_API_URL`: Backend API URL.
3. **Deploy from GitHub**:
   - Framework Preset: Vite.
   - Build Command: `npm run build`.
   - Output Directory: `dist`.

### Backend (Render)
1. **Create a Render Account**: Sign up at [render.com](https://render.com/).
2. **Configure Web Service**:
   - Root Directory: `backend`.
   - Build Command: `npm install`.
   - Start Command: `node server.js`.
   - Health Check Path: `/api/health`.
3. **Environment Variables**:
   - `DATABASE_URL`: PostgreSQL connection string.
   - `AZURE_STORAGE_ACCOUNT_NAME`, `AZURE_STORAGE_ACCOUNT_KEY`.
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
   - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.

---

## Environment Variables

### Backend
- `PORT`: Server port (default: 5000).
- `DATABASE_URL`: PostgreSQL connection string.
- `AZURE_STORAGE_ACCOUNT_NAME`: Azure storage account name.
- `AZURE_STORAGE_ACCOUNT_KEY`: Azure storage account key.
- `AZURE_STORAGE_CONTAINER_NAME`: Azure blob container name.
- `GOOGLE_CLIENT_ID`: Google OAuth client ID.
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret.
- `GITHUB_CLIENT_ID`: GitHub OAuth client ID.
- `GITHUB_CLIENT_SECRET`: GitHub OAuth client secret.

### Frontend
- `VITE_API_URL`: Backend API URL.

---

This guide provides a detailed overview of UniTask's architecture and deployment. For further assistance, refer to the individual setup files and documentation.
