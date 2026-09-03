import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Detail from './pages/Detail.jsx';

function Protected({ children }) {
  const { isAuth } = useAuth();
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
}

function Guest({ children }) {
  const { isAuth } = useAuth();
  if (isAuth) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <div className="relative min-h-[100dvh]">
      <div aria-hidden="true" className="cyber-bg cyber-vignette" />
      <div aria-hidden="true" className="cyber-bg cyber-scanline overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-px animate-scanline bg-gradient-to-b from-transparent via-neon/40 to-transparent" />
      </div>
      <div className="relative z-10">
        <Routes>
          <Route path="/login" element={<Guest><Login /></Guest>} />
          <Route path="/register" element={<Guest><Register /></Guest>} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/bills/:id" element={<Protected><Detail /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}