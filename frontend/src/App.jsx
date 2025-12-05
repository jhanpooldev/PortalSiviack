import { Routes, Route, Navigate } from 'react-router-dom';

// Importaciones de Páginas
import LoginPage from './pages/LoginPage'; 
import Dashboard from './pages/Dashboard';
import AdminPage from './pages/EmpresasPage'; 
import MyTasksPage from './pages/MyTasksPage'; // <--- 1. IMPORTANTE: Que esto no falte

function App() {
  const isAuthenticated = () => localStorage.getItem('access_token') ? true : false;

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Routes>
      {/* Ruta Pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas Protegidas */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/empresas" 
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        } 
      />

      {/* 2. IMPORTANTE: Esta es la ruta que hace funcionar el botón */}
      <Route 
        path="/mis-pendientes" 
        element={
          <ProtectedRoute>
            <MyTasksPage />
          </ProtectedRoute>
        } 
      />

      {/* Redirección por defecto */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;