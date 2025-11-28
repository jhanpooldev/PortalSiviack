import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "http://localhost:8000";

const ActivityFormModal = ({ show, handleClose, token, onSave, activityToEdit }) => {
    
    // --- 1. ESTADOS DE CATÁLOGOS (Listas del Backend) ---
    const [listas, setListas] = useState({
        origenes: [], tipos_req: [], servicios: [], intervenciones: [],
        medios: [], resultados: [], status: []
    });
    const [empresas, setEmpresas] = useState([]);
    const [areas, setAreas] = useState([]); // Todas las áreas
    const [areasFiltradas, setAreasFiltradas] = useState([]); // Áreas de la empresa seleccionada
    const [trabajadores, setTrabajadores] = useState([]);

    // --- 2. ESTADO DEL FORMULARIO (30+ Campos del SRS) ---
    const initialState = {
        // Generales
        empresa_id: '', area_id: '', descripcion: '', development_doing: '', orden_servicio_legal: '',
        // Clasificación
        origen_id: '', tipo_req_id: '', tipo_servicio_id: '', tipo_intervencion_id: '',
        // Roles
        dueno_proceso: '', responsable_id: '', revisor_id: '', aprobador_id: '', autoridad_rq: '',
        // Fechas y Control
        fecha_compromiso: '', fecha_entrega_real: '', proxima_validacion: '', frecuencia_control_dias: '',
        avance: 0, condicion_actual: 'Abierta', status_id: '', prioridad_atencion: 'Media',
        // Entregables
        producto_entregable: '', medio_control_id: '', control_resultados_id: '',
        link_evidencia: '', observaciones: ''
    };
    
    const [formData, setFormData] = useState(initialState);
    const [tabActiva, setTabActiva] = useState(1); // Control de Pestañas (1, 2, 3)

    // --- 3. EFECTOS (Lógica de Negocio) ---
    
    // Cargar listas al abrir
    useEffect(() => {
        if (show) cargarMaestros();
    }, [show]);

    // Cargar datos al editar
    useEffect(() => {
        if (activityToEdit) {
            // Mapeo manual para asegurar tipos
            setFormData({ 
                ...initialState, 
                ...activityToEdit,
                // Asegurar que los IDs sean strings para los selects o números según corresponda
                empresa_id: activityToEdit.empresa_id || '',
                area_id: activityToEdit.area_id || ''
            });
        } else {
            setFormData(initialState);
        }
    }, [activityToEdit]);

    // LÓGICA DE CASCADA: Empresa -> Área
    useEffect(() => {
        if (formData.empresa_id) {
            const filtradas = areas.filter(a => a.empresa_id == formData.empresa_id);
            setAreasFiltradas(filtradas);
        } else {
            setAreasFiltradas([]);
        }
    }, [formData.empresa_id, areas]);

    const cargarMaestros = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [resListas, resEmp, resArea, resUser] = await Promise.all([
                axios.get(`${API_URL}/config/listas`, config),
                axios.get(`${API_URL}/empresas/`, config),
                axios.get(`${API_URL}/areas/`, config),
                axios.get(`${API_URL}/usuarios/`, config)
            ]);
            setListas(resListas.data);
            setEmpresas(resEmp.data);
            setAreas(resArea.data);
            setTrabajadores(resUser.data);
        } catch (error) { console.error("Error cargando catálogos", error); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validaciones simples antes de enviar
        if (!formData.empresa_id || !formData.area_id || !formData.descripcion) {
            alert("⚠️ Faltan campos obligatorios en la Pestaña 1.");
            return;
        }
        onSave(formData);
    };

    if (!show) return null;

    // --- RENDERIZADO DEL FORMULARIO ---
    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content shadow-lg">
                    
                    {/* HEADER */}
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">
                            {activityToEdit ? `✏️ Editar Actividad #${activityToEdit.id}` : '➕ Nueva Actividad'}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={handleClose}></button>
                    </div>

                    {/* TABS DE NAVEGACIÓN (UX) */}
                    <div className="modal-header p-0">
                        <ul className="nav nav-tabs w-100 bg-light px-3 pt-2">
                            <li className="nav-item">
                                <button className={`nav-link ${tabActiva===1?'active fw-bold text-primary':''}`} onClick={()=>setTabActiva(1)}>1. Datos Generales</button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link ${tabActiva===2?'active fw-bold text-primary':''}`} onClick={()=>setTabActiva(2)}>2. Clasificación y Roles</button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link ${tabActiva===3?'active fw-bold text-primary':''}`} onClick={()=>setTabActiva(3)}>3. Control y Fechas</button>
                            </li>
                        </ul>
                    </div>

                    <div className="modal-body p-4 bg-white">
                        <form id="formActividad">
                            
                            {/* --- PESTAÑA 1: DATOS GENERALES --- */}
                            {tabActiva === 1 && (
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Empresa (SHK)</label>
                                        <select className="form-select" name="empresa_id" value={formData.empresa_id} onChange={handleChange} required disabled={!!activityToEdit}>
                                            <option value="">-- Seleccione --</option>
                                            {empresas.map(e => <option key={e.id} value={e.id}>{e.razon_social}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Proceso / SP (Área)</label>
                                        <select className="form-select" name="area_id" value={formData.area_id} onChange={handleChange} required disabled={!formData.empresa_id}>
                                            <option value="">{formData.empresa_id ? '-- Seleccione Área --' : 'Primero elija Empresa'}</option>
                                            {areasFiltradas.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.codigo})</option>)}
                                        </select>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold">Descripción (Backlog)</label>
                                        <textarea className="form-control" name="descripcion" rows="3" value={formData.descripcion} onChange={handleChange} placeholder="Descripción detallada de la actividad..."></textarea>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Development (Doing) / Checklist</label>
                                        <textarea className="form-control" name="development_doing" rows="2" value={formData.development_doing || ''} onChange={handleChange} placeholder="Pasos técnicos a realizar..."></textarea>
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label">Orden de Servicio / Requerimiento Legal</label>
                                        <input type="text" className="form-control" name="orden_servicio_legal" value={formData.orden_servicio_legal || ''} onChange={handleChange} />
                                    </div>
                                </div>
                            )}

                            {/* --- PESTAÑA 2: CLASIFICACIÓN Y ROLES --- */}
                            {tabActiva === 2 && (
                                <div className="row g-3">
                                    {/* Clasificación */}
                                    <div className="col-md-4">
                                        <label className="form-label">Origen Requerimiento</label>
                                        <select className="form-select" name="origen_id" value={formData.origen_id || ''} onChange={handleChange}>
                                            <option value="">-- Seleccione --</option>
                                            {listas.origenes.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Tipo Requerimiento</label>
                                        <select className="form-select" name="tipo_req_id" value={formData.tipo_req_id || ''} onChange={handleChange}>
                                            <option value="">-- Seleccione --</option>
                                            {listas.tipos_req.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Tipo Servicio</label>
                                        <select className="form-select" name="tipo_servicio_id" value={formData.tipo_servicio_id || ''} onChange={handleChange}>
                                            <option value="">-- Seleccione --</option>
                                            {listas.servicios.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                                        </select>
                                    </div>

                                    {/* Roles */}
                                    <div className="col-md-6">
                                        <label className="form-label text-primary fw-bold">Dueño del Proceso (Siviack)</label>
                                        <select className="form-select" name="dueno_proceso" value={formData.dueno_proceso || ''} onChange={handleChange}>
                                            <option value="">-- Seleccione Consultor --</option>
                                            {trabajadores.filter(u => u.rol === 'CONSULTOR' || u.rol === 'ADMIN').map(u => <option key={u.id} value={u.nombre_completo}>{u.nombre_completo}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Autoridad que lo RQ</label>
                                        <input type="text" className="form-control" name="autoridad_rq" value={formData.autoridad_rq || ''} onChange={handleChange} placeholder="Nombre del cliente..." />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">Responsable Éxito</label>
                                        <select className="form-select" name="responsable_id" value={formData.responsable_id || ''} onChange={handleChange}>
                                            <option value="">-- Seleccione --</option>
                                            {trabajadores.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label text-info">Quien Revisa</label>
                                        <select className="form-select" name="revisor_id" value={formData.revisor_id || ''} onChange={handleChange}>
                                            <option value="">-- Jefe / Coord --</option>
                                            {trabajadores.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label text-danger">Quien Aprueba</label>
                                        <select className="form-select" name="aprobador_id" value={formData.aprobador_id || ''} onChange={handleChange}>
                                            <option value="">-- Gerente --</option>
                                            {trabajadores.filter(u => u.rol === 'ADMIN').map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* --- PESTAÑA 3: CONTROL Y FECHAS --- */}
                            {tabActiva === 3 && (
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">Fecha Compromiso</label>
                                        <input type="date" className="form-control" name="fecha_compromiso" value={formData.fecha_compromiso || ''} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Fecha Entrega Real</label>
                                        <input type="date" className="form-control" name="fecha_entrega_real" value={formData.fecha_entrega_real || ''} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">Status Actual</label>
                                        <select className="form-select bg-warning bg-opacity-10 fw-bold" name="status_id" value={formData.status_id || ''} onChange={handleChange}>
                                            <option value="">-- Estado --</option>
                                            {listas.status.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                                        </select>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Link Evidencia (Drive)</label>
                                        <input type="url" className="form-control" name="link_evidencia" value={formData.link_evidencia || ''} onChange={handleChange} placeholder="https://..." />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">% Avance</label>
                                        <div className="input-group">
                                            <input type="number" className="form-control" name="avance" value={formData.avance} onChange={handleChange} min="0" max="100" />
                                            <span className="input-group-text">%</span>
                                        </div>
                                    </div>
                                    
                                    <div className="col-12">
                                        <label className="form-label">Observaciones</label>
                                        <textarea className="form-control" name="observaciones" rows="2" value={formData.observaciones || ''} onChange={handleChange}></textarea>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    <div className="modal-footer bg-light">
                        {tabActiva > 1 && <button className="btn btn-secondary me-auto" onClick={()=>setTabActiva(t=>t-1)}>← Atrás</button>}
                        <button type="button" className="btn btn-outline-secondary" onClick={handleClose}>Cancelar</button>
                        
                        {tabActiva < 3 ? (
                            <button type="button" className="btn btn-primary" onClick={()=>setTabActiva(t=>t+1)}>Siguiente →</button>
                        ) : (
                            <button type="button" className="btn btn-success px-4 fw-bold" onClick={handleSubmit}>💾 GUARDAR ACTIVIDAD</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityFormModal;