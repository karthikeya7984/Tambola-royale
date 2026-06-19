import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useEffect, useState } from 'react';
import { apiRequest } from './utils/api';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import CreateGame from './pages/CreateGame';
import JoinGame from './pages/JoinGame';
import HostArena from './pages/HostArena';
import PlayerArena from './pages/PlayerArena';

const qc = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    if (!token) { setChecking(false); return; }
    // Verify token is still valid with backend
    apiRequest('/auth/me', { token })
      .then(() => { setValid(true); setChecking(false); })
      .catch(() => { logout(); setChecking(false); });
  }, [token]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-white/40 text-sm animate-pulse">Verifying session...</div>
      </div>
    );
  }

  return token && valid ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: '#1a1a2e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
          }}
        />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/create" element={<PrivateRoute><CreateGame /></PrivateRoute>} />
          <Route path="/join" element={<PrivateRoute><JoinGame /></PrivateRoute>} />
          <Route path="/host/:roomCode" element={<PrivateRoute><HostArena /></PrivateRoute>} />
          <Route path="/play/:roomCode" element={<PrivateRoute><PlayerArena /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
