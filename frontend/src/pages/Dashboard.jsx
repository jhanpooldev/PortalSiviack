import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ActivityFormModal from '../components/ActivityFormModal';
import ActivityDetailsModal from '../components/ActivityDetailsModal';

const API_URL = "http://127.0.0.1:8000";

const Dashboard = () => {
    const navigate = useNavigate();
    
    // DATOS
    const [actividades, setActividades] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [trabajadores, setTrabajadores] = useState([]);
    const [statusList, setStatusList] = useState([]);
    
    // INTERFAZ
    const [loading, setLoading] = useState(true);
    const [usuario, setUsuario] = useState({ nombre: "Usuario", rol: "" });
    const [errorMsg, setErrorMsg] = useState(null);
    
    // FILTROS
    const [filtros, setFiltros] = useState({
        empresa_id: '',
        status_id: '',
        responsable_id: '',
        fecha_inicio: '',
        fecha_fin: ''
    });

    // MODALES
    const [showModal, setShowModal] = useState(false);
    const [actividadEditar, setActividadEditar] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);

    // --- FUNCIÓN DE COLORES PREMIUM ---
    const getStatusBadgeStyle = (statusName) => {
        const status = (statusName || '').toLowerCase();
        if (status.includes('tiempo límite') || status.includes('atrasada')) return { bg: '#FFE2E5', text: '#F64E60', icon: '🚨' };
        if (status.includes('entregado a tiempo') || status.includes('cerrada')) return { bg: '#C9F7F5', text: '#1BC5BD', icon: '✅' };
        if (status.includes('en proceso')) return { bg: '#E1F0FF', text: '#3699FF', icon: '⏳' };
        if (status.includes('revisión')) return { bg: '#FFF4DE', text: '#FFA800', icon: '👀' };
        if (status.includes('bloqueado')) return { bg: '#3A3A3A', text: '#FFFFFF', icon: '🔒' };
        return { bg: '#F3F6F9', text: '#7E8299', icon: '⚪' };
    };

    // 1. INICIO
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) { navigate('/login'); return; }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUsuario({ nombre: payload.sub, rol: payload.rol });
        } catch (e) { console.error("Token error"); handleLogout(); }

        cargarMaestros(token);
        cargarDatos(token);
    }, []);

    // 2. CARGA MAESTROS
    const cargarMaestros = async (token) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [resListas, resEmp, resUser] = await Promise.all([
                axios.get(`${API_URL}/config/listas`, config),
                axios.get(`${API_URL}/empresas/`, config),
                axios.get(`${API_URL}/usuarios/?rol=CONSULTOR,ADMIN`, config)
            ]);
            setStatusList(resListas.data.status);
            setEmpresas(resEmp.data);
            setTrabajadores(resUser.data);
        } catch (e) { console.error("Error filtros"); }
    };

    // 3. CARGA DATOS
    const cargarDatos = async (token) => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const config = { 
                headers: { Authorization: `Bearer ${token}` },
                params: {} 
            };
            Object.keys(filtros).forEach(key => {
                if (filtros[key] !== "") config.params[key] = filtros[key];
            });

            const response = await axios.get(`${API_URL}/actividades/`, config);
            setActividades(response.data);
        } catch (error) {
            console.error("Error Dashboard:", error);
            if (error.response?.status === 401) handleLogout();
            else setErrorMsg("Error de conexión.");
        } finally {
            setLoading(false);
        }
    };

    const handleFiltroChange = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });
    const aplicarFiltros = () => cargarDatos(localStorage.getItem('access_token'));
    const limpiarFiltros = () => {
        setFiltros({ empresa_id: '', status_id: '', responsable_id: '', fecha_inicio: '', fecha_fin: '' });
        setTimeout(() => { window.location.reload(); }, 100);
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        navigate('/login');
    };

    // MODALES Y GUARDADO
    const abrirCrear = () => { setActividadEditar(null); setShowModal(true); };
    const abrirEditar = (act) => { setActividadEditar(act); setShowModal(true); };
    const verDetalles = (act) => { setSelectedActivity(act); setShowDetails(true); };

    const handleGuardar = async (formData) => {
        const token = localStorage.getItem('access_token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const prepararDatos = (d) => {
             const obj = {...d};
             Object.keys(obj).forEach(k => { 
                 if(obj[k]==="" || obj[k]==="NaN") obj[k]=null; 
                 else if(k.endsWith("_id") && obj[k]!=null) obj[k]=parseInt(obj[k]);
                 else if(k==="avance") obj[k]=parseFloat(obj[k])||0; 
             });
             delete obj.id; delete obj.nombre_empresa; delete obj.nombre_area; 
             delete obj.nombre_responsable; delete obj.nombre_status; delete obj.days_late; delete obj.prioridad_accion; delete obj.created_at; delete obj.origin_date;
             return obj;
        };
        const payload = prepararDatos(formData);

        try {
            if (actividadEditar) await axios.put(`${API_URL}/actividades/${actividadEditar.id}`, payload, config);
            else await axios.post(`${API_URL}/actividades/`, payload, config);
            
            setShowModal(false);
            cargarDatos(token);
            alert("✅ Guardado exitoso");
        } catch (error) { 
            console.error(error);
            alert(`Error al guardar: ${error.response?.data?.detail || "Datos inválidos"}`);
        }
    };

    const esCliente = usuario.rol === 'CLIENTE';
    const puedeEditar = usuario.rol === 'ADMIN' || usuario.rol === 'CONSULTOR';

    // KPIs
    const total = actividades.length;
    const cerradas = actividades.filter(a => (a.nombre_status || '').toLowerCase().includes('cerrada') || (a.nombre_status || '').toLowerCase().includes('entregado')).length;
    const atrasadas = actividades.filter(a => (a.prioridad_accion === 'Atrasada') || (a.nombre_status || '').toLowerCase().includes('atrasado')).length;
    const cumplimiento = total > 0 ? Math.round((cerradas / total) * 100) : 0;

    return (
        <div className="min-vh-100" style={{ backgroundColor: '#F3F6F9', fontFamily: 'Poppins, sans-serif' }}>
            
            {/* NAVBAR PREMIUM */}
            <nav className="navbar navbar-dark shadow-sm px-4" style={{ background: 'linear-gradient(90deg, #1e1e2f 0%, #2c3e50 100%)' }}>
                <a className="navbar-brand fw-bold d-flex align-items-center" href="#">
                    <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>🚀</span> SIVIACK <span className="fw-light ms-2 opacity-75">PORTAL</span>
                </a>
                <div className="text-white d-flex align-items-center ms-auto">
                    <div className="text-end me-3 lh-1">
                        <div className="fw-bold">{usuario.nombre}</div>
                        <small className="badge bg-light text-dark mt-1" style={{ fontSize: '0.7rem' }}>{usuario.rol}</small>
                    </div>
                    <button className="btn btn-outline-light btn-sm rounded-pill px-3" onClick={handleLogout}>Salir</button>
                </div>
            </nav>

            <div className="container-fluid px-5 mt-5">
                {errorMsg && <div className="alert alert-danger shadow-sm border-0">{errorMsg}</div>}

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="text-dark fw-bold mb-0">{esCliente ? 'Mis Actividades' : 'Panel de Control'}</h2>
                        <p className="text-muted small">Gestión estratégica de proyectos y cumplimiento.</p>
                    </div>
                    
                    {!esCliente && (
                        <div className="d-flex gap-2">
                            {/* --- BOTÓN NUEVO: MIS PENDIENTES --- */}
                            <button className="btn btn-info text-white shadow fw-bold px-3 rounded-3" onClick={() => navigate('/mis-pendientes')}>
                                ⚡ Mis Pendientes
                            </button>
                            
                            {usuario.rol === 'ADMIN' && (
                                <button className="btn btn-light text-primary border shadow-sm fw-bold" onClick={() => navigate('/empresas')}>
                                    ⚙️ Configuración
                                </button>
                            )}
                            <button className="btn btn-primary shadow fw-bold px-4 rounded-3" onClick={abrirCrear}>
                                + Nueva Actividad
                            </button>
                        </div>
                    )}
                </div>

                {/* FILTROS ELEGANTES */}
                <div className="card mb-4 border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-body bg-white p-4">
                        <h6 className="text-uppercase text-muted fw-bold mb-3" style={{fontSize: '0.8rem', letterSpacing: '1px'}}>🔍 Filtros de Búsqueda</h6>
                        <div className="row g-3 align-items-end">
                            {!esCliente && (
                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Cliente</label>
                                    <select className="form-select border-0 bg-light" name="empresa_id" value={filtros.empresa_id} onChange={handleFiltroChange}>
                                        <option value="">Todos los Clientes</option>
                                        {empresas.map(e => <option key={e.id} value={e.id}>{e.razon_social}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="col-md-2">
                                <label className="form-label small fw-bold">Responsable</label>
                                <select className="form-select border-0 bg-light" name="responsable_id" value={filtros.responsable_id} onChange={handleFiltroChange}>
                                    <option value="">Todos</option>
                                    {trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombre_completo}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label small fw-bold">Estado</label>
                                <select className="form-select border-0 bg-light" name="status_id" value={filtros.status_id} onChange={handleFiltroChange}>
                                    <option value="">Todos</option>
                                    {statusList.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3 d-flex gap-2">
                                <div className="w-50">
                                    <label className="form-label small fw-bold">Desde</label>
                                    <input type="date" className="form-control border-0 bg-light" name="fecha_inicio" value={filtros.fecha_inicio} onChange={handleFiltroChange} />
                                </div>
                                <div className="w-50">
                                    <label className="form-label small fw-bold">Hasta</label>
                                    <input type="date" className="form-control border-0 bg-light" name="fecha_fin" value={filtros.fecha_fin} onChange={handleFiltroChange} />
                                </div>
                            </div>
                            <div className="col-md-2 d-flex gap-2">
                                <button className="btn btn-primary w-100 fw-bold" onClick={aplicarFiltros}>Aplicar</button>
                                <button className="btn btn-light text-muted w-auto" onClick={limpiarFiltros} title="Limpiar">✖</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPIs VISUALES */}
                <div className="row mb-4 g-3">
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm h-100 rounded-4" style={{background: 'linear-gradient(45deg, #3699FF, #0055ff)'}}>
                            <div className="card-body text-white p-4">
                                <h6 className="opacity-75 mb-1">TOTAL ACTIVIDADES</h6>
                                <h2 className="display-5 fw-bold mb-0">{total}</h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm h-100 rounded-4" style={{background: 'linear-gradient(45deg, #1BC5BD, #0f8e87)'}}>
                            <div className="card-body text-white p-4">
                                <h6 className="opacity-75 mb-1">COMPLETADAS</h6>
                                <h2 className="display-5 fw-bold mb-0">{cerradas}</h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm h-100 rounded-4" style={{background: 'linear-gradient(45deg, #F64E60, #a81c2a)'}}>
                            <div className="card-body text-white p-4">
                                <h6 className="opacity-75 mb-1">CRÍTICAS / ATRASADAS</h6>
                                <h2 className="display-5 fw-bold mb-0">{atrasadas}</h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm h-100 rounded-4 bg-white">
                            <div className="card-body p-4 text-center">
                                <h6 className="text-muted fw-bold mb-2">CUMPLIMIENTO</h6>
                                <div className="position-relative d-inline-block">
                                    <svg viewBox="0 0 36 36" className="d-block mx-auto" style={{width: '80px', height: '80px'}}>
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E4E6EF" strokeWidth="3" />
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3699FF" strokeWidth="3" strokeDasharray={`${cumplimiento}, 100`} />
                                    </svg>
                                    <span className="position-absolute top-50 start-50 translate-middle fw-bold fs-4 text-primary">{cumplimiento}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABLA PREMIUM */}
                <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-5">
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="text-center p-5"><div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}}></div><h5 className="text-muted">Cargando datos en tiempo real...</h5></div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0" style={{borderCollapse: 'separate', borderSpacing: '0'}}>
                                    <thead className="bg-light">
                                        <tr className="text-uppercase text-muted" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>
                                            <th className="ps-4 py-3 border-0">Acción</th>
                                            <th className="border-0">ID</th>
                                            <th className="border-0">Cliente</th>
                                            <th className="border-0">Área</th>
                                            <th className="border-0">Descripción</th>
                                            <th className="border-0">Responsable</th>
                                            <th className="border-0">Vence</th>
                                            <th className="border-0">Status Final</th>
                                            <th className="border-0 pe-4">Avance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {actividades.length === 0 ? (
                                            <tr><td colSpan="9" className="text-center p-5 text-muted fw-bold">No se encontraron resultados.</td></tr>
                                        ) : (
                                            actividades.map(act => {
                                                const badgeStyle = getStatusBadgeStyle(act.nombre_status); 
                                                return (
                                                    <tr key={act.id} className="border-bottom-0">
                                                        <td className="ps-4 py-3">
                                                            <button className="btn btn-sm btn-light text-info me-1 rounded-circle" onClick={() => verDetalles(act)} title="Ver Detalles">👁️</button>
                                                            {puedeEditar && <button className="btn btn-sm btn-light text-primary rounded-circle" onClick={() => abrirEditar(act)} title="Editar">✏️</button>}
                                                        </td>
                                                        <td className="fw-bold text-muted small">#{act.id}</td>
                                                        <td className="fw-bold text-dark">{act.nombre_empresa}</td>
                                                        <td><span className="badge bg-white text-secondary border border-secondary fw-normal">{act.nombre_area}</span></td>
                                                        <td title={act.descripcion} style={{maxWidth:'250px'}}>
                                                            <div className="text-truncate fw-500 text-dark">{act.descripcion}</div>
                                                        </td>
                                                        <td>
                                                            {act.nombre_responsable ? (
                                                                <div className="d-flex align-items-center">
                                                                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: '25px', height: '25px', fontSize: '0.7rem'}}>
                                                                        {act.nombre_responsable.charAt(0)}
                                                                    </div>
                                                                    <span className="small">{act.nombre_responsable}</span>
                                                                </div>
                                                            ) : <span className="text-muted small">-</span>}
                                                        </td>
                                                        <td className="small text-muted">{act.fecha_compromiso || '-'}</td>
                                                        <td>
                                                            <span className="badge border-0 fw-bold px-3 py-2" 
                                                                style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text, borderRadius: '6px' }}>
                                                                {badgeStyle.icon} {act.nombre_status || 'Abierta'}
                                                            </span>
                                                        </td>
                                                        <td className="pe-4">
                                                            <div className="d-flex align-items-center">
                                                                <div className="progress flex-grow-1 me-2" style={{height: '6px', backgroundColor: '#E4E6EF'}}>
                                                                    <div className="progress-bar rounded-pill" style={{width: `${act.avance}%`, backgroundColor: act.avance === 100 ? '#1BC5BD' : '#3699FF'}}></div>
                                                                </div>
                                                                <span className="small fw-bold text-muted">{act.avance}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODALES */}
            <ActivityFormModal show={showModal} handleClose={() => setShowModal(false)} token={localStorage.getItem('access_token')} onSave={handleGuardar} activityToEdit={actividadEditar} />
            <ActivityDetailsModal show={showDetails} handleClose={() => setShowDetails(false)} activity={selectedActivity} />
        </div>
    );
};

export default Dashboard;