import React from 'react';

const ActivityDetailsModal = ({ show, handleClose, activity }) => {
    if (!show || !activity) return null;

    // Función helper para mostrar datos o guión si está vacío
    const val = (dato) => dato || <span className="text-muted fst-italic">No especificado</span>;

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content border-0 shadow-lg">
                    
                    {/* HEADER */}
                    <div className="modal-header bg-info text-white">
                        <div>
                            <h5 className="modal-title fw-bold">📋 Detalle de Actividad #{activity.id}</h5>
                            <small>{activity.nombre_empresa} | {activity.nombre_area}</small>
                        </div>
                        <button type="button" className="btn-close btn-close-white" onClick={handleClose}></button>
                    </div>

                    {/* BODY */}
                    <div className="modal-body p-4" style={{ backgroundColor: '#f8f9fa' }}>
                        
                        {/* SECCIÓN 1: GENERAL */}
                        <div className="card mb-3 border-0 shadow-sm">
                            <div className="card-header bg-white fw-bold text-primary">📌 Información General</div>
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label className="fw-bold text-secondary small">DESCRIPCIÓN</label>
                                        <p className="mb-0 p-2 bg-light rounded border">{val(activity.descripcion)}</p>
                                    </div>
                                    <div className="col-12">
                                        <label className="fw-bold text-secondary small">DEVELOPMENT / CHECKLIST</label>
                                        <p className="mb-0 p-2 bg-light rounded border">{val(activity.development_doing)}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="fw-bold text-secondary small">ORDEN SERVICIO / LEGAL</label>
                                        <div>{val(activity.orden_servicio_legal)}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="fw-bold text-secondary small">PRIORIDAD</label>
                                        <div>
                                            <span className={`badge ${activity.prioridad_atencion === 'Alta' ? 'bg-danger' : 'bg-secondary'}`}>
                                                {val(activity.prioridad_atencion)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: CLASIFICACIÓN Y ROLES */}
                        <div className="card mb-3 border-0 shadow-sm">
                            <div className="card-header bg-white fw-bold text-primary">👥 Roles y Clasificación</div>
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <label className="fw-bold text-secondary small">DUEÑO PROCESO</label>
                                        <div className="fw-bold text-dark">{val(activity.dueno_proceso)}</div>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="fw-bold text-secondary small">RESPONSABLE ÉXITO</label>
                                        <div className="fw-bold text-primary">{val(activity.nombre_responsable)}</div>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="fw-bold text-secondary small">AUTORIDAD RQ</label>
                                        <div>{val(activity.autoridad_rq)}</div>
                                    </div>
                                    <hr className="my-2 text-muted"/>
                                    <div className="col-md-6">
                                        <label className="fw-bold text-secondary small">QUIEN REVISA</label>
                                        <div className="text-info">{val(activity.quien_revisa)}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="fw-bold text-secondary small">QUIEN APRUEBA</label>
                                        <div className="text-danger">{val(activity.quien_aprueba)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 3: CONTROL Y ESTADO */}
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white fw-bold text-primary">📊 Estado y Control</div>
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <label className="fw-bold text-secondary small">FECHA COMPROMISO</label>
                                        <div className="fs-5">{val(activity.fecha_compromiso)}</div>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="fw-bold text-secondary small">ENTREGA REAL</label>
                                        <div className={activity.fecha_entrega_real ? "text-success fw-bold" : ""}>
                                            {val(activity.fecha_entrega_real)}
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="fw-bold text-secondary small">STATUS</label>
                                        <div>
                                            <span className="badge bg-warning text-dark fs-6">{val(activity.nombre_status)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="col-12 mt-3">
                                        <label className="fw-bold text-secondary small">AVANCE</label>
                                        <div className="progress" style={{height: '20px'}}>
                                            <div 
                                                className="progress-bar progress-bar-striped bg-success" 
                                                role="progressbar" 
                                                style={{width: `${activity.avance}%`}}
                                            >
                                                {activity.avance}%
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-12 mt-3">
                                        <label className="fw-bold text-secondary small">EVIDENCIA (LINK)</label>
                                        <div>
                                            {activity.link_evidencia ? (
                                                <a href={activity.link_evidencia} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm">
                                                    📎 Abrir Evidencia en Drive
                                                </a>
                                            ) : (
                                                <span className="text-muted">Sin evidencia adjunta</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {activity.observaciones && (
                                        <div className="col-12 mt-3">
                                            <div className="alert alert-warning mb-0">
                                                <strong>📝 Observaciones:</strong> {activity.observaciones}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="modal-footer bg-light border-0">
                        <button type="button" className="btn btn-secondary px-4" onClick={handleClose}>Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityDetailsModal;