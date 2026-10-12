import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Detail from './pages/Detail.jsx';
import Token from './pages/Token.jsx';

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
    <div className="min-h-[100dvh] bg-surface2">
      <Routes>
        <Route path="/login" element={<Guest><Login /></Guest>} />
        <Route path="/register" element={<Guest><Register /></Guest>} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/bills/:id" element={<Protected><Detail /></Protected>} />
        <Route path="/token" element={<Protected><Token /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}