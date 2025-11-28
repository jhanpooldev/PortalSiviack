import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:8000"; // Asegúrate de que sea la URL correcta (127.0.0.1 si tienes problemas de red)

const AdminPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('empresas');
    const [token, setToken] = useState('');

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
    
    // FORMULARIO DE USUARIO
    const [formUsuario, setFormUsuario] = useState({ 
        nombre_completo: '', 
        email: '', 
        password: '', 
        rol: 'CONSULTOR', // Por defecto
        empresa_id: ''    // Solo si es cliente
    });

    useEffect(() => {
        const t = localStorage.getItem('access_token');
        if (!t) navigate('/login');
        setToken(t);
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
            
            // Pre-seleccionar empresa en form area si hay datos
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
                // Limpieza: Si no es cliente, empresa_id debe ser null
                if (data.rol !== 'CLIENTE') data.empresa_id = null;
                // Si es cliente y no seleccionó empresa, error
                if (data.rol === 'CLIENTE' && !data.empresa_id) {
                    alert("⚠️ Para crear un Cliente, debes seleccionar una Empresa.");
                    return;
                }
                // Contraseña por defecto si es nuevo y viene vacía
                if (!editMode && !data.password) data.password = 'siviack123';
            }

            if (editMode) {
                await axios.put(url, data, config);
                alert("✅ Actualizado correctamente");
            } else {
                await axios.post(url, data, config);
                alert("✅ Creado correctamente");
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
        if (!window.confirm("¿Seguro que deseas eliminar?")) return;
        try {
            await axios.delete(`${API_URL}/${tipo}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            alert("🗑️ Eliminado");
            cargarTodo(token);
        } catch (e) { alert("Error al eliminar. Es posible que tenga datos relacionados."); }
    };

    return (
        <div className="container mt-5 pb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold text-primary">⚙️ Administración</h2>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>← Volver</button>
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item"><button className={`nav-link ${activeTab === 'empresas' ? 'active' : ''}`} onClick={() => {setActiveTab('empresas'); cancelarEdicion();}}>🏢 Clientes</button></li>
                <li className="nav-item"><button className={`nav-link ${activeTab === 'areas' ? 'active' : ''}`} onClick={() => {setActiveTab('areas'); cancelarEdicion();}}>📂 Áreas</button></li>
                <li className="nav-item"><button className={`nav-link ${activeTab === 'usuarios' ? 'active' : ''}`} onClick={() => {setActiveTab('usuarios'); cancelarEdicion();}}>👥 Usuarios</button></li>
            </ul>

            <div className="row">
                {/* TAB EMPRESAS */}
                {activeTab === 'empresas' && (
                    <>
                        <div className="col-md-4">
                            <div className={`card shadow-sm border-${editMode ? 'warning' : 'primary'}`}>
                                <div className={`card-header text-white bg-${editMode ? 'warning' : 'primary'}`}>{editMode ? '✏️ Editar' : '➕ Nueva Empresa'}</div>
                                <div className="card-body">
                                    <form onSubmit={(e) => procesarFormulario(e, 'empresa')}>
                                        <div className="mb-3"><label>Razón Social</label><input className="form-control" required value={formEmpresa.razon_social} onChange={e => setFormEmpresa({...formEmpresa, razon_social: e.target.value})} placeholder="Ej: Novocentro SAC" /></div>
                                        <div className="row">
                                            <div className="col-6 mb-3"><label>Acrónimo (SHK)</label><input className="form-control" required value={formEmpresa.shk} onChange={e => setFormEmpresa({...formEmpresa, shk: e.target.value})} placeholder="NOV" /></div>
                                            <div className="col-6 mb-3"><label>RUC</label><input className="form-control" value={formEmpresa.ruc} onChange={e => setFormEmpresa({...formEmpresa, ruc: e.target.value})} placeholder="20..." /></div>
                                        </div>
                                        <button className={`btn w-100 btn-${editMode ? 'warning' : 'primary'}`}>{editMode ? 'Actualizar' : 'Guardar'}</button>
                                        {editMode && <button type="button" className="btn btn-secondary w-100 mt-2" onClick={cancelarEdicion}>Cancelar</button>}
                                    </form>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-8">
                            <table className="table table-striped border"><thead className="table-dark"><tr><th>SHK</th><th>Empresa</th><th>RUC</th><th>Acción</th></tr></thead><tbody>
                                {empresas.map(e => (<tr key={e.id}><td><span className="badge bg-info text-dark">{e.shk}</span></td><td>{e.razon_social}</td><td>{e.ruc}</td><td><button className="btn btn-sm btn-warning me-1" onClick={() => editarItem('empresa', e)}>✏️</button><button className="btn btn-sm btn-danger" onClick={() => eliminarItem('empresas', e.id)}>🗑️</button></td></tr>))}
                            </tbody></table>
                        </div>
                    </>
                )}

                {/* TAB ÁREAS */}
                {activeTab === 'areas' && (
                    <>
                        <div className="col-md-4">
                            <div className={`card shadow-sm border-${editMode ? 'warning' : 'success'}`}>
                                <div className={`card-header text-white bg-${editMode ? 'warning' : 'success'}`}>{editMode ? '✏️ Editar' : '➕ Nueva Área'}</div>
                                <div className="card-body">
                                    <form onSubmit={(e) => procesarFormulario(e, 'area')}>
                                        <div className="mb-2"><label>Empresa Madre</label><select className="form-select" required value={formArea.empresa_id} onChange={e => setFormArea({...formArea, empresa_id: e.target.value})} disabled={editMode}>{empresas.map(e => <option key={e.id} value={e.id}>{e.razon_social}</option>)}</select></div>
                                        <div className="mb-2"><label>Código (Ej: ACD)</label><input className="form-control" required value={formArea.codigo} onChange={e => setFormArea({...formArea, codigo: e.target.value})} /></div>
                                        <div className="mb-3"><label>Nombre</label><input className="form-control" required value={formArea.nombre} onChange={e => setFormArea({...formArea, nombre: e.target.value})} /></div>
                                        <button className={`btn w-100 btn-${editMode ? 'warning' : 'success'}`}>{editMode ? 'Actualizar' : 'Guardar'}</button>
                                        {editMode && <button type="button" className="btn btn-secondary w-100 mt-2" onClick={cancelarEdicion}>Cancelar</button>}
                                    </form>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-8">
                            <table className="table table-striped border"><thead className="table-dark"><tr><th>Código</th><th>Nombre</th><th>Empresa</th><th>Acción</th></tr></thead><tbody>
                                {areas.map(a => (<tr key={a.id}><td>{a.codigo}</td><td>{a.nombre}</td><td>{a.nombre_empresa}</td><td><button className="btn btn-sm btn-warning me-1" onClick={() => editarItem('area', a)}>✏️</button><button className="btn btn-sm btn-danger" onClick={() => eliminarItem('areas', a.id)}>🗑️</button></td></tr>))}
                            </tbody></table>
                        </div>
                    </>
                )}

                {/* TAB USUARIOS */}
                {activeTab === 'usuarios' && (
                    <>
                        <div className="col-md-4">
                            <div className={`card shadow-sm border-${editMode ? 'warning' : 'info'}`}>
                                <div className={`card-header text-white bg-${editMode ? 'warning' : 'info'}`}>{editMode ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}</div>
                                <div className="card-body">
                                    <form onSubmit={(e) => procesarFormulario(e, 'usuario')}>
                                        <div className="mb-2"><label>Nombre Completo</label><input className="form-control" required value={formUsuario.nombre_completo} onChange={e => setFormUsuario({...formUsuario, nombre_completo: e.target.value})} /></div>
                                        <div className="mb-2"><label>Email</label><input className="form-control" required value={formUsuario.email} onChange={e => setFormUsuario({...formUsuario, email: e.target.value})} /></div>
                                        <div className="mb-2"><label>Contraseña</label><input className="form-control" value={formUsuario.password} onChange={e => setFormUsuario({...formUsuario, password: e.target.value})} placeholder={editMode ? "Vacío para no cambiar" : "siviack123"} /></div>
                                        
                                        <div className="mb-3">
                                            <label className="fw-bold">Rol</label>
                                            <select className="form-select" value={formUsuario.rol} onChange={e => setFormUsuario({...formUsuario, rol: e.target.value})}>
                                                <option value="CONSULTOR">👷 Consultor</option>
                                                <option value="CLIENTE">🏢 Cliente</option>
                                                <option value="ADMIN">👑 Admin</option>
                                            </select>
                                        </div>

                                        {formUsuario.rol === 'CLIENTE' && (
                                            <div className="mb-3 p-2 bg-light border rounded">
                                                <label className="text-danger fw-bold">Empresa:</label>
                                                <select className="form-select" required value={formUsuario.empresa_id} onChange={e => setFormUsuario({...formUsuario, empresa_id: e.target.value})}>
                                                    <option value="">-- Seleccione --</option>
                                                    {empresas.map(e => <option key={e.id} value={e.id}>{e.razon_social}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        <button className={`btn w-100 text-white btn-${editMode ? 'warning' : 'info'}`}>{editMode ? 'Actualizar' : 'Guardar'}</button>
                                        {editMode && <button type="button" className="btn btn-secondary w-100 mt-2" onClick={cancelarEdicion}>Cancelar</button>}
                                    </form>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-8">
                            <table className="table table-striped border"><thead className="table-dark"><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Empresa</th><th>Acción</th></tr></thead><tbody>
                                {usuarios.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.nombre_completo}</td>
                                        <td>{u.email}</td>
                                        <td><span className={`badge ${u.rol==='ADMIN'?'bg-danger':u.rol==='CLIENTE'?'bg-primary':'bg-secondary'}`}>{u.rol}</span></td>
                                        <td>{empresas.find(e => e.id === u.empresa_id)?.razon_social || '-'}</td>
                                        <td><button className="btn btn-sm btn-warning me-1" onClick={() => editarItem('usuario', u)}>✏️</button><button className="btn btn-sm btn-danger" onClick={() => eliminarItem('usuarios', u.id)}>🗑️</button></td>
                                    </tr>
                                ))}
                            </tbody></table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminPage;