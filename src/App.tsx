import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing, QuizizzMode, SimulacroMode, Admin, Login, Register, UserDashboard, ProtectedRoute } from './components';
import { AuthProvider } from './hooks/useAuth';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Rutas Protegidas para Alumnos */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <UserDashboard />
        </ProtectedRoute>
      } />
      <Route path="/quizizz" element={
        <ProtectedRoute>
          <QuizizzMode />
        </ProtectedRoute>
      } />
      <Route path="/simulacro" element={
        <ProtectedRoute>
          <SimulacroMode />
        </ProtectedRoute>
      } />
      
      {/* Ruta Protegida para Admin */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <Admin />
        </ProtectedRoute>
      } />
      
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
