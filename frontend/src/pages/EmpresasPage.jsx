import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = "http://127.0.0.1:8000";

// --- COMPONENTE AUXILIAR (MOVIDO AFUERA PARA EVITAR RE-RENDER) ---
const FormCard = ({ title, children, colorClass = "primary", editMode }) => (
    <div className="card border-0 shadow-lg rounded-4 overflow-hidden sticky-top" style={{top: '20px', transition: 'all 0.3s'}}>
        <div className={`card-header text-white text-center py-3 bg-${editMode ? 'warning' : colorClass}`} 
             style={{ background: editMode ? 'linear-gradient(45deg, #FFB822, #F98821)' : '' }}>
            <h5 className="mb-0 fw-bold text-uppercase">{editMode ? '✏️ Modificar Registro' : `➕ ${title}`}</h5>
        </div>
        <div className="card-body p-4 bg-white">
            {children}
        </div>
    </div>
);

const AdminPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('empresas');
    const [token, setToken] = useState('');
    const [usuarioActual, setUsuarioActual] = useState({ nombre: "Admin", rol: "" });

    // Datos
    const [empresas, setEmpresas] = useState([]);
    const [areas, setAreas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    // Estados de Edición
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    // Formularios
    const [formEmpresa, setFormEmpresa] = useState({ razon_social: '', ruc: '', shk: '' });
    const [formArea, setFormArea] = useState({ codigo: '', nombre: '', empresa_id: '' });
    const [formUsuario, setFormUsuario] = useState({ 
        nombre_completo: '', 
        email: '', 
        password: '', 
        rol: 'CONSULTOR', 
        empresa_id: ''
    });

    useEffect(() => {
        const t = localStorage.getItem('access_token');
        if (!t) navigate('/login');
        setToken(t);
        
        try {
            const payload = JSON.parse(atob(t.split('.')[1]));
            setUsuarioActual({ nombre: payload.sub, rol: payload.rol });
            if (payload.rol !== 'ADMIN') {
                alert("⛔ Acceso denegado: Solo administradores.");
                navigate('/dashboard');
            }
        } catch (e) { console.error("Error token"); }

        cargarTodo(t);
    }, []);

    const cargarTodo = async (t) => {
        const config = { headers: { Authorization: `Bearer ${t}` } };
        try {
            const [resEmp, resArea, resUser] = await Promise.all([
                axios.get(`${API_URL}/empresas/`, config),
                axios.get(`${API_URL}/areas/`, config),
                axios.get(`${API_URL}/usuarios/`, config)
            ]);
            setEmpresas(resEmp.data);
            setAreas(resArea.data);
            setUsuarios(resUser.data);
            
            if (resEmp.data.length > 0 && !editMode) {
                setFormArea(prev => ({ ...prev, empresa_id: resEmp.data[0].id }));
            }
        } catch (error) { console.error("Error cargando datos", error); }
    };

    const cancelarEdicion = () => {
        setEditMode(false);
        setEditId(null);
        setFormEmpresa({ razon_social: '', ruc: '', shk: '' });
        setFormArea({ codigo: '', nombre: '', empresa_id: empresas[0]?.id || '' });
        setFormUsuario({ nombre_completo: '', email: '', password: '', rol: 'CONSULTOR', empresa_id: '' });
    };

    const editarItem = (tipo, item) => {
        setEditMode(true);
        setEditId(item.id);
        if (tipo === 'empresa') setFormEmpresa({ razon_social: item.razon_social, ruc: item.ruc, shk: item.shk || '' });
        if (tipo === 'area') setFormArea({ codigo: item.codigo, nombre: item.nombre, empresa_id: item.empresa_id || empresas[0]?.id });
        if (tipo === 'usuario') setFormUsuario({ ...item, password: '' }); 
    };

    const procesarFormulario = async (e, tipo) => {
        e.preventDefault();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        try {
            let url = `${API_URL}`;
            let data = {};
            
            if (tipo === 'empresa') { 
                url += `/empresas/`; 
                data = formEmpresa; 
                if (editMode) url += `${editId}`;
            }
            if (tipo === 'area') { 
                url += `/areas/`; 
                data = formArea; 
                if (editMode) url += `${editId}`;
            }
            if (tipo === 'usuario') { 
                url += `/usuarios/`; 
                if (editMode) url += `${editId}`;
                
                data = { ...formUsuario };
                if (data.rol !== 'CLIENTE') data.empresa_id = null;
                if (data.rol === 'CLIENTE' && !data.empresa_id) {
                    alert("⚠️ Para crear un Cliente, debes seleccionar una Empresa.");
                    return;
                }
                if (!editMode && !data.password) data.password = 'siviack123';
            }

            if (editMode) {
                await axios.put(url, data, config);
                const btn = e.target.querySelector('button[type="submit"]');
                if(btn) { 
                    const originalText = btn.innerText;
                    btn.innerText = "✅ Guardado!"; 
                    setTimeout(() => btn.innerText = originalText, 2000);
                }
            } else {
                await axios.post(url, data, config);
                alert("✅ Registro creado exitosamente");
            }
            
            cancelarEdicion();
            cargarTodo(token);

        } catch (error) {
            console.error(error);
            if (error.response) {
                alert(`Error: ${error.response.data.detail || 'Error en la operación'}`);
            } else {
                alert("Error de conexión con el servidor.");
            }
        }
    };

    const eliminarItem = async (tipo, id) => {
        if (!window.confirm("⚠️ ¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer.")) return;
        try {
            await axios.delete(`${API_URL}/${tipo}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            cargarTodo(token);
        } catch (e) { alert("Error al eliminar. Es posible que tenga datos relacionados."); }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        navigate('/login');
    };

    return (
        <div className="min-vh-100" style={{ backgroundColor: '#F3F6F9', fontFamily: 'Poppins, sans-serif' }}>
            
            <nav className="navbar navbar-dark shadow-sm px-4" style={{ background: '#1e1e2f' }}>
                <a className="navbar-brand fw-bold d-flex align-items-center" href="#">
                    <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>⚙️</span> CONFIGURACIÓN
                </a>
                <div className="text-white d-flex align-items-center ms-auto">
                    <span className="me-3 d-none d-md-block text-white-50">Modo Super Admin</span>
                    <button className="btn btn-outline-light btn-sm rounded-pill px-3" onClick={handleLogout}>Salir</button>
                </div>
            </nav>

            <div className="container-fluid px-5 mt-4 pb-5">
                
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h3 className="fw-bold text-dark mb-0">Administración del Sistema</h3>
                        <p className="text-muted small mb-0">Gestiona clientes, áreas y accesos de usuarios.</p>
                    </div>
                    <button className="btn btn-light text-primary border shadow-sm fw-bold px-4 rounded-3" onClick={() => navigate('/dashboard')}>
                        ← Volver al Dashboard
                    </button>
                </div>

                <div className="d-flex gap-3 mb-4 bg-white p-2 rounded-4 shadow-sm d-inline-flex">
                    <button 
                        className={`btn rounded-pill px-4 fw-bold transition-all ${activeTab === 'empresas' ? 'btn-primary shadow' : 'text-muted'}`}
                        onClick={() => {setActiveTab('empresas'); cancelarEdicion();}}
                    >
                        🏢 Clientes
                    </button>
                    <button 
                        className={`btn rounded-pill px-4 fw-bold transition-all ${activeTab === 'areas' ? 'btn-success shadow' : 'text-muted'}`}
                        onClick={() => {setActiveTab('areas'); cancelarEdicion();}}
                    >
                        📂 Áreas
                    </button>
                    <button 
                        className={`btn rounded-pill px-4 fw-bold transition-all ${activeTab === 'usuarios' ? 'btn-info text-white shadow' : 'text-muted'}`}
                        onClick={() => {setActiveTab('usuarios'); cancelarEdicion();}}
                    >
                        👥 Usuarios
                    </button>
                </div>

                <div className="row g-4">
                    
                    <div className="col-lg-4 col-md-5">
                        
                        {activeTab === 'empresas' && (
                            <FormCard title="Nueva Empresa" colorClass="primary" editMode={editMode}>
                                <form onSubmit={(e) => procesarFormulario(e, 'empresa')}>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">RAZÓN SOCIAL</label>
                                        <input className="form-control form-control-lg bg-light border-0" required value={formEmpresa.razon_social} onChange={e => setFormEmpresa({...formEmpresa, razon_social: e.target.value})} placeholder="Ej: Minera Volcan" />
                                    </div>
                                    <div className="row g-2 mb-4">
                                        <div className="col-4">
                                            <label className="form-label small fw-bold text-muted">ACRÓNIMO</label>
                                            <input className="form-control bg-light border-0 text-uppercase" required value={formEmpresa.shk} onChange={e => setFormEmpresa({...formEmpresa, shk: e.target.value})} placeholder="VOL" maxLength="5" />
                                        </div>
                                        <div className="col-8">
                                            <label className="form-label small fw-bold text-muted">RUC</label>
                                            <input className="form-control bg-light border-0" value={formEmpresa.ruc} onChange={e => setFormEmpresa({...formEmpresa, ruc: e.target.value})} placeholder="20..." />
                                        </div>
                                    </div>
                                    <div className="d-grid gap-2">
                                        <button className={`btn btn-lg fw-bold ${editMode ? 'btn-warning text-white' : 'btn-primary'}`}>{editMode ? 'Guardar Cambios' : 'Crear Empresa'}</button>
                                        {editMode && <button type="button" className="btn btn-light text-muted" onClick={cancelarEdicion}>Cancelar</button>}
                                    </div>
                                </form>
                            </FormCard>
                        )}

                        {activeTab === 'areas' && (
                            <FormCard title="Nueva Área" colorClass="success" editMode={editMode}>
                                <form onSubmit={(e) => procesarFormulario(e, 'area')}>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">EMPRESA MADRE</label>
                                        <select className="form-select form-select-lg bg-light border-0" required value={formArea.empresa_id} onChange={e => setFormArea({...formArea, empresa_id: e.target.value})} disabled={editMode}>
                                            {empresas.map(e => <option key={e.id} value={e.id}>{e.razon_social}</option>)}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">CÓDIGO (SIGLA)</label>
                                        <input className="form-control form-control-lg bg-light border-0" required value={formArea.codigo} onChange={e => setFormArea({...formArea, codigo: e.target.value})} placeholder="Ej: LOG" />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-muted">NOMBRE COMPLETO</label>
                                        <input className="form-control bg-light border-0" required value={formArea.nombre} onChange={e => setFormArea({...formArea, nombre: e.target.value})} placeholder="Ej: Logística y Almacén" />
                                    </div>
                                    <div className="d-grid gap-2">
                                        <button className={`btn btn-lg fw-bold ${editMode ? 'btn-warning text-white' : 'btn-success'}`}>{editMode ? 'Guardar Cambios' : 'Crear Área'}</button>
                                        {editMode && <button type="button" className="btn btn-light text-muted" onClick={cancelarEdicion}>Cancelar</button>}
                                    </div>
                                </form>
                            </FormCard>
                        )}

                        {activeTab === 'usuarios' && (
                            <FormCard title="Nuevo Usuario" colorClass="info" editMode={editMode}>
                                <form onSubmit={(e) => procesarFormulario(e, 'usuario')}>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">NOMBRE COMPLETO</label>
                                        <input className="form-control bg-light border-0" required value={formUsuario.nombre_completo} onChange={e => setFormUsuario({...formUsuario, nombre_completo: e.target.value})} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">EMAIL (LOGIN)</label>
                                        <input className="form-control bg-light border-0" type="email" required value={formUsuario.email} onChange={e => setFormUsuario({...formUsuario, email: e.target.value})} />
                                    </div>
                                    
                                    <div className="row g-2 mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-bold text-muted">ROL</label>
                                            <select className="form-select bg-light border-0 fw-bold text-secondary" value={formUsuario.rol} onChange={e => setFormUsuario({...formUsuario, rol: e.target.value})}>
                                                <option value="CONSULTOR">👷 Consultor</option>
                                                <option value="CLIENTE">🏢 Cliente</option>
                                                <option value="ADMIN">👑 Admin</option>
                                            </select>
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold text-muted">CONTRASEÑA</label>
                                            <input className="form-control bg-light border-0" value={formUsuario.password} onChange={e => setFormUsuario({...formUsuario, password: e.target.value})} placeholder={editMode ? "(Sin cambios)" : "siviack123"} />
                                        </div>
                                    </div>
                                    
                                    {formUsuario.rol === 'CLIENTE' && (
                                        <div className="mb-4 p-3 rounded-3 bg-warning bg-opacity-10 border border-warning border-opacity-25">
                                            <label className="form-label small fw-bold text-warning mb-2">VINCULAR A EMPRESA</label>
                                            <select className="form-select border-0 shadow-sm" required value={formUsuario.empresa_id} onChange={e => setFormUsuario({...formUsuario, empresa_id: e.target.value})}>
                                                <option value="">-- Seleccione --</option>
                                                {empresas.map(e => <option key={e.id} value={e.id}>{e.razon_social}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div className="d-grid gap-2">
                                        <button className={`btn btn-lg fw-bold text-white ${editMode ? 'btn-warning' : 'btn-info'}`}>{editMode ? 'Guardar Cambios' : 'Crear Usuario'}</button>
                                        {editMode && <button type="button" className="btn btn-light text-muted" onClick={cancelarEdicion}>Cancelar</button>}
                                    </div>
                                </form>
                            </FormCard>
                        )}
                    </div>

                    <div className="col-lg-8 col-md-7">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                            <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold text-secondary">
                                    {activeTab === 'empresas' && `Listado de Clientes (${empresas.length})`}
                                    {activeTab === 'areas' && `Catálogo de Áreas (${areas.length})`}
                                    {activeTab === 'usuarios' && `Usuarios del Sistema (${usuarios.length})`}
                                </h5>
                                <input type="text" className="form-control w-auto border-0 bg-light rounded-pill px-3" placeholder="Buscar..." style={{fontSize: '0.9rem'}} />
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0" style={{borderCollapse: 'separate', borderSpacing: '0'}}>
                                        <thead className="bg-light">
                                            <tr className="text-uppercase text-muted small" style={{letterSpacing: '1px'}}>
                                                {activeTab === 'empresas' && <>
                                                    <th className="ps-4 border-0 py-3">SHK</th>
                                                    <th className="border-0">Razón Social</th>
                                                    <th className="border-0">RUC</th>
                                                </>}
                                                {activeTab === 'areas' && <>
                                                    <th className="ps-4 border-0 py-3">Código</th>
                                                    <th className="border-0">Nombre</th>
                                                    <th className="border-0">Empresa Madre</th>
                                                </>}
                                                {activeTab === 'usuarios' && <>
                                                    <th className="ps-4 border-0 py-3">Usuario</th>
                                                    <th className="border-0">Rol / Permiso</th>
                                                    <th className="border-0">Acceso</th>
                                                </>}
                                                <th className="text-end pe-4 border-0">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeTab === 'empresas' && empresas.map(e => (
                                                <tr key={e.id}>
                                                    <td className="ps-4"><span className="badge bg-dark text-white rounded-pill px-3 shadow-sm">{e.shk || 'N/A'}</span></td>
                                                    <td className="fw-bold text-dark">{e.razon_social}</td>
                                                    <td className="text-muted font-monospace small">{e.ruc || '-'}</td>
                                                    <td className="text-end pe-4">
                                                        <button className="btn btn-sm btn-light text-primary me-2 rounded-circle shadow-sm" onClick={() => editarItem('empresa', e)} title="Editar">✏️</button>
                                                        <button className="btn btn-sm btn-light text-danger rounded-circle shadow-sm" onClick={() => eliminarItem('empresas', e.id)} title="Eliminar">🗑️</button>
                                                    </td>
                                                </tr>
                                            ))}

                                            {activeTab === 'areas' && areas.map(a => (
                                                <tr key={a.id}>
                                                    <td className="ps-4"><span className="fw-bold text-primary">{a.codigo}</span></td>
                                                    <td>{a.nombre}</td>
                                                    <td><span className="badge bg-white text-secondary border fw-normal">{a.nombre_empresa}</span></td>
                                                    <td className="text-end pe-4">
                                                        <button className="btn btn-sm btn-light text-primary me-2 rounded-circle shadow-sm" onClick={() => editarItem('area', a)}>✏️</button>
                                                        <button className="btn btn-sm btn-light text-danger rounded-circle shadow-sm" onClick={() => eliminarItem('areas', a.id)}>🗑️</button>
                                                    </td>
                                                </tr>
                                            ))}

                                            {activeTab === 'usuarios' && usuarios.map(u => (
                                                <tr key={u.id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-light text-secondary rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold shadow-sm" style={{width: '35px', height: '35px'}}>
                                                                {u.nombre_completo.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="fw-bold text-dark" style={{fontSize: '0.9rem'}}>{u.nombre_completo}</div>
                                                                <small className="text-muted">{u.email}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge rounded-pill px-3 py-2 border-0 ${
                                                            u.rol==='ADMIN'?'bg-dark text-white':
                                                            u.rol==='CLIENTE'?'bg-warning text-dark':
                                                            'bg-info text-white'
                                                        }`}>{u.rol}</span>
                                                    </td>
                                                    <td>
                                                        {u.rol === 'CLIENTE' ? (
                                                            <small className="text-muted fw-bold">🏢 Empresa {empresas.find(e => e.id === u.empresa_id)?.razon_social}</small>
                                                        ) : <small className="text-success fw-bold">🌍 Global</small>}
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <button className="btn btn-sm btn-light text-primary me-2 rounded-circle shadow-sm" onClick={() => editarItem('usuario', u)}>✏️</button>
                                                        <button className="btn btn-sm btn-light text-danger rounded-circle shadow-sm" onClick={() => eliminarItem('usuarios', u.id)}>🗑️</button>
                                                    </td>
                                                </tr>
                                            ))}

                                            {((activeTab === 'empresas' && empresas.length === 0) ||
                                              (activeTab === 'areas' && areas.length === 0) ||
                                              (activeTab === 'usuarios' && usuarios.length === 0)) && (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-5 text-muted">
                                                        <div className="fs-1 opacity-25 mb-3">📂</div>
                                                        <p className="mb-0">No hay registros disponibles.</p>
                                                        <small>Usa el formulario de la izquierda para crear uno.</small>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;