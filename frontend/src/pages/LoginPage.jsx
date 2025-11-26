import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:8000";

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await axios.post(`${API_URL}/token`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      localStorage.setItem('access_token', response.data.access_token);
      navigate('/dashboard', { replace: true });

    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Credenciales inválidas.');
      } else {
        setError('Error de conexión con el servidor.');
      }
    }
  };

  return (
    // AQUÍ ESTÁ LA MAGIA DEL FONDO
    <div 
      className="container-fluid vh-100 d-flex align-items-center justify-content-center"
      style={{ 
          backgroundImage: "url('/siviack_background.png')", 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="row justify-content-center w-100">
        <div className="col-md-5 col-lg-4">
          <div className="card shadow-lg border-0 rounded-3">
            
            {/* Cabecera con Logo */}
            <div className="card-header text-center rounded-top py-4" style={{ backgroundColor: '#f4f4f4' }}> 
              <img 
                src="/siviack_logo.png" 
                alt="Logo SIVIACK" 
                style={{ width: '140px', marginBottom: '10px' }} 
              />
              <h4 className="mb-0 text-black" style={{ fontWeight: '300', letterSpacing: '1px' }}>PORTAL DE GESTIÓN</h4>
            </div>

            {/* Cuerpo del Formulario */}
            <div className="card-body p-4 bg-white">
              {error && <div className="alert alert-danger">{error}</div>}
              
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label fw-bold text-secondary">Email</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Email"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-bold text-secondary">Contraseña</label>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-danger w-100 btn-lg"
                  style={{ backgroundColor: '#D32F2F', border: 'none' }}
                >
                  INGRESAR
                </button>
              </form>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;