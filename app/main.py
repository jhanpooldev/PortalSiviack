from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from jose import JWTError, jwt # Necesario para decodificar el token

# Importaciones internas
from app.schemas import schemas
from app.db.database import engine, get_db
from app.db import models
from app.core import security

# 1. Crear tablas automáticamente si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SIVIACK Portal API", version="1.0")

# ==========================================
# CONFIGURACIÓN DE SEGURIDAD (CORS)
# ==========================================
origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://127.0.0.1:5500",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de Auth (Indica a Swagger que el login es en /token)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ==========================================
# FUNCIONES DE SEGURIDAD (EL "GUARDIA")
# ==========================================

# 1. Decodificar el Token y obtener el usuario actual
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# 2. Validar si es ADMIN (Jefe)
def solo_admin(current_user: models.Usuario = Depends(get_current_user)):
    if current_user.rol != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="⛔ Acceso Denegado: Se requieren permisos de Administrador."
        )
    return current_user

# ==========================================
# RUTAS DE AUTENTICACIÓN & USUARIOS
# ==========================================

@app.post("/token", response_model=schemas.Token, tags=["Seguridad"])
def login_para_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Buscar usuario
    usuario = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()
    
    # 2. Validar password
    if not usuario or not security.verify_password(form_data.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Generar Token
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": usuario.email, "rol": usuario.rol, "id": usuario.id},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# RUTA PROTEGIDA: Solo el Jefe crea usuarios
@app.post("/usuarios/", tags=["Gestión Usuarios"])
def registrar_usuario(
    nuevo_usuario: schemas.UsuarioCreate, 
    db: Session = Depends(get_db), 
    jefe: models.Usuario = Depends(solo_admin) # <--- EL CANDADO
):
    if db.query(models.Usuario).filter_by(email=nuevo_usuario.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    usuario_db = models.Usuario(
        nombre_completo=nuevo_usuario.nombre_completo,
        email=nuevo_usuario.email,
        password_hash=security.get_password_hash(nuevo_usuario.password),
        rol=nuevo_usuario.rol,
        empresa_id=nuevo_usuario.empresa_id
    )
    db.add(usuario_db)
    db.commit()
    return {"mensaje": f"Usuario {nuevo_usuario.email} creado exitosamente por {jefe.nombre_completo}"}

# ==========================================
# RUTAS DE CONFIGURACIÓN (Empresas y Áreas)
# ==========================================

@app.post("/empresas/", response_model=schemas.EmpresaOut, tags=["Configuración"])
def crear_empresa(empresa: schemas.EmpresaBase, db: Session = Depends(get_db)):
    db_empresa = models.Empresa(**empresa.dict())
    db.add(db_empresa)
    db.commit()
    db.refresh(db_empresa)
    return db_empresa

@app.get("/empresas/", response_model=List[schemas.EmpresaOut], tags=["Configuración"])
def listar_empresas(db: Session = Depends(get_db)):
    return db.query(models.Empresa).all()

@app.post("/areas/", response_model=schemas.AreaOut, tags=["Configuración"])
def crear_area(area: schemas.AreaBase, db: Session = Depends(get_db)):
    db_area = models.Area(**area.dict())
    db.add(db_area)
    db.commit()
    db.refresh(db_area)
    return db_area

@app.get("/areas/", response_model=List[schemas.AreaOut], tags=["Configuración"])
def listar_areas(db: Session = Depends(get_db)):
    return db.query(models.Area).all()

# ==========================================
# RUTAS CORE (Actividades)
# ==========================================

@app.post("/actividades/", response_model=schemas.ActividadOut, tags=["Actividades"])
def crear_actividad(actividad: schemas.ActividadCreate, db: Session = Depends(get_db)):
    nueva_actividad = models.Actividad(**actividad.dict())
    db.add(nueva_actividad)
    db.commit()
    db.refresh(nueva_actividad)
    
    nueva_actividad.nombre_empresa = nueva_actividad.empresa_rel.razon_social
    nueva_actividad.nombre_area = nueva_actividad.area_rel.codigo
    return nueva_actividad

@app.get("/actividades/", response_model=List[schemas.ActividadOut], tags=["Actividades"])
def listar_actividades(empresa_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Actividad)
    if empresa_id:
        query = query.filter(models.Actividad.empresa_id == empresa_id)
    
    actividades = query.all()
    for act in actividades:
        act.nombre_empresa = act.empresa_rel.razon_social
        act.nombre_area = act.area_rel.codigo
    return actividades

@app.put("/actividades/{id}", response_model=schemas.ActividadOut, tags=["Actividades"])
def actualizar_estado(id: int, cambios: schemas.ActividadUpdate, db: Session = Depends(get_db)):
    actividad = db.query(models.Actividad).filter(models.Actividad.id == id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    
    if cambios.estado: actividad.estado = cambios.estado
    if cambios.avance: actividad.avance = cambios.avance
    if cambios.link_evidencia: actividad.link_evidencia = cambios.link_evidencia
    
    db.commit()
    db.refresh(actividad)
    
    actividad.nombre_empresa = actividad.empresa_rel.razon_social
    actividad.nombre_area = actividad.area_rel.codigo
    return actividad