from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DECIMAL, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

# 1. EMPRESAS
class Empresa(Base):
    __tablename__ = "empresas"
    id = Column(Integer, primary_key=True, index=True)
    razon_social = Column(String(150), nullable=False)
    ruc = Column(String(20))
    activo = Column(Boolean, default=True)
    
    usuarios = relationship("Usuario", back_populates="empresa", cascade="all, delete")
    actividades = relationship("Actividad", back_populates="empresa_rel", cascade="all, delete")
    areas = relationship("Area", back_populates="empresa", cascade="all, delete") # <--- NUEVA RELACIÓN

# 2. USUARIOS
class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255))
    rol = Column(String(20)) 
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=True)
    empresa = relationship("Empresa", back_populates="usuarios")

# 3. ÁREAS (Ahora dependen de una Empresa)
class Area(Base):
    __tablename__ = "areas"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20)) 
    nombre = Column(String(100))
    
    # VINCULACIÓN NUEVA
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False) # Obligatorio
    empresa = relationship("Empresa", back_populates="areas")
    
    actividades = relationship("Actividad", back_populates="area_rel")

# 4. ACTIVIDADES (Sin cambios mayores, solo importamos)
class Actividad(Base):
    __tablename__ = "actividades"
    id = Column(Integer, primary_key=True, index=True)
    # ... (Todos los campos del Excel que ya pusimos antes) ...
    # Para no hacer el código gigante aquí, asume que están todos los campos anteriores
    # Solo asegúrate de NO borrar lo que ya tenías en este archivo.
    # Si quieres te paso el archivo completo de nuevo, pero básicamente
    # solo cambió la clase Area y Empresa arriba.
    
    # --- COPIA AQUÍ LOS CAMPOS DE ACTIVIDAD DEL PASO ANTERIOR ---
    fecha_origen = Column(Date, nullable=True)
    shk = Column(String(50), nullable=True)
    descripcion = Column(Text, nullable=False)
    development_doing = Column(Text, nullable=True)
    orden_servicio_legal = Column(String(255))
    prioridad_atencion = Column(String(50))
    origen_requerimiento = Column(String(100))
    tipo_requerimiento = Column(String(100))
    dueno_proceso = Column(String(150))
    tipo_servicio = Column(String(100))
    tipo_intervencion = Column(String(100))
    quien_revisa = Column(String(150))
    quien_aprueba = Column(String(150))
    autoridad_rq = Column(String(150))
    responsable_exito = Column(String(150))
    fecha_compromiso = Column(Date, nullable=True)
    fecha_entrega_real = Column(Date, nullable=True)
    days_late = Column(Integer, nullable=True)
    prioridad_accion = Column(String(50))
    condicion_actual = Column(String(100))
    avance = Column(DECIMAL(5, 2), default=0.0)
    producto_entregable = Column(String(255))
    medio_control = Column(String(100))
    frecuencia_control = Column(Integer, nullable=True)
    control_resultados = Column(String(100))
    proxima_validacion = Column(Date, nullable=True)
    link_evidencia = Column(Text, nullable=True)
    status = Column(String(50), default="Abierta")
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    empresa_id = Column(Integer, ForeignKey("empresas.id")) 
    area_id = Column(Integer, ForeignKey("areas.id"))
    
    empresa_rel = relationship("Empresa", back_populates="actividades")
    area_rel = relationship("Area", back_populates="actividades")