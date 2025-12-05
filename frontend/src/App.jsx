import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage'; 
import Dashboard from './pages/Dashboard';
import EmpresasPage from './pages/EmpresasPage'; // O AdminPage si le cambiaste el nombre
import MyTasksPage from './pages/MyTasksPage'; // <--- IMPORTAR

function App() {
  const isAuthenticated = () => localStorage.getItem('access_token') ? true : false;

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />

      <Route path="/empresas" element={
          <ProtectedRoute><EmpresasPage /></ProtectedRoute>
      } />

      {/* NUEVA RUTA */}
      <Route path="/mis-pendientes" element={
          <ProtectedRoute><MyTasksPage /></ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;