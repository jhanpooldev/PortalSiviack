import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = "http://localhost:8000";

const MyTasksPage = () => {
    const navigate = useNavigate();
    const [tareas, setTareas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) { navigate('/login'); return; }
        cargarPendientes(token);
    }, []);

    const cargarPendientes = async (token) => {
        try {
            const res = await axios.get(`${API_URL}/mis-pendientes/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTareas(res.data);
        } catch (error) {
            console.error("Error cargando pendientes");
        } finally {
            setLoading(false);
        }
    };

    // Función de color para urgencia
    const getUrgencyColor = (fecha) => {
        const dias = Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24));
        if (dias < 0) return 'border-danger border-start-5'; // Atrasada
        if (dias <= 3) return 'border-warning border-start-5'; // Próxima a vencer
        return 'border-success border-start-5'; // A tiempo
    };

    return (
        <div className="min-vh-100 bg-light" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <nav className="navbar navbar-dark bg-dark px-4 mb-4">
                <a className="navbar-brand" href="#">⚡ Mis Pendientes</a>
                <button className="btn btn-outline-light btn-sm" onClick={() => navigate('/dashboard')}>Volver al Dashboard</button>
            </nav>

            <div className="container">
                <h3 className="mb-4 fw-bold text-secondary">Tu Agenda de Trabajo</h3>

                {loading ? <div className="text-center mt-5"><div className="spinner-border"></div></div> : (
                    <div className="row">
                        {tareas.length === 0 ? (
                            <div className="col-12 text-center mt-5">
                                <h4>🎉 ¡Todo al día! No tienes actividades pendientes.</h4>
                            </div>
                        ) : (
                            tareas.map(t => (
                                <div key={t.id} className="col-md-6 col-lg-4 mb-3">
                                    <div className={`card shadow-sm h-100 ${getUrgencyColor(t.fecha_compromiso)}`}>
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <span className="badge bg-secondary">{t.nombre_empresa}</span>
                                                <small className="text-muted">{t.fecha_compromiso}</small>
                                            </div>
                                            <h5 className="card-title fw-bold text-primary">{t.nombre_area}</h5>
                                            <p className="card-text text-truncate" style={{maxWidth: '100%'}} title={t.descripcion}>
                                                {t.descripcion}
                                            </p>
                                            <div className="d-flex justify-content-between align-items-center mt-3">
                                                <span className={`badge ${t.nombre_status.includes('Atrasada') ? 'bg-danger' : 'bg-info text-dark'}`}>
                                                    {t.nombre_status}
                                                </span>
                                                <small className="fw-bold text-muted">{t.avance}%</small>
                                            </div>
                                        </div>
                                        <div className="card-footer bg-white border-0 text-end">
                                            <button className="btn btn-sm btn-primary" onClick={() => navigate('/dashboard')}>Gestionar</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTasksPage;
