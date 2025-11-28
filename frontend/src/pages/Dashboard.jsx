import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ActivityFormModal from '../components/ActivityFormModal';
import ActivityDetailsModal from '../components/ActivityDetailsModal'; // <--- IMPORTANTE: Nuevo componente

const API_URL = "http://localhost:8000";

const Dashboard = () => {
    const navigate = useNavigate();
    
    // --- ESTADOS DE DATOS ---
    const [actividades, setActividades] = useState([]);
    
    // --- ESTADOS DE INTERFAZ ---
    const [loading, setLoading] = useState(true);
    const [usuario, setUsuario] = useState({ nombre: "Usuario", rol: "" });
    const [errorMsg, setErrorMsg] = useState(null);
    
    // --- MODALES DE EDICIÓN/CREACIÓN ---
    const [showModal, setShowModal] = useState(false);
    const [actividadEditar, setActividadEditar] = useState(null);

    // --- NUEVO: MODAL DE DETALLES (VER) ---
    const [showDetails, setShowDetails] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);

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

    // 2. CARGA DE DATOS
    const cargarDatos = async (token) => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_URL}/actividades/`, config);
            setActividades(response.data);
        } catch (error) {
            console.error("Error Dashboard:", error);
            if (error.response?.status === 401) {
                handleLogout();
            } else {
                setErrorMsg("No se pudo conectar con el servidor.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        navigate('/login');
    };

    // 3. HANDLERS MODAL EDICIÓN
    const abrirCrear = () => {
        setActividadEditar(null);
        setShowModal(true);
    };

    const abrirEditar = (act) => {
        setActividadEditar(act);
        setShowModal(true);
    };

    // 4. HANDLER MODAL DETALLES (NUEVO)
    const verDetalles = (act) => {
        setSelectedActivity(act);
        setShowDetails(true);
    };

    // --- FUNCIÓN CLAVE: LIMPIEZA DE DATOS ---
    const prepararDatos = (formData) => {
        const dataLimpia = { ...formData };

        Object.keys(dataLimpia).forEach(key => {
            const valor = dataLimpia[key];
            if (valor === "" || valor === "NaN") {
                dataLimpia[key] = null;
            }
            else if (key.endsWith("_id") && valor !== null) {
                const numero = parseInt(valor, 10);
                dataLimpia[key] = isNaN(numero) ? null : numero;
            }
            else if (key === "avance") {
                dataLimpia[key] = parseFloat(valor) || 0.0;
            }
        });
        
        // Limpiar campos de solo lectura que vienen del backend
        delete dataLimpia.id;
        delete dataLimpia.nombre_empresa;
        delete dataLimpia.nombre_area;
        delete dataLimpia.nombre_responsable;
        delete dataLimpia.nombre_status;
        delete dataLimpia.created_at;
        delete dataLimpia.origin_date;
        delete dataLimpia.days_late;
        delete dataLimpia.prioridad_accion;

        return dataLimpia;
    };

    const handleGuardar = async (formData) => {
        const token = localStorage.getItem('access_token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const payload = prepararDatos(formData);

        try {
            if (actividadEditar) {
                await axios.put(`${API_URL}/actividades/${actividadEditar.id}`, payload, config);
                alert("✅ Actividad Actualizada");
            } else {
                await axios.post(`${API_URL}/actividades/`, payload, config);
                alert("✅ Actividad Creada");
            }
            setShowModal(false);
            cargarDatos(token);
        } catch (error) {
            console.error(error);
            let msg = "Error desconocido.";
            if (error.response?.data?.detail) {
                const det = error.response.data.detail;
                msg = Array.isArray(det) ? det.map(e => `${e.loc[1]}: ${e.msg}`).join('\n') : det;
            }
            alert(`⚠️ No se pudo guardar:\n${msg}`);
        }
    };

    // --- RENDERIZADO ---
    const esCliente = usuario.rol === 'CLIENTE';
    const puedeEditar = usuario.rol === 'ADMIN' || usuario.rol === 'CONSULTOR';

    // KPIs
    const total = actividades.length;
    const cerradas = actividades.filter(a => a.nombre_status === 'Cerrada').length; // Usamos nombre_status si viene del backend mapeado
    const atrasadas = actividades.filter(a => a.prioridad_accion === 'Atrasada').length;
    const cumplimiento = total > 0 ? Math.round((cerradas / total) * 100) : 0;

    return (
        <div className="min-vh-100 bg-light">
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
                {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="text-secondary fw-light">
                        {esCliente ? 'Mis Actividades' : 'Panel de Control'}
                    </h2>
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

                {/* KPIs */}
                <div className="row mb-4">
                    <div className="col-md-3"><div className="card text-white bg-primary shadow-sm h-100"><div className="card-body"><h6>Total</h6><h2>{total}</h2></div></div></div>
                    <div className="col-md-3"><div className="card text-white bg-success shadow-sm h-100"><div className="card-body"><h6>Completadas</h6><h2>{cerradas}</h2></div></div></div>
                    <div className="col-md-3"><div className="card text-white bg-danger shadow-sm h-100"><div className="card-body"><h6>Atrasadas</h6><h2>{atrasadas}</h2></div></div></div>
                    <div className="col-md-3"><div className="card border-primary text-primary shadow-sm h-100 bg-white"><div className="card-body text-center"><h6>Cumplimiento</h6><h2>{cumplimiento}%</h2></div></div></div>
                </div>

                {/* TABLA DE DATOS */}
                <div className="card shadow-sm border-0">
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="text-center p-5">
                                <div className="spinner-border text-primary mb-2"></div>
                                <p>Cargando...</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light text-uppercase small text-muted">
                                        <tr>
                                            <th style={{width:'90px'}} className="text-center">Acción</th>
                                            <th>ID</th>
                                            <th>Cliente</th>
                                            <th>Área</th>
                                            <th>Descripción</th>
                                            <th>Responsable</th>
                                            <th>Vence</th>
                                            <th>Status</th>
                                            <th>Avance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {actividades.length === 0 ? (
                                            <tr><td colSpan="9" className="text-center p-5 text-muted">No hay actividades registradas.</td></tr>
                                        ) : (
                                            actividades.map(act => (
                                                <tr key={act.id}>
                                                    <td className="text-center">
                                                        {/* BOTÓN OJO (VER DETALLES) - Para todos */}
                                                        <button className="btn btn-sm btn-info text-white me-1" onClick={() => verDetalles(act)} title="Ver Detalles">
                                                            👁️
                                                        </button>
                                                        
                                                        {/* BOTÓN LÁPIZ (EDITAR) - Solo con permisos */}
                                                        {puedeEditar && (
                                                            <button className="btn btn-sm btn-light text-primary border" onClick={() => abrirEditar(act)} title="Editar">
                                                                ✏️
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="fw-bold text-muted">#{act.id}</td>
                                                    <td className="fw-bold text-primary">{act.nombre_empresa}</td>
                                                    <td><span className="badge bg-secondary">{act.nombre_area}</span></td>
                                                    <td title={act.descripcion} style={{maxWidth:'250px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                                        {act.descripcion}
                                                    </td>
                                                    <td><small>{act.nombre_responsable || '-'}</small></td>
                                                    <td>{act.fecha_compromiso || '-'}</td>
                                                    <td>
                                                        <span className={`badge ${
                                                            act.nombre_status === 'Cerrada' ? 'bg-success' : 
                                                            act.nombre_status === 'Atrasada' ? 'bg-danger' : 'bg-warning text-dark'
                                                        }`}>
                                                            {act.nombre_status || 'Abierta'}
                                                        </span>
                                                    </td>
                                                    <td>{act.avance}%</td>
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

            {/* MODAL DE EDICIÓN/CREACIÓN */}
            <ActivityFormModal 
                show={showModal} 
                handleClose={() => setShowModal(false)} 
                token={localStorage.getItem('access_token')}
                onSave={handleGuardar}
                activityToEdit={actividadEditar}
            />

            {/* NUEVO: MODAL DE DETALLES (SOLO LECTURA) */}
            <ActivityDetailsModal 
                show={showDetails}
                handleClose={() => setShowDetails(false)}
                activity={selectedActivity}
            />
        </div>
    );
};

export default Dashboard;