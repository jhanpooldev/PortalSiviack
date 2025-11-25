from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# --- CLASES BASE (Lo común) ---
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

# --- CREACIÓN (Lo que envía tu compañera) ---
class ActividadCreate(ActividadBase):
    empresa_id: int
    area_id: int
    # El responsable es opcional al crear
    responsable_id: Optional[int] = None 

# --- ACTUALIZACIÓN (Para cambiar estado o subir evidencia) ---
class ActividadUpdate(BaseModel):
    estado: Optional[str] = None
    avance: Optional[float] = None
    link_evidencia: Optional[str] = None
    fecha_entrega_real: Optional[date] = None

# --- RESPUESTA (Lo que ve el Cliente en el Dashboard) ---
# Aquí incluimos los IDs y nombres para que el frontend no sufra
class ActividadOut(ActividadBase):
    id: int
    estado: str
    avance: float
    link_evidencia: Optional[str]
    created_at: Optional[datetime]
    
    # Nombres legibles (no solo IDs)
    nombre_empresa: str 
    nombre_area: str

    class Config:
        from_attributes = True # Permite leer desde SQL

class EmpresaOut(EmpresaBase):
    id: int
    class Config:
        from_attributes = True

class AreaOut(AreaBase):
    id: int
    class Config:
        from_attributes = True