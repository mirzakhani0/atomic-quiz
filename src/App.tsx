import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing, QuizizzMode, SimulacroMode, Admin } from './components';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/quizizz" element={<QuizizzMode />} />
        <Route path="/simulacro" element={<SimulacroMode />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;