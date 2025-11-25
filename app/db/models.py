from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DECIMAL, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

# 1. TABLA EMPRESAS (Clientes)
class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    razon_social = Column(String(150), nullable=False) # Ej: Novocentro
    ruc = Column(String(20))
    activo = Column(Boolean, default=True)

    # Relaciones
    usuarios = relationship("Usuario", back_populates="empresa")
    actividades = relationship("Actividad", back_populates="empresa_rel")

# 2. TABLA USUARIOS (Login para ti y para clientes)
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255))
    rol = Column(String(20)) # ADMIN, CONSULTOR, CLIENTE
    
    # Si es cliente, se vincula a una empresa. Si es SIVIACK, esto es Null.
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=True)
    empresa = relationship("Empresa", back_populates="usuarios")

# 3. TABLA ÁREAS (Catálogo: ACD, ATH, etc.)
class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), index=True) # Ej: ACD
    nombre = Column(String(100))

    actividades = relationship("Actividad", back_populates="area_rel")

# 4. TABLA ACTIVIDADES (El corazón del software)
class Actividad(Base):
    __tablename__ = "actividades"

    id = Column(Integer, primary_key=True, index=True)
    
    # Datos básicos
    descripcion = Column(Text, nullable=False) # "Description of the Activity"
    tipo_servicio = Column(String(100), nullable=True) # Consultoría, Auditoría, etc.
    origen_requerimiento = Column(String(100), nullable=True) # Reunión Ordinaria, RQ del Área
    
    # Fechas Clave (Para los semáforos)
    fecha_origen = Column(Date, nullable=True)
    fecha_compromiso = Column(Date, nullable=True) # "Deliver Date"
    fecha_entrega_real = Column(Date, nullable=True) # "End Date"
    
    # Gestión del Estado
    estado = Column(String(50), default="Abierta") # Abierta, Cerrada, Atrasada
    avance = Column(DECIMAL(5, 2), default=0.0) # % de Avance
    prioridad = Column(String(50), nullable=True) # Alta, Media, Baja
    
    # Evidencias y Detalles
    producto_entregable = Column(String(255), nullable=True) # Nombre del archivo entregado
    link_evidencia = Column(Text, nullable=True) # URL al Drive
    observaciones = Column(Text, nullable=True)

    # Auditoría automática (Saber cuándo se creó)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Llaves Foráneas (Relaciones)
    empresa_id = Column(Integer, ForeignKey("empresas.id")) # ¿De qué cliente es?
    area_id = Column(Integer, ForeignKey("areas.id")) # ¿Qué área lo pidió? (ACD, ATH)
    responsable_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True) # ¿Quién lo hace?
    
    # Relaciones Python
    empresa_rel = relationship("Empresa", back_populates="actividades")
    area_rel = relationship("Area", back_populates="actividades")
    responsable_rel = relationship("Usuario")