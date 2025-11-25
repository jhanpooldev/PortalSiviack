from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# ==========================================
# SEGURIDAD Y USUARIOS (Lo que faltaba)
# ==========================================

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# ESTA ES LA CLASE QUE TE FALTABA
class UsuarioCreate(BaseModel):
    nombre_completo: str
    email: str
    password: str
    rol: str  # 'ADMIN', 'CONSULTOR', 'CLIENTE'
    empresa_id: Optional[int] = None

# ==========================================
# MODELOS BASE (Empresas, Áreas, Actividades)
# ==========================================

class EmpresaBase(BaseModel):
    razon_social: str
    ruc: Optional[str] = None

class AreaBase(BaseModel):
    codigo: str
    nombre: str

class ActividadBase(BaseModel):
    descripcion: str
    tipo_servicio: Optional[str] = None
    fecha_compromiso: Optional[date] = None
    prioridad: str = "Media"
    observaciones: Optional[str] = None

# ==========================================
# MODELOS DE CREACIÓN (Entrada)
# ==========================================

class ActividadCreate(ActividadBase):
    empresa_id: int
    area_id: int
    responsable_id: Optional[int] = None 

# ==========================================
# MODELOS DE ACTUALIZACIÓN
# ==========================================

class ActividadUpdate(BaseModel):
    estado: Optional[str] = None
    avance: Optional[float] = None
    link_evidencia: Optional[str] = None
    fecha_entrega_real: Optional[date] = None

# ==========================================
# MODELOS DE RESPUESTA (Salida / Lectura)
# ==========================================

class ActividadOut(ActividadBase):
    id: int
    estado: str
    avance: float
    link_evidencia: Optional[str]
    created_at: Optional[datetime]
    
    # Nombres legibles
    nombre_empresa: str 
    nombre_area: str

    class Config:
        from_attributes = True

class EmpresaOut(EmpresaBase):
    id: int
    class Config:
        from_attributes = True

class AreaOut(AreaBase):
    id: int
    class Config:
        from_attributes = True