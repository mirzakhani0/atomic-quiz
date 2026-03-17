import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing, QuizizzMode, SimulacroMode, Admin, Login, Register, UserDashboard } from './components';
import { AuthProvider, useAuth } from './hooks/useAuth';

function ProtectedAdminRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Admin /> : <Navigate to="/login" replace />;
}

function ProtectedUserRoute() {
  const { currentUser } = useAuth();
  return currentUser ? <UserDashboard /> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedUserRoute />} />
      <Route path="/quizizz" element={<QuizizzMode />} />
      <Route path="/simulacro" element={<SimulacroMode />} />
      <Route path="/admin" element={<ProtectedAdminRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}

export default App;