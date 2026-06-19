import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import CreateGame from './pages/CreateGame';
import JoinGame from './pages/JoinGame';
import HostArena from './pages/HostArena';
import PlayerArena from './pages/PlayerArena';

const qc = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/" replace />;
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
