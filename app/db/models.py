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
    ruc = Column(String(20))
    activo = Column(Boolean, default=True)
    
    # Relaciones
    usuarios = relationship("Usuario", back_populates="empresa", cascade="all, delete")
    areas = relationship("Area", back_populates="empresa", cascade="all, delete")
    actividades = relationship("Actividad", back_populates="empresa_rel", cascade="all, delete")

class Area(Base):
    __tablename__ = "areas"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20)) # Ej: ACP
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
    rol = Column(String(20)) # ADMIN, JEFE, CONSULTOR, CLIENTE
    
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=True)
    empresa = relationship("Empresa", back_populates="usuarios")

# ==========================================
# 2. TABLAS CATÁLOGO (LISTAS DESPLEGABLES)
# ==========================================
# Estas tablas alimentarán los selects del frontend para evitar errores de dedo

class OrigenRequerimiento(Base):
    __tablename__ = "cat_origenes"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(50), unique=True) # Ej: Reunión Ordinaria

class TipoRequerimiento(Base):
    __tablename__ = "cat_tipos_req"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(50), unique=True) # Ej: No conformidad

class TipoServicio(Base):
    __tablename__ = "cat_servicios"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(50), unique=True) # Ej: Asesoría

class TipoIntervencion(Base):
    __tablename__ = "cat_intervenciones"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(50), unique=True) # Ej: Facilitador

class MedioControl(Base):
    __tablename__ = "cat_medios_control"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(50), unique=True) # Ej: Digital, Drive

class ControlResultados(Base):
    __tablename__ = "cat_control_resultados"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(50), unique=True) # Ej: Done, Blocked

class StatusActividad(Base):
    __tablename__ = "cat_status"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(50), unique=True) # Ej: En Proceso, Atrasado

# ==========================================
# 3. TABLA CENTRAL: ACTIVIDADES (V1.1)
# ==========================================

class Actividad(Base):
    __tablename__ = "actividades"

    id = Column(Integer, primary_key=True, index=True)
    
    # --- A. DATOS DE IDENTIFICACIÓN ---
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=False) # Proceso / SP
    
    descripcion = Column(Text, nullable=False)
    development_doing = Column(Text, nullable=True) # Checklist o texto
    orden_servicio_legal = Column(String(255), nullable=True) # Texto libre
    
    # --- B. CLASIFICACIÓN (Relaciones a Catálogos) ---
    origen_id = Column(Integer, ForeignKey("cat_origenes.id"), nullable=True)
    tipo_req_id = Column(Integer, ForeignKey("cat_tipos_req.id"), nullable=True)
    tipo_servicio_id = Column(Integer, ForeignKey("cat_servicios.id"), nullable=True)
    tipo_intervencion_id = Column(Integer, ForeignKey("cat_intervenciones.id"), nullable=True)
    
    # --- C. ROLES Y RESPONSABLES ---
    # Dueño del proceso: Código de área (Texto o desplegable simple)
    dueno_proceso = Column(String(100), nullable=True) 
    
    # Usuarios del sistema (Siviack)
    responsable_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True) # Responsable del Éxito
    revisor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)     # Quien Revisa (Jefe)
    aprobador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)   # Quien Aprueba (Gerente)
    
    autoridad_rq = Column(String(150), nullable=True) # Texto libre (quien lo pidió)

    # --- D. FECHAS Y TIEMPOS ---
    origin_date = Column(Date, server_default=func.current_date()) # Automático, inmutable
    fecha_compromiso = Column(Date, nullable=False)
    fecha_entrega_real = Column(Date, nullable=True)
    proxima_validacion = Column(Date, nullable=True)
    
    # --- E. CONTROL Y KPIs ---
    avance = Column(DECIMAL(5, 2), default=0.0) # 0-100
    condicion_actual = Column(String(50), default="Abierta") # Abierta/Cerrada
    
    # Relación a Catálogo de Status
    status_id = Column(Integer, ForeignKey("cat_status.id"), nullable=True)
    
    # Calculados (Se pueden guardar o calcular al vuelo, los guardamos por rendimiento)
    days_late = Column(Integer, default=0)
    prioridad_accion = Column(String(50), nullable=True) # Atrasada / A tiempo
    
    # --- F. ENTREGABLES ---
    producto_entregable = Column(String(255), nullable=True)
    medio_control_id = Column(Integer, ForeignKey("cat_medios_control.id"), nullable=True)
    frecuencia_control_dias = Column(Integer, nullable=True)
    control_resultados_id = Column(Integer, ForeignKey("cat_control_resultados.id"), nullable=True)
    link_evidencia = Column(Text, nullable=True)
    observaciones = Column(Text, nullable=True)

    # --- G. RELACIONES (Para hacer Joins fáciles) ---
    empresa_rel = relationship("Empresa", back_populates="actividades")
    area_rel = relationship("Area", back_populates="actividades")
    
    origen_rel = relationship("OrigenRequerimiento")
    tipo_req_rel = relationship("TipoRequerimiento")
    servicio_rel = relationship("TipoServicio")
    intervencion_rel = relationship("TipoIntervencion")
    medio_rel = relationship("MedioControl")
    resultado_rel = relationship("ControlResultados")
    status_rel = relationship("StatusActividad")
    
    responsable_rel = relationship("Usuario", foreign_keys=[responsable_id])
    revisor_rel = relationship("Usuario", foreign_keys=[revisor_id])
    aprobador_rel = relationship("Usuario", foreign_keys=[aprobador_id])