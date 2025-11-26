import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = "http://localhost:8000";

const Dashboard = () => {
    const navigate = useNavigate();
    
    // --- ESTADOS DE DATOS ---
    const [actividades, setActividades] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [areas, setAreas] = useState([]);
    const [trabajadores, setTrabajadores] = useState([]); 
    
    // --- ESTADOS DE INTERFAZ ---
    const [loading, setLoading] = useState(true);
    const [usuario, setUsuario] = useState({ nombre: "Usuario", rol: "" }); // ROL IMPORTANTE
    const [showModal, setShowModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false); 
    const [idEdicion, setIdEdicion] = useState(null);      

    // --- FORMULARIO (Estado Inicial Completo) ---
    const initialFormState = {
        descripcion: '',
        empresa_id: '',
        area_id: '',
        prioridad_atencion: 'Media',
        fecha_compromiso: '',
        shk: '',
        dueno_proceso: '', 
        status: 'Abierta',
        tipo_servicio: '',
        observaciones: ''
    };
    const [tarea, setTarea] = useState(initialFormState);
    const [areasFiltradas, setAreasFiltradas] = useState([]);

    // 1. CARGA INICIAL Y SEGURIDAD
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) { navigate('/login'); return; }

        try {
            // Decodificamos el token para obtener el ROL
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUsuario({ nombre: payload.sub, rol: payload.rol });
        } catch (e) { console.error("Token error"); }

        cargarTodo(token);
    }, []);

    // 2. EFECTO PARA FILTRAR ÁREAS
    useEffect(() => {
        if (tarea.empresa_id) {
            const filtradas = areas.filter(a => a.empresa_id == tarea.empresa_id);
            setAreasFiltradas(filtradas);
        } else {
            setAreasFiltradas([]);
        }
    }, [tarea.empresa_id, areas]);

    // 3. CARGAR DATOS
    const cargarTodo = async (token) => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // Carga paralela optimizada
            const [resAct, resEmp, resArea, resTrab] = await Promise.all([
                axios.get(`${API_URL}/actividades/`, config),
                axios.get(`${API_URL}/empresas/`, config),
                axios.get(`${API_URL}/areas/`, config),
                axios.get(`${API_URL}/usuarios/?rol=CONSULTOR`, config)
            ]);

            setActividades(resAct.data);
            setEmpresas(resEmp.data);
            setAreas(resArea.data);
            setTrabajadores(resTrab.data);

        } catch (error) {
            console.error("Error cargando datos", error);
            if (error.response?.status === 401) handleLogout();
        }
        setLoading(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        navigate('/login');
    };

    // 4. MODALES (Crear/Editar)
    const abrirCrear = () => {
        setModoEdicion(false);
        setTarea(initialFormState);
        if(trabajadores.length > 0) setTarea(prev => ({...prev, dueno_proceso: trabajadores[0].nombre_completo}));
        setShowModal(true);
    };

    const abrirEditar = (actividad) => {
        setModoEdicion(true);
        setIdEdicion(actividad.id);
        setTarea({
            descripcion: actividad.descripcion,
            empresa_id: actividad.empresa_id,
            area_id: actividad.area_id,
            prioridad_atencion: actividad.prioridad_atencion || 'Media',
            fecha_compromiso: actividad.fecha_compromiso || '',
            shk: actividad.shk || '',
            dueno_proceso: actividad.dueno_proceso || '',
            status: actividad.status || 'Abierta',
            tipo_servicio: actividad.tipo_servicio || '',
            observaciones: actividad.observaciones || ''
        });
        setShowModal(true);
    };

    // 5. GUARDAR
    const handleGuardar = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('access_token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            if (modoEdicion) {
                await axios.put(`${API_URL}/actividades/${idEdicion}`, tarea, config);
                alert("✅ Actividad actualizada correctamente");
            } else {
                await axios.post(`${API_URL}/actividades/`, tarea, config);
                alert("✅ Nueva actividad registrada");
            }
            setShowModal(false);
            cargarTodo(token); 
        } catch (error) {
            alert("Error al guardar. Revisa los datos.");
        }
    };

    // KPIs
    const total = actividades.length;
    const cerradas = actividades.filter(a => a.status === 'Cerrada').length;
    const atrasadas = actividades.filter(a => a.status === 'Atrasada').length;
    const cumplimiento = total > 0 ? Math.round((cerradas / total) * 100) : 0;

    // --- PERMISOS (Protección Visual) ---
    const esAdmin = usuario.rol === 'ADMIN';
    const puedeEditar = usuario.rol === 'ADMIN' || usuario.rol === 'CONSULTOR'; 
    // Los CLIENTES (rol='CLIENTE') tendrán puedeEditar = false

    return (
        <div className="min-vh-100 bg-light">
            <nav className="navbar navbar-dark bg-primary px-4 shadow-sm" style={{background: 'linear-gradient(to right, #002B5C, #0d47a1)'}}>
                <a className="navbar-brand fw-bold" href="#">🚀 SIVIACK Portal</a>
                <div className="ms-auto text-white d-flex align-items-center">
                    <span className="me-3 d-none d-md-block">
                        {usuario.nombre} <span className="badge bg-warning text-dark ms-2">{usuario.rol}</span>
                    </span>
                    <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>Salir</button>
                </div>
            </nav>

            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-light text-secondary">Panel de Control</h2>
                    <div className="d-flex gap-2">
                        {/* SOLO ADMIN VE GESTIÓN */}
                        {esAdmin && (
                            <button className="btn btn-outline-primary" onClick={() => navigate('/empresas')}>
                                🏢 Gestión Total
                            </button>
                        )}
                        
                        {/* SOLO CONSULTOR/ADMIN PUEDE CREAR */}
                        {puedeEditar && (
                            <button className="btn btn-success shadow-sm" onClick={abrirCrear}>
                                + Nueva Actividad
                            </button>
                        )}
                    </div>
                </div>

                {/* KPIs VISIBLES PARA TODOS */}
                <div className="row mb-4">
                    <div className="col-md-3"><div className="card text-white bg-primary shadow-sm h-100"><div className="card-body"><h6>Total Actividades</h6><h2>{total}</h2></div></div></div>
                    <div className="col-md-3"><div className="card text-white bg-success shadow-sm h-100"><div className="card-body"><h6>Completadas</h6><h2>{cerradas}</h2></div></div></div>
                    <div className="col-md-3"><div className="card text-white bg-danger shadow-sm h-100"><div className="card-body"><h6>Atrasadas</h6><h2>{atrasadas}</h2></div></div></div>
                    <div className="col-md-3"><div className="card border-primary text-primary shadow-sm h-100 bg-white"><div className="card-body text-center"><h6>Cumplimiento</h6><h2>{cumplimiento}%</h2></div></div></div>
                </div>

                {/* TABLA PRINCIPAL */}
                <div className="card shadow-sm border-0">
                    <div className="card-body p-0">
                        {loading ? <div className="p-5 text-center">Cargando...</div> : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-3" style={{width: '50px'}}>Acción</th>
                                            <th>ID</th>
                                            <th>Cliente</th>
                                            <th>Área</th>
                                            <th>SHK</th>
                                            <th>Descripción</th>
                                            <th>Dueño Proceso</th>
                                            <th>Vence</th>
                                            <th>Status</th>
                                            <th>Avance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {actividades.map(act => (
                                            <tr key={act.id}>
                                                <td className="ps-3">
                                                    {/* BOTÓN EDITAR PROTEGIDO: Solo visible si tienes permiso */}
                                                    {puedeEditar && (
                                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => abrirEditar(act)}>✏️</button>
                                                    )}
                                                </td>
                                                <td className="text-muted">#{act.id}</td>
                                                <td className="fw-bold">{act.nombre_empresa}</td>
                                                <td><span className="badge bg-secondary">{act.nombre_area}</span></td>
                                                <td><small className="text-muted">{act.shk || '-'}</small></td>
                                                <td title={act.descripcion} style={{maxWidth:'200px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                                    {act.descripcion}
                                                </td>
                                                <td><small>{act.dueno_proceso || 'S/A'}</small></td>
                                                <td>{act.fecha_compromiso || '-'}</td>
                                                <td>
                                                    <span className={`badge ${act.status==='Cerrada'?'bg-success':act.status==='Atrasada'?'bg-danger':'bg-warning text-dark'}`}>
                                                        {act.status}
                                                    </span>
                                                </td>
                                                <td>{act.avance}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL FORMULARIO (Solo se renderiza si tienes permisos) */}
            {showModal && puedeEditar && (
                <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className={`modal-header text-white ${modoEdicion ? 'bg-warning' : 'bg-success'}`}>
                                <h5 className="modal-title">
                                    {modoEdicion ? '✏️ Editar Actividad' : '➕ Nueva Actividad'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleGuardar}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold">Empresa (Cliente)</label>
                                            <select className="form-select" required 
                                                value={tarea.empresa_id} 
                                                onChange={e => setTarea({...tarea, empresa_id: e.target.value, area_id: ''})}
                                                disabled={modoEdicion} // Bloqueado al editar para mantener integridad
                                            >
                                                <option value="">-- Seleccione Empresa --</option>
                                                {empresas.map(e => <option key={e.id} value={e.id}>{e.razon_social}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold">Área Solicitante</label>
                                            <select className="form-select" required 
                                                value={tarea.area_id} 
                                                onChange={e => setTarea({...tarea, area_id: e.target.value})}
                                                disabled={!tarea.empresa_id}
                                            >
                                                <option value="">{tarea.empresa_id ? '-- Seleccione Área --' : '-- Primero elija Empresa --'}</option>
                                                {areasFiltradas.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.codigo})</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Descripción (Backlog)</label>
                                        <textarea className="form-control" rows="2" required value={tarea.descripcion} onChange={e => setTarea({...tarea, descripcion: e.target.value})} />
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold text-primary">Dueño del Proceso</label>
                                            <select className="form-select" required value={tarea.dueno_proceso} onChange={e => setTarea({...tarea, dueno_proceso: e.target.value})}>
                                                <option value="">-- Seleccione Consultor --</option>
                                                {trabajadores.map(t => (
                                                    <option key={t.id} value={t.nombre_completo}>{t.nombre_completo}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Prioridad</label>
                                            <select className="form-select" value={tarea.prioridad_atencion} onChange={e => setTarea({...tarea, prioridad_atencion: e.target.value})}>
                                                <option>Alta</option><option>Media</option><option>Baja</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">Fecha Compromiso</label>
                                            <input type="date" className="form-control" value={tarea.fecha_compromiso} onChange={e => setTarea({...tarea, fecha_compromiso: e.target.value})} />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">Status</label>
                                            <select className="form-select" value={tarea.status} onChange={e => setTarea({...tarea, status: e.target.value})}>
                                                <option value="Abierta">Abierta</option>
                                                <option value="En Proceso">En Proceso</option>
                                                <option value="Cerrada">Cerrada</option>
                                                <option value="Atrasada">Atrasada</option>
                                                <option value="Bloqueado">Bloqueado</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">SHK</label>
                                            <input type="text" className="form-control" value={tarea.shk} onChange={e => setTarea({...tarea, shk: e.target.value})} />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Observaciones</label>
                                        <input type="text" className="form-control" value={tarea.observaciones} onChange={e => setTarea({...tarea, observaciones: e.target.value})} />
                                    </div>

                                    <div className="d-grid gap-2">
                                        <button type="submit" className={`btn ${modoEdicion ? 'btn-warning' : 'btn-success'}`}>
                                            {modoEdicion ? '💾 Guardar Cambios' : '🚀 Crear Actividad'}
                                        </button>
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;