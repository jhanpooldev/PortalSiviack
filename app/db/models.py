from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DECIMAL, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

# ==========================================
# 1. TABLAS MAESTRAS (JERARQUÍA)
# ==========================================

class Empresa(Base):
    __tablename__ = "empresas"
    id = Column(Integer, primary_key=True, index=True)
    razon_social = Column(String(150), nullable=False)
    shk = Column(String(20)) # <--- AQUÍ ESTÁ EL CAMPO QUE TE FALTABA
    ruc = Column(String(20))
    activo = Column(Boolean, default=True)
    
    usuarios = relationship("Usuario", back_populates="empresa", cascade="all, delete")
    areas = relationship("Area", back_populates="empresa", cascade="all, delete")
    actividades = relationship("Actividad", back_populates="empresa_rel", cascade="all, delete")

class Area(Base):
    __tablename__ = "areas"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20)) 
    nombre = Column(String(100))
    
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    empresa = relationship("Empresa", back_populates="areas")
    
    actividades = relationship("Actividad", back_populates="area_rel")

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255))
    rol = Column(String(20)) 
    
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=True)
    empresa = relationship("Empresa", back_populates="usuarios")

# ==========================================
# 2. TABLAS CATÁLOGO (DESPLEGABLES)
# ==========================================

class OrigenRequerimiento(Base):
    __tablename__ = "cat_origenes"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), unique=True)

class TipoRequerimiento(Base):
    __tablename__ = "cat_tipos_req"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), unique=True)

class TipoServicio(Base):
    __tablename__ = "cat_servicios"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), unique=True)

class TipoIntervencion(Base):
    __tablename__ = "cat_intervenciones"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), unique=True)

class MedioControl(Base):
    __tablename__ = "cat_medios_control"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), unique=True)

class ControlResultados(Base):
    __tablename__ = "cat_control_resultados"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), unique=True)

class StatusActividad(Base):
    __tablename__ = "cat_status"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), unique=True)

# ==========================================
# 3. TABLA CENTRAL: ACTIVIDADES (V1.1)
# ==========================================

class Actividad(Base):
    __tablename__ = "actividades"

    id = Column(Integer, primary_key=True, index=True)
    
    # --- Identificación ---
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    
    descripcion = Column(Text, nullable=False)
    development_doing = Column(Text, nullable=True)
    orden_servicio_legal = Column(String(255), nullable=True)
    
    # --- Clasificación ---
    origen_id = Column(Integer, ForeignKey("cat_origenes.id"), nullable=True)
    tipo_req_id = Column(Integer, ForeignKey("cat_tipos_req.id"), nullable=True)
    tipo_servicio_id = Column(Integer, ForeignKey("cat_servicios.id"), nullable=True)
    tipo_intervencion_id = Column(Integer, ForeignKey("cat_intervenciones.id"), nullable=True)
    
    # --- Roles ---
    dueno_proceso = Column(String(100), nullable=True) 
    quien_revisa = Column(String(100), nullable=True)  
    quien_aprueba = Column(String(100), nullable=True) 
    responsable_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    autoridad_rq = Column(String(150), nullable=True)

    # --- Fechas ---
    origin_date = Column(Date, server_default=func.current_date())
    fecha_compromiso = Column(Date, nullable=False)
    fecha_entrega_real = Column(Date, nullable=True)
    proxima_validacion = Column(Date, nullable=True)
    
    # --- Control ---
    avance = Column(DECIMAL(5, 2), default=0.0)
    condicion_actual = Column(String(50), default="Abierta")
    prioridad_atencion = Column(String(50), nullable=True)
    status_id = Column(Integer, ForeignKey("cat_status.id"), nullable=True)
    days_late = Column(Integer, default=0)
    prioridad_accion = Column(String(50), nullable=True)
    
    # --- Entregables ---
    producto_entregable = Column(String(255), nullable=True)
    medio_control_id = Column(Integer, ForeignKey("cat_medios_control.id"), nullable=True)
    frecuencia_control_dias = Column(Integer, nullable=True)
    control_resultados_id = Column(Integer, ForeignKey("cat_control_resultados.id"), nullable=True)
    link_evidencia = Column(Text, nullable=True)
    observaciones = Column(Text, nullable=True)

    # --- Relaciones ---
    empresa_rel = relationship("Empresa", back_populates="actividades")
    area_rel = relationship("Area", back_populates="actividades")
    responsable_rel = relationship("Usuario", foreign_keys=[responsable_id])
    
    origen_rel = relationship("OrigenRequerimiento")
    tipo_req_rel = relationship("TipoRequerimiento")
    servicio_rel = relationship("TipoServicio")
    intervencion_rel = relationship("TipoIntervencion")
    medio_rel = relationship("MedioControl")
    resultado_rel = relationship("ControlResultados")
    status_rel = relationship("StatusActividad")

# ==========================================
# 4. TABLA DE AUDITORÍA (LOGS)
# ==========================================
class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    usuario = Column(String(100))      # Nombre del usuario que hizo la acción
    rol = Column(String(20))           # Rol del usuario (ADMIN, CONSULTOR...)
    accion = Column(String(50))        # CREAR, EDITAR, ELIMINAR, LOGIN
    entidad = Column(String(50))       # Actividad, Usuario, Empresa, Área
    detalle = Column(Text, nullable=True) # Descripción (ej: "Creó actividad #45")