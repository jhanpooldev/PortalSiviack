from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta, date
from jose import JWTError, jwt 

# Importaciones internas
from app.schemas import schemas
from app.db.database import engine, get_db
from app.db import models
from app.core import security

# 1. Crear tablas automáticamente al iniciar
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SIVIACK Portal API", version="2.2")

# ==========================================
# CONFIGURACIÓN DE SEGURIDAD (CORS)
# ==========================================
origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://127.0.0.1:5500",
    "http://localhost:5173", # Frontend Vite
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ==========================================
# FUNCIONES DE SEGURIDAD (MIDDLEWARE)
# ==========================================

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if user is None: raise credentials_exception
    return user

def solo_admin(current_user: models.Usuario = Depends(get_current_user)):
    if current_user.rol != "ADMIN":
        raise HTTPException(status_code=403, detail="Acceso Denegado: Solo Admin")
    return current_user

# ==========================================
# RUTA RAIZ (Evita 404 al abrir la API)
# ==========================================
@app.get("/", tags=["General"])
def read_root():
    return {
        "mensaje": "Bienvenido a la API de SIVIACK Portal",
        "estado": "Operativo",
        "documentacion": "/docs"
    }

# ==========================================
# AUTENTICACIÓN Y USUARIOS
# ==========================================

@app.post("/token", response_model=schemas.Token, tags=["Seguridad"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()
    if not usuario or not security.verify_password(form_data.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    access_token = security.create_access_token(
        data={"sub": usuario.email, "rol": usuario.rol, "id": usuario.id},
        expires_delta=timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/usuarios/", tags=["Gestión Usuarios"])
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db), admin: models.Usuario = Depends(solo_admin)):
    if db.query(models.Usuario).filter_by(email=usuario.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    nuevo = models.Usuario(
        nombre_completo=usuario.nombre_completo,
        email=usuario.email,
        password_hash=security.get_password_hash(usuario.password),
        rol=usuario.rol,
        empresa_id=usuario.empresa_id
    )
    db.add(nuevo)
    db.commit()
    return {"mensaje": "Usuario creado"}

@app.get("/usuarios/", response_model=List[schemas.UsuarioOut], tags=["Gestión Usuarios"])
def listar_usuarios(rol: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Usuario)
    # Soporte para múltiples roles separados por coma (ej: ?rol=CONSULTOR,ADMIN)
    if rol:
        if "," in rol:
            roles_lista = rol.split(",")
            query = query.filter(models.Usuario.rol.in_(roles_lista))
        else:
            query = query.filter(models.Usuario.rol == rol)
    return query.all()

@app.delete("/usuarios/{id}", tags=["Gestión Usuarios"])
def eliminar_usuario(id: int, db: Session = Depends(get_db), admin: models.Usuario = Depends(solo_admin)):
    user = db.query(models.Usuario).filter(models.Usuario.id == id).first()
    if not user: raise HTTPException(404, "Usuario no encontrado")
    db.delete(user)
    db.commit()
    return {"mensaje": "Usuario eliminado"}

@app.put("/usuarios/{id}", tags=["Gestión Usuarios"])
def actualizar_usuario(id: int, datos: schemas.UsuarioCreate, db: Session = Depends(get_db), admin: models.Usuario = Depends(solo_admin)):
    user = db.query(models.Usuario).filter(models.Usuario.id == id).first()
    if not user: raise HTTPException(404, "Usuario no encontrado")
    
    user.nombre_completo = datos.nombre_completo
    user.email = datos.email
    user.rol = datos.rol
    # Actualizar empresa si aplica
    user.empresa_id = datos.empresa_id
    
    if datos.password and len(datos.password) > 0:
         user.password_hash = security.get_password_hash(datos.password)

    db.commit()
    return {"mensaje": "Usuario actualizado"}

# ==========================================
# EMPRESAS (CRUD)
# ==========================================

@app.post("/empresas/", response_model=schemas.EmpresaOut, tags=["Empresas"])
def crear_empresa(empresa: schemas.EmpresaBase, db: Session = Depends(get_db)):
    db_emp = models.Empresa(**empresa.dict())
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp

@app.get("/empresas/", response_model=List[schemas.EmpresaOut], tags=["Empresas"])
def listar_empresas(db: Session = Depends(get_db)):
    return db.query(models.Empresa).all()

@app.delete("/empresas/{id}", tags=["Empresas"])
def eliminar_empresa(id: int, db: Session = Depends(get_db)):
    emp = db.query(models.Empresa).filter(models.Empresa.id == id).first()
    if not emp: raise HTTPException(404, "Empresa no encontrada")
    db.delete(emp)
    db.commit()
    return {"mensaje": "Empresa eliminada"}

@app.put("/empresas/{id}", response_model=schemas.EmpresaOut, tags=["Empresas"])
def actualizar_empresa(id: int, empresa_update: schemas.EmpresaBase, db: Session = Depends(get_db)):
    db_emp = db.query(models.Empresa).filter(models.Empresa.id == id).first()
    if not db_emp: raise HTTPException(status_code=404, detail="Empresa no encontrada")

    for key, value in empresa_update.dict().items():
        setattr(db_emp, key, value)

    db.commit()
    db.refresh(db_emp)
    return db_emp

# ==========================================
# ÁREAS (CRUD VINCULADO)
# ==========================================

@app.post("/areas/", response_model=schemas.AreaOut, tags=["Áreas"])
def crear_area(area: schemas.AreaCreate, db: Session = Depends(get_db)):
    emp = db.query(models.Empresa).filter(models.Empresa.id == area.empresa_id).first()
    if not emp: raise HTTPException(404, "La empresa especificada no existe")

    db_area = models.Area(**area.dict())
    db.add(db_area)
    db.commit()
    db.refresh(db_area)
    db_area.nombre_empresa = emp.razon_social
    return db_area

@app.get("/areas/", response_model=List[schemas.AreaOut], tags=["Áreas"])
def listar_areas(empresa_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Area)
    if empresa_id:
        query = query.filter(models.Area.empresa_id == empresa_id)
    
    areas = query.all()
    for a in areas:
        a.nombre_empresa = a.empresa.razon_social if a.empresa else "Sin Empresa"
    return areas

@app.delete("/areas/{id}", tags=["Áreas"])
def eliminar_area(id: int, db: Session = Depends(get_db)):
    area = db.query(models.Area).filter(models.Area.id == id).first()
    if not area: raise HTTPException(404, "Área no encontrada")
    db.delete(area)
    db.commit()
    return {"mensaje": "Área eliminada"}

@app.put("/areas/{id}", response_model=schemas.AreaOut, tags=["Áreas"])
def actualizar_area(id: int, datos: schemas.AreaBase, db: Session = Depends(get_db)):
    area = db.query(models.Area).filter(models.Area.id == id).first()
    if not area: raise HTTPException(404, "Área no encontrada")
    
    area.codigo = datos.codigo
    area.nombre = datos.nombre
    # Si enviaran empresa_id en el PUT habría que manejarlo, por ahora asumimos que no cambia de empresa
    
    db.commit()
    db.refresh(area)
    area.nombre_empresa = area.empresa.razon_social if area.empresa else "N/A"
    return area

# ==========================================
# ACTIVIDADES (CORE V1.2)
# ==========================================

@app.post("/actividades/", response_model=schemas.ActividadOut, tags=["Actividades"])
def crear_actividad(actividad: schemas.ActividadCreate, db: Session = Depends(get_db)):
    data = actividad.dict()
    
    # Seguridad: Eliminar campos automáticos si vienen en el payload
    if 'origin_date' in data: del data['origin_date']
    if 'id' in data: del data['id']

    nueva = models.Actividad(**data)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    
    # Rellenar nombres para la respuesta
    nueva.nombre_empresa = nueva.empresa_rel.razon_social if nueva.empresa_rel else "N/A"
    nueva.nombre_area = nueva.area_rel.codigo if nueva.area_rel else "N/A"
    nueva.nombre_responsable = nueva.responsable_rel.nombre_completo if nueva.responsable_rel else "S/A"
    nueva.nombre_status = nueva.status_rel.nombre if nueva.status_rel else "Sin Estado"
    
    # Campos extra si los necesitas en la respuesta inmediata
    nueva.nombre_origen = nueva.origen_rel.nombre if nueva.origen_rel else ""
    
    return nueva

@app.get("/actividades/", response_model=List[schemas.ActividadOut], tags=["Actividades"])
def listar_actividades(
    empresa_id: Optional[int] = None,
    area_id: Optional[int] = None,
    responsable_id: Optional[int] = None,
    status_id: Optional[int] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Actividad)

    # Filtros
    if empresa_id: query = query.filter(models.Actividad.empresa_id == empresa_id)
    if area_id: query = query.filter(models.Actividad.area_id == area_id)
    if responsable_id: query = query.filter(models.Actividad.responsable_id == responsable_id)
    if status_id: query = query.filter(models.Actividad.status_id == status_id)
    if fecha_inicio: query = query.filter(models.Actividad.fecha_compromiso >= fecha_inicio)
    if fecha_fin: query = query.filter(models.Actividad.fecha_compromiso <= fecha_fin)
    
    actividades = query.all()
    
    # Mapeo
    for act in actividades:
        act.nombre_empresa = act.empresa_rel.razon_social if act.empresa_rel else "N/A"
        act.nombre_area = act.area_rel.codigo if act.area_rel else "N/A"
        act.nombre_responsable = act.responsable_rel.nombre_completo if act.responsable_rel else "S/A"
        act.nombre_status = act.status_rel.nombre if act.status_rel else "Sin Estado"
        
        act.nombre_origen = act.origen_rel.nombre if act.origen_rel else ""
        act.nombre_tipo_req = act.tipo_req_rel.nombre if act.tipo_req_rel else ""

    return actividades

@app.get("/actividades/{id}", response_model=schemas.ActividadOut, tags=["Actividades"])
def obtener_actividad(id: int, db: Session = Depends(get_db)):
    act = db.query(models.Actividad).filter(models.Actividad.id == id).first()
    if not act: raise HTTPException(404, "Actividad no encontrada")
    
    act.nombre_empresa = act.empresa_rel.razon_social if act.empresa_rel else "N/A"
    act.nombre_area = act.area_rel.codigo if act.area_rel else "N/A"
    act.nombre_responsable = act.responsable_rel.nombre_completo if act.responsable_rel else "S/A"
    act.nombre_status = act.status_rel.nombre if act.status_rel else "Sin Estado"
    
    return act

@app.put("/actividades/{id}", response_model=schemas.ActividadOut, tags=["Actividades"])
def actualizar_actividad(id: int, cambios: schemas.ActividadUpdate, db: Session = Depends(get_db)):
    act = db.query(models.Actividad).filter(models.Actividad.id == id).first()
    if not act: raise HTTPException(404, "Actividad no encontrada")
    
    datos = cambios.dict(exclude_unset=True)
    for key, value in datos.items():
        setattr(act, key, value)
    
    db.commit()
    db.refresh(act)
    
    act.nombre_empresa = act.empresa_rel.razon_social if act.empresa_rel else "N/A"
    act.nombre_area = act.area_rel.codigo if act.area_rel else "N/A"
    act.nombre_responsable = act.responsable_rel.nombre_completo if act.responsable_rel else "S/A"
    act.nombre_status = act.status_rel.nombre if act.status_rel else "Sin Estado"
    
    return act

@app.get("/mis-pendientes/", response_model=List[schemas.ActividadOut], tags=["Actividades"])
def listar_mis_pendientes(db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    # Filtramos por status que no sea Cerrada (asumiendo que "Cerrada" es un estado final conocido o por condicion_actual)
    query = db.query(models.Actividad).filter(models.Actividad.condicion_actual == 'Abierta')
    
    if current_user.rol == 'CONSULTOR':
        query = query.filter(models.Actividad.responsable_id == current_user.id)
    
    actividades = query.all()
    
    for act in actividades:
        act.nombre_empresa = act.empresa_rel.razon_social if act.empresa_rel else "N/A"
        act.nombre_area = act.area_rel.codigo if act.area_rel else "N/A"
        act.nombre_responsable = act.responsable_rel.nombre_completo if act.responsable_rel else "S/A"
        act.nombre_status = act.status_rel.nombre if act.status_rel else "Sin Estado"
    
    return actividades

# ==========================================
# RUTAS DE MAESTROS (CATÁLOGOS)
# ==========================================

@app.get("/config/listas", response_model=schemas.ListasDesplegables, tags=["Configuración"])
def obtener_listas_desplegables(db: Session = Depends(get_db)):
    return {
        "origenes": db.query(models.OrigenRequerimiento).all(),
        "tipos_req": db.query(models.TipoRequerimiento).all(),
        "servicios": db.query(models.TipoServicio).all(),
        "intervenciones": db.query(models.TipoIntervencion).all(), 
        "medios": db.query(models.MedioControl).all(),
        "resultados": db.query(models.ControlResultados).all(),
        "status": db.query(models.StatusActividad).all()
    }