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
