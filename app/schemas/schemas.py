from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# --- 1. SEGURIDAD Y USUARIOS ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UsuarioCreate(BaseModel):
    nombre_completo: str
    email: str
    password: str
    rol: str
    empresa_id: Optional[int] = None

class UsuarioOut(BaseModel):
    id: int
    nombre_completo: str
    email: str
    rol: str
    class Config:
        from_attributes = True

# --- 2. CATÁLOGOS ---
class CatalogoBase(BaseModel):
    id: int
    nombre: str
    class Config:
        from_attributes = True

class ListasDesplegables(BaseModel):
    origenes: List[CatalogoBase]
    tipos_req: List[CatalogoBase]
    servicios: List[CatalogoBase]
    intervenciones: List[CatalogoBase]
    medios: List[CatalogoBase]
    resultados: List[CatalogoBase]
    status: List[CatalogoBase]

# --- 3. EMPRESAS Y ÁREAS ---
class EmpresaBase(BaseModel):
    razon_social: str
    ruc: Optional[str] = None
    shk: Optional[str] = None

class EmpresaOut(EmpresaBase):
    id: int
    class Config:
        from_attributes = True

class AreaBase(BaseModel):
    codigo: str
    nombre: str

class AreaCreate(AreaBase):
    empresa_id: int 

class AreaOut(AreaBase):
    id: int
    empresa_id: int
    nombre_empresa: Optional[str] = None
    class Config:
        from_attributes = True

# --- 4. ACTIVIDADES (MODIFICADO V1.2.1) ---
class ActividadBase(BaseModel):
    # General
    empresa_id: int
    area_id: int
    descripcion: str
    development_doing: Optional[str] = None
    orden_servicio_legal: Optional[str] = None
    prioridad_atencion: Optional[str] = "Media"
    
    # Clasificación
    origen_id: Optional[int] = None
    tipo_req_id: Optional[int] = None
    dueno_proceso: Optional[str] = None
    tipo_servicio_id: Optional[int] = None
    tipo_intervencion_id: Optional[int] = None
    
    # Roles
    quien_revisa: Optional[str] = None
    quien_aprueba: Optional[str] = None
    autoridad_rq: Optional[str] = None
    responsable_id: Optional[int] = None
    
    # Fechas
    fecha_compromiso: Optional[date] = None
    fecha_entrega_real: Optional[date] = None
    
    # Control
    days_late: Optional[int] = 0
    prioridad_accion: Optional[str] = None
    condicion_actual: Optional[str] = "Abierta"
    avance: Optional[float] = 0.0
    producto_entregable: Optional[str] = None
    medio_control_id: Optional[int] = None
    frecuencia_control_dias: Optional[int] = None
    control_resultados_id: Optional[int] = None
    proxima_validacion: Optional[date] = None
    link_evidencia: Optional[str] = None
    status_id: Optional[int] = None
    observaciones: Optional[str] = None

class ActividadCreate(ActividadBase):
    pass 

class ActividadUpdate(ActividadBase):
    pass

class ActividadOut(ActividadBase):
    id: int
    origin_date: Optional[date] = None
    created_at: Optional[datetime] = None
    
    # Nombres expandidos
    nombre_empresa: str 
    nombre_area: str
    nombre_responsable: Optional[str] = None
    nombre_status: Optional[str] = None

    class Config:
        from_attributes = True
