import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ActivityFormModal from '../components/ActivityFormModal';

const API_URL = "http://localhost:8000";

const Dashboard = () => {
    const navigate = useNavigate();
    const [actividades, setActividades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null); // Nuevo estado para errores
    const [usuario, setUsuario] = useState({ nombre: "Usuario", rol: "" });
    
    // Modales
    const [showModal, setShowModal] = useState(false);
    const [actividadEditar, setActividadEditar] = useState(null);

    // 1. INICIO
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) { navigate('/login'); return; }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUsuario({ nombre: payload.sub, rol: payload.rol });
        } catch (e) { console.error("Token corrupto"); handleLogout(); }

        cargarDatos(token);
    }, []);

    // 2. CARGA DE DATOS SEGURA (Anti-Infinite Loading)
    const cargarDatos = async (token) => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // Hacemos GET a la API
            const response = await axios.get(`${API_URL}/actividades/`, config);
            setActividades(response.data);
        } catch (error) {
            console.error("Error Dashboard:", error);
            if (error.response?.status === 401) {
                handleLogout();
            } else {
                setErrorMsg("No se pudieron cargar las actividades. Verifica el servidor.");
            }
        } finally {
            // ESTO ES CLAVE: Siempre quitamos el loading, pase lo que pase
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        navigate('/login');
    };

    // 3. HANDLERS MODAL
    const abrirCrear = () => {
        setActividadEditar(null);
        setShowModal(true);
    };

    const abrirEditar = (act) => {
        setActividadEditar(act);
        setShowModal(true);
    };

    const handleGuardar = async (formData) => {
        const token = localStorage.getItem('access_token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            // Limpieza de datos vacíos antes de enviar
            const dataClean = { ...formData };
            if (!dataClean.fecha_entrega_real) delete dataClean.fecha_entrega_real;
            if (!dataClean.proxima_validacion) delete dataClean.proxima_validacion;

            if (actividadEditar) {
                await axios.put(`${API_URL}/actividades/${actividadEditar.id}`, dataClean, config);
                alert("✅ Actividad Actualizada");
            } else {
                await axios.post(`${API_URL}/actividades/`, dataClean, config);
                alert("✅ Actividad Creada");
            }
            setShowModal(false);
            cargarDatos(token);
        } catch (error) {
            console.error(error);
            alert(`Error al guardar: ${error.response?.data?.detail || error.message}`);
        }
    };

    // --- RENDERIZADO ---
    
    // Filtro para Vista Cliente: Cliente solo ve tabla, no botones
    const esCliente = usuario.rol === 'CLIENTE';
    const puedeEditar = usuario.rol === 'ADMIN' || usuario.rol === 'CONSULTOR';

    return (
        <div className="min-vh-100 bg-light">
            {/* NAVBAR */}
            <nav className="navbar navbar-dark bg-primary px-4 shadow-sm" style={{background: '#002B5C'}}>
                <a className="navbar-brand fw-bold" href="#">🚀 SIVIACK Portal</a>
                <div className="text-white d-flex align-items-center ms-auto">
                    <div className="text-end me-3 lh-1">
                        <div className="fw-bold">{usuario.nombre}</div>
                        <small className="badge bg-warning text-dark">{usuario.rol}</small>
                    </div>
                    <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>Salir</button>
                </div>
            </nav>

            <div className="container mt-4">
                
                {/* MENSAJE DE ERROR VISIBLE */}
                {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

                {/* CABECERA */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="text-secondary fw-light">
                        {esCliente ? 'Mis Actividades' : 'Panel de Control'}
                    </h2>
                    
                    {/* BOTONERA (Oculta para Clientes) */}
                    {!esCliente && (
                        <div className="d-flex gap-2">
                            {usuario.rol === 'ADMIN' && (
                                <button className="btn btn-outline-primary" onClick={() => navigate('/empresas')}>
                                    ⚙️ Configuración
                                </button>
                            )}
                            <button className="btn btn-success shadow-sm px-4" onClick={abrirCrear}>
                                + Nueva Actividad
                            </button>
                        </div>
                    )}
                </div>

                {/* TABLA DE DATOS */}
                <div className="card shadow-sm border-0">
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="text-center p-5">
                                <div className="spinner-border text-primary mb-2"></div>
                                <p>Conectando con SIVIACK...</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light text-uppercase small text-muted">
                                        <tr>
                                            {puedeEditar && <th style={{width:'50px'}}>Editar</th>}
                                            <th>ID</th>
                                            <th>Cliente</th>
                                            <th>Área</th>
                                            <th>Descripción</th>
                                            <th>Responsable</th>
                                            <th>Vence</th>
                                            <th>Status</th>
                                            <th>Link</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {actividades.length === 0 ? (
                                            <tr><td colSpan="9" className="text-center p-5 text-muted">No hay actividades registradas.</td></tr>
                                        ) : (
                                            actividades.map(act => (
                                                <tr key={act.id}>
                                                    {puedeEditar && (
                                                        <td>
                                                            <button className="btn btn-sm btn-light text-primary" onClick={() => abrirEditar(act)}>✏️</button>
                                                        </td>
                                                    )}
                                                    <td className="fw-bold text-muted">#{act.id}</td>
                                                    <td className="fw-bold text-primary">{act.nombre_empresa}</td>
                                                    <td><span className="badge bg-secondary">{act.nombre_area}</span></td>
                                                    <td title={act.descripcion} style={{maxWidth:'250px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                                        {act.descripcion}
                                                    </td>
                                                    <td><small>{act.nombre_responsable || '-'}</small></td>
                                                    <td>{act.fecha_compromiso || '-'}</td>
                                                    <td>
                                                        <span className="badge bg-info text-dark">{act.nombre_status || 'Abierta'}</span>
                                                    </td>
                                                    <td>
                                                        {act.link_evidencia ? (
                                                            <a href={act.link_evidencia} target="_blank" className="btn btn-sm btn-outline-success">Ver 📎</a>
                                                        ) : <span className="text-muted">-</span>}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL */}
            <ActivityFormModal 
                show={showModal} 
                handleClose={() => setShowModal(false)} 
                token={localStorage.getItem('access_token')}
                onSave={handleGuardar}
                activityToEdit={actividadEditar}
            />
        </div>
    );
};

export default Dashboard;