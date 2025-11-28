import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ActivityFormModal from '../components/ActivityFormModal';

const API_URL = "http://localhost:8000";

const Dashboard = () => {
    const navigate = useNavigate();
    
    // Estados de Datos
    const [actividades, setActividades] = useState([]);
    
    // Estados de Interfaz
    const [loading, setLoading] = useState(true);
    const [usuario, setUsuario] = useState({ nombre: "Usuario", rol: "" });
    const [errorMsg, setErrorMsg] = useState(null);
    
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
        } catch (e) { console.error("Token error"); handleLogout(); }

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

    // 3. HANDLERS MODAL
    const abrirCrear = () => {
        setActividadEditar(null);
        setShowModal(true);
    };

    const abrirEditar = (act) => {
        setActividadEditar(act);
        setShowModal(true);
    };

    // --- FUNCIÓN CLAVE: LIMPIEZA DE DATOS (EVITA EL ERROR 422) ---
    const prepararDatos = (formData) => {
        const dataLimpia = { ...formData };

        Object.keys(dataLimpia).forEach(key => {
            const valor = dataLimpia[key];

            // 1. Convertir vacíos a NULL
            if (valor === "" || valor === "NaN") {
                dataLimpia[key] = null;
            }
            
            // 2. Convertir IDs numéricos que vienen como string
            else if (key.endsWith("_id") && valor !== null) {
                const numero = parseInt(valor, 10);
                dataLimpia[key] = isNaN(numero) ? null : numero;
            }
            
            // 3. Avance a Float
            else if (key === "avance") {
                dataLimpia[key] = parseFloat(valor) || 0.0;
            }
        });
        
        // Eliminamos campos que no deben enviarse al crear/editar si existen
        delete dataLimpia.id;
        delete dataLimpia.nombre_empresa;
        delete dataLimpia.nombre_area;
        delete dataLimpia.nombre_responsable;
        delete dataLimpia.nombre_status;

        return dataLimpia;
    };

    const handleGuardar = async (formData) => {
        const token = localStorage.getItem('access_token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // LIMPIAR DATOS
        const payload = prepararDatos(formData);
        console.log("Enviando Payload Limpio:", payload);

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
                                                            <a href={act.link_evidencia} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success">Ver 📎</a>
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