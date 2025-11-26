import { Routes, Route, Navigate } from 'react-router-dom';

// Importamos las páginas
import LoginPage from './pages/LoginPage'; 
import Dashboard from './pages/Dashboard';
import EmpresasPage from './pages/EmpresasPage'; // <--- Asegúrate de que este archivo exista en /pages

function App() {
  // Función para simular si el usuario está logueado
  const isAuthenticated = () => {
    // Si hay token JWT guardado, asumimos que está logueado
    return localStorage.getItem('access_token') ? true : false;
  };

  // Componente que protege la ruta (Si no hay login, te manda fuera)
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Routes>
      {/* 1. Ruta de Login (Abierta/Pública) */}
      <Route path="/login" element={<LoginPage />} />

      {/* 2. Ruta Dashboard (Protegida) */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      {/* 3. NUEVA RUTA: Gestión de Empresas (Protegida) */}
      <Route 
        path="/empresas" 
        element={
          <ProtectedRoute>
            <EmpresasPage />
          </ProtectedRoute>
        } 
      />

      {/* Redirección por defecto: Si entran a la raíz, van al dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;