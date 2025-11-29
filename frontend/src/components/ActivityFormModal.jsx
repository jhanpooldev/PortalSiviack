import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "http://localhost:8000";

const ActivityFormModal = ({ show, handleClose, token, onSave, activityToEdit }) => {
    
    const [listas, setListas] = useState({
        origenes: [], tipos_req: [], servicios: [], intervenciones: [],
        medios: [], resultados: [], status: []
    });
    const [empresas, setEmpresas] = useState([]);
    const [areas, setAreas] = useState([]); 
    const [areasFiltradas, setAreasFiltradas] = useState([]); 
    const [trabajadores, setTrabajadores] = useState([]);

    // ESTADO INICIAL (30 CAMPOS)
    const initialState = {
        // General
        empresa_id: '', area_id: '', descripcion: '', development_doing: '', orden_servicio_legal: '',
        
        // Clasificación
        prioridad_atencion: 'Media', origen_id: '', tipo_req_id: '', dueno_proceso: '', tipo_servicio_id: '',
        
        // Roles
        tipo_intervencion_id: '', quien_revisa: '', quien_aprueba: '', autoridad_rq: '', responsable_id: '',
        
        // Fechas
        fecha_compromiso: '', fecha_entrega_real: '', proxima_validacion: '', frecuencia_control_dias: '',
        avance: 0, condicion_actual: 'Abierta', status_id: '', prioridad_atencion: 'Media',
        producto_entregable: '', medio_control_id: '', control_resultados_id: '',
        link_evidencia: '', observaciones: ''
    };
    
    const [formData, setFormData] = useState(initialState);
    const [tabActiva, setTabActiva] = useState(1); 

    useEffect(() => {
        if (show) cargarMaestros();
    }, [show]);

    useEffect(() => {
        if (activityToEdit) {
            setFormData({ 
                ...initialState, 
                ...activityToEdit,
                empresa_id: activityToEdit.empresa_id || '',
                area_id: activityToEdit.area_id || '',
                fecha_compromiso: activityToEdit.fecha_compromiso || '',
                fecha_entrega_real: activityToEdit.fecha_entrega_real || '',
            });
        } else {
            setFormData(initialState);
        }
    }, [activityToEdit]);

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
            
            // FILTRO AÑADIDO: Solo Admins y Consultores en la lista de trabajadores
            const soloEquipoSiviack = resUser.data.filter(u => u.rol === 'ADMIN' || u.rol === 'CONSULTOR');
            setTrabajadores(soloEquipoSiviack);

        } catch (error) { console.error("Error cargando catálogos", error); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.empresa_id || !formData.area_id || !formData.descripcion) {
            alert("⚠️ Faltan campos obligatorios (Empresa, Área, Descripción).");
            return;
        }
        onSave(formData);
    };

    if (!show) return null;

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content shadow-lg">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">{activityToEdit ? `✏️ Editar Actividad` : '➕ Nueva Actividad'}</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={handleClose}></button>
                    </div>

                    <div className="modal-header p-0">
                        <ul className="nav nav-tabs w-100 bg-light px-3 pt-2">
                            <li className="nav-item"><button className={`nav-link ${tabActiva===1?'active fw-bold':''}`} onClick={()=>setTabActiva(1)}>1. General</button></li>
                            <li className="nav-item"><button className={`nav-link ${tabActiva===2?'active fw-bold':''}`} onClick={()=>setTabActiva(2)}>2. Control y Roles</button></li>
                            <li className="nav-item"><button className={`nav-link ${tabActiva===3?'active fw-bold':''}`} onClick={()=>setTabActiva(3)}>3. Resultados</button></li>
                        </ul>
                    </div>

                    <div className="modal-body p-4 bg-white">
                        <form>
                            {/* TAB 1: GENERAL */}
                            {tabActiva === 1 && (
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Empresa (SHK)</label>
                                        <select className="form-select" name="empresa_id" value={formData.empresa_id} onChange={handleChange}>
                                            <option value="">-- Seleccione --</option>
                                            {empresas.map(e => <option key={e.id} value={e.id}>{e.razon_social}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Proceso / SP</label>
                                        <select className="form-select" name="area_id" value={formData.area_id} onChange={handleChange}>
                                            <option value="">-- Seleccione --</option>
                                            {areasFiltradas.map(a => <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold">Descripción</label>
                                        <textarea className="form-control" name="descripcion" rows="3" value={formData.descripcion} onChange={handleChange}></textarea>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Development (Doing)</label>
                                        <textarea className="form-control" name="development_doing" rows="2" value={formData.development_doing || ''} onChange={handleChange}></textarea>
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label">Orden de Servicio / Req. Legal</label>
                                        <input type="text" className="form-control" name="orden_servicio_legal" value={formData.orden_servicio_legal || ''} onChange={handleChange} />
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: CONTROL Y ROLES */}
                            {tabActiva === 2 && (
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <label className="form-label">Prioridad Atención</label>
                                        <select className="form-select" name="prioridad_atencion" value={formData.prioridad_atencion || 'Media'} onChange={handleChange}>
                                            <option>Alta</option><option>Media</option><option>Baja</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Origen</label>
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

                                    <div className="col-md-6">
                                        <label className="form-label text-primary fw-bold">Dueño del Proceso</label>
                                        {/* LÓGICA AÑADIDA: Usamos areasFiltradas en lugar de 'areas' general */}
                                        <select className="form-select" name="dueno_proceso" value={formData.dueno_proceso || ''} onChange={handleChange}>
                                            <option value="">-- Seleccione Área (Misma Empresa) --</option>
                                            {areasFiltradas.map(a => <option key={a.id} value={a.codigo}>{a.codigo} - {a.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Tipo Servicio</label>
                                        <select className="form-select" name="tipo_servicio_id" value={formData.tipo_servicio_id || ''} onChange={handleChange}>
                                            <option value="">-- Seleccione --</option>
                                            {listas.servicios.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                                        </select>
                                    </div>
                                    
                                    <div className="col-md-6">
                                        <label className="form-label">Tipo Intervención</label>
                                        <select className="form-select" name="tipo_intervencion_id" value={formData.tipo_intervencion_id || ''} onChange={handleChange}>
                                            <option value="">-- Seleccione --</option>
                                            {listas.intervenciones.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Autoridad que RQ</label>
                                        <input type="text" className="form-control" name="autoridad_rq" value={formData.autoridad_rq || ''} onChange={handleChange} />
                                    </div>

                                    {/* ROLES FIJOS */}
                                    <div className="col-md-4">
                                        <label className="form-label text-info">Quien Revisa</label>
                                        <select className="form-select" name="quien_revisa" value={formData.quien_revisa || ''} onChange={handleChange}>
                                            <option value="">-- Seleccione --</option>
                                            <option value="Jefe del departamento">Jefe del departamento</option>
                                            <option value="Coordinador del departamento">Coordinador del departamento</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label text-danger">Quien Aprueba</label>
                                        <select className="form-select" name="quien_aprueba" value={formData.quien_aprueba || ''} onChange={handleChange}>
                                            <option value="">-- Seleccione --</option>
                                            <option value="Gerente General">Gerente General</option>
                                            <option value="Gerente de Operaciones">Gerente de Operaciones</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">Responsable Éxito</label>
                                        {/* Usamos la lista 'trabajadores' que ya está filtrada (sin Clientes) */}
                                        <select className="form-select" name="responsable_id" value={formData.responsable_id || ''} onChange={handleChange}>
                                            <option value="">-- Consultor --</option>
                                            {trabajadores.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: RESULTADOS Y FECHAS */}
                            {tabActiva === 3 && (
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">Fecha Compromiso</label>
                                        <input type="date" className="form-control" name="fecha_compromiso" value={formData.fecha_compromiso || ''} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Fecha Entrega</label>
                                        <input type="date" className="form-control" name="fecha_entrega_real" value={formData.fecha_entrega_real || ''} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Próxima Validación</label>
                                        <input type="date" className="form-control" name="proxima_validacion" value={formData.proxima_validacion || ''} onChange={handleChange} />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">% Avance</label>
                                        <input type="number" className="form-control" name="avance" value={formData.avance} onChange={handleChange} min="0" max="100" />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Condición Actual</label>
                                        <select className="form-select" name="condicion_actual" value={formData.condicion_actual} onChange={handleChange}>
                                            <option value="Abierta">Abierta</option>
                                            <option value="Cerrada">Cerrada</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">Status Final</label>
                                        <select className="form-select bg-warning bg-opacity-10" name="status_id" value={formData.status_id || ''} onChange={handleChange}>
                                            <option value="">-- Seleccione --</option>
                                            {listas.status.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                                        </select>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Producto Entregable</label>
                                        <input type="text" className="form-control" name="producto_entregable" value={formData.producto_entregable || ''} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Medio Control</label>
                                        <select className="form-select" name="medio_control_id" value={formData.medio_control_id || ''} onChange={handleChange}>
                                            <option value="">-- Seleccione --</option>
                                            {listas.medios.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                                        </select>
                                    </div>
                                    
                                    <div className="col-md-4">
                                        <label className="form-label">Frecuencia (Días)</label>
                                        <input type="number" className="form-control" name="frecuencia_control_dias" value={formData.frecuencia_control_dias || ''} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-8">
                                        <label className="form-label">Link Evidencia</label>
                                        <input type="url" className="form-control" name="link_evidencia" value={formData.link_evidencia || ''} onChange={handleChange} placeholder="https://..." />
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label">Observaciones</label>
                                        <textarea className="form-control" name="observaciones" value={formData.observaciones || ''} onChange={handleChange}></textarea>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    <div className="modal-footer bg-light">
                        {tabActiva > 1 && <button className="btn btn-secondary me-auto" onClick={()=>setTabActiva(t=>t-1)}>← Atrás</button>}
                        <button className="btn btn-outline-secondary" onClick={handleClose}>Cancelar</button>
                        {tabActiva < 3 ? (
                            <button className="btn btn-primary" onClick={()=>setTabActiva(t=>t+1)}>Siguiente →</button>
                        ) : (
                            <button className="btn btn-success px-4 fw-bold" onClick={handleSubmit}>💾 GUARDAR</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityFormModal;