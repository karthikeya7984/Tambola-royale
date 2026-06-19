# 🎱 Tambola Royale

Real-Time Multiplayer Housie (Tambola/Bingo) Game built with React, Node.js, Socket.IO, and MongoDB.

## APIs Required

| API | Purpose | Where to get |
|-----|---------|-------------|
| **Google OAuth 2.0** | User authentication | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |
| **MongoDB Atlas** | Database | [MongoDB Atlas](https://www.mongodb.com/atlas) → Free cluster → Connection string |
| **Firebase Cloud Messaging** *(optional)* | Push notifications | [Firebase Console](https://console.firebase.google.com) |

## Quick Start

### 1. Clone & Setup

```bash
git clone <repo>
cd tambola-royale
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your .env values
npm install
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Fill in your VITE_ values
npm install
npm run dev
```

### 4. Open in browser

- Local: `http://localhost:5173`
- LAN: `http://YOUR_LOCAL_IP:5173`

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
HOST=0.0.0.0
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/tambola_royale
JWT_SECRET=your_random_secret_here
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Add Authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://localhost:3000`
   - Your production URL
7. Add Authorized redirect URIs:
   - `http://localhost:5173`
8. Copy the **Client ID** to both `.env` files

## MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Click **Connect** → **Connect your application**
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Add to `backend/.env` as `MONGODB_URI`
7. Whitelist your IP (or use `0.0.0.0/0` for development)

## Docker Deployment

```bash
# Copy and fill in root .env
cp backend/.env.example .env

# Build and run
docker-compose up --build
```

Access at `http://localhost:3000`

## Production Deployment

### Frontend → Vercel
1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Backend → Render / Railway
1. Connect GitHub repo
2. Set root directory to `backend/`
3. Set environment variables
4. Deploy

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Framer Motion, Zustand, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO, MongoDB/Mongoose, JWT, Google Auth
- **DevOps**: Docker, Vite, PWA (Workbox)

## Features

- 🔐 Google OAuth authentication
- 🎮 Host/Join game rooms with unique codes
- 🎱 Animated number jar with physics balls
- 🎟️ Auto-generated valid Tambola tickets
- 🏆 Prize claim system with server-side validation
- 📡 Real-time Socket.IO updates
- 📱 Fully responsive + PWA installable
- 🔊 Voice announcement of drawn numbers
- 🎉 Confetti/fireworks on wins
- 🌐 LAN play support (same WiFi)
