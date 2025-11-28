from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DECIMAL, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

# ==========================================
# 1. TABLAS MAESTRAS
# ==========================================
class Empresa(Base):
    __tablename__ = "empresas"
    id = Column(Integer, primary_key=True, index=True)
    razon_social = Column(String(150), nullable=False)
    shk = Column(String(20))
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
# 2. TABLAS CATÁLOGO
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
# 3. TABLA CENTRAL: ACTIVIDADES (CORREGIDA V1.2.1)
# ==========================================
class Actividad(Base):
    __tablename__ = "actividades"

    id = Column(Integer, primary_key=True, index=True)
    
    # --- SECCIÓN GENERAL ---
    # Identificación básica
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False) # SHK
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)       # Proceso / SP (Código Área)
    descripcion = Column(Text, nullable=False)                              # Descripción (Backlog)
    development_doing = Column(Text, nullable=True)                         # Development (Doing)
    orden_servicio_legal = Column(String(255), nullable=True)               # Orden de Servicio
    
    # --- SECCIÓN CLASIFICACIÓN ---
    prioridad_atencion = Column(String(50), nullable=True)                  # Prioridad Atención
    origen_id = Column(Integer, ForeignKey("cat_origenes.id"), nullable=True)
    tipo_req_id = Column(Integer, ForeignKey("cat_tipos_req.id"), nullable=True)
    dueno_proceso = Column(String(100), nullable=True)                      # Dueño Proceso (Código Área)
    tipo_servicio_id = Column(Integer, ForeignKey("cat_servicios.id"), nullable=True)
    tipo_intervencion_id = Column(Integer, ForeignKey("cat_intervenciones.id"), nullable=True)
    
    # --- SECCIÓN ROLES ---
    quien_revisa = Column(String(100), nullable=True)                       # Quien Revisa (Rol fijo)
    quien_aprueba = Column(String(100), nullable=True)                      # Quien Aprueba (Rol fijo)
    autoridad_rq = Column(String(150), nullable=True)                       # Autoridad que RQ (Texto)
    responsable_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True) # Responsable Éxito

    # --- SECCIÓN FECHAS ---
    origin_date = Column(Date, server_default=func.current_date())          # Origin Date (Auto)
    fecha_compromiso = Column(Date, nullable=False)                         # Fecha Compromiso
    fecha_entrega_real = Column(Date, nullable=True)                        # Fecha Entrega (Real)
    
    # --- SECCIÓN CONTROL ---
    days_late = Column(Integer, default=0)                                  # Días atraso (Calculado)
    prioridad_accion = Column(String(50), nullable=True)                    # Prioridad Acción (Calculado)
    condicion_actual = Column(String(50), default="Abierta")                # Condición Actual
    avance = Column(DECIMAL(5, 2), default=0.0)                             # % Avance
    producto_entregable = Column(String(255), nullable=True)                # Producto Entregable
    medio_control_id = Column(Integer, ForeignKey("cat_medios_control.id"), nullable=True)
    frecuencia_control_dias = Column(Integer, nullable=True)                # Frecuencia Control (días)
    control_resultados_id = Column(Integer, ForeignKey("cat_control_resultados.id"), nullable=True)
    proxima_validacion = Column(Date, nullable=True)                        # Próxima Validación
    link_evidencia = Column(Text, nullable=True)                            # Evidencia Control (URL)
    status_id = Column(Integer, ForeignKey("cat_status.id"), nullable=True) # Status
    observaciones = Column(Text, nullable=True)                             # Observaciones

    # --- RELACIONES ---
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