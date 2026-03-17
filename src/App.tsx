import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing, QuizizzMode, SimulacroMode, Admin, Login } from './components';
import { AuthProvider, useAuth } from './hooks/useAuth';

function ProtectedAdminRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Admin /> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/quizizz" element={<QuizizzMode />} />
      <Route path="/simulacro" element={<SimulacroMode />} />
      <Route path="/login" element={<Login />} />
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