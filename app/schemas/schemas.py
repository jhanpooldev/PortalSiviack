from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# ==========================================
# 1. SEGURIDAD Y USUARIOS
# ==========================================

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UsuarioCreate(BaseModel):
    nombre_completo: str
    email: str
    password: str
    rol: str  # 'ADMIN', 'CONSULTOR', 'CLIENTE'
    empresa_id: Optional[int] = None

class UsuarioOut(BaseModel):
    id: int
    nombre_completo: str
    email: str
    rol: str
    class Config:
        from_attributes = True

# ==========================================
# 2. EMPRESAS (Clientes)
# ==========================================

class EmpresaBase(BaseModel):
    razon_social: str
    ruc: Optional[str] = None

class EmpresaOut(EmpresaBase):
    id: int
    class Config:
        from_attributes = True

# ==========================================
# 3. ÁREAS (Catálogo vinculado a Empresa)
# ==========================================

class AreaBase(BaseModel):
    codigo: str
    nombre: str

# IMPORTANTE: Al crear un área, es OBLIGATORIO decir de qué empresa es
class AreaCreate(AreaBase):
    empresa_id: int 

class AreaOut(AreaBase):
    id: int
    empresa_id: int
    nombre_empresa: Optional[str] = None # Para mostrar en la tabla del Admin
    class Config:
        from_attributes = True

# ==========================================
# 4. ACTIVIDADES (Campos Completos del Excel)
# ==========================================

class ActividadBase(BaseModel):
    # Fechas
    fecha_origen: Optional[date] = None
    fecha_compromiso: Optional[date] = None
    fecha_entrega_real: Optional[date] = None
    proxima_validacion: Optional[date] = None
    
    # Datos Principales
    shk: Optional[str] = None
    descripcion: str
    development_doing: Optional[str] = None
    status: Optional[str] = "Abierta"
    avance: Optional[float] = 0.0
    
    # Clasificación y Prioridad
    prioridad_atencion: Optional[str] = "Media"
    prioridad_accion: Optional[str] = None
    orden_servicio_legal: Optional[str] = None
    origen_requerimiento: Optional[str] = None
    tipo_requerimiento: Optional[str] = None
    condicion_actual: Optional[str] = None
    
    # Responsables
    dueno_proceso: Optional[str] = None
    responsable_exito: Optional[str] = None
    quien_revisa: Optional[str] = None
    quien_aprueba: Optional[str] = None
    autoridad_rq: Optional[str] = None
    
    # Detalles Técnicos
    tipo_servicio: Optional[str] = None
    tipo_intervencion: Optional[str] = None
    producto_entregable: Optional[str] = None
    
    # Control
    medio_control: Optional[str] = None
    frecuencia_control: Optional[int] = None
    control_resultados: Optional[str] = None
    days_late: Optional[int] = 0
    
    # Evidencias y Observaciones
    link_evidencia: Optional[str] = None
    observaciones: Optional[str] = None

# --- CREACIÓN ---
class ActividadCreate(ActividadBase):
    empresa_id: int
    area_id: int

# --- ACTUALIZACIÓN ---
class ActividadUpdate(ActividadBase):
    pass # Hereda todo, permite actualizar cualquier campo

# --- RESPUESTA (Lo que ve el frontend) ---
class ActividadOut(ActividadBase):
    id: int
    created_at: Optional[datetime]
    
    # Nombres legibles (Joins)
    nombre_empresa: str 
    nombre_area: str

    class Config:
        from_attributes = True

# --- ESQUEMA PARA LISTAS DESPLEGABLES (CATÁLOGOS) ---
class CatalogoOut(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True

# --- ESQUEMA DE RESPUESTA COMPLETA DE LISTAS ---
class ListasDesplegables(BaseModel):
    origenes: List[CatalogoOut]
    tipos_req: List[CatalogoOut]
    servicios: List[CatalogoOut]
    intervenciones: List[CatalogoOut]
    medios: List[CatalogoOut]
    resultados: List[CatalogoOut]
    status: List[CatalogoOut]