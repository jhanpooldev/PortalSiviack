from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import engine, get_db

# 1. Crear tablas automáticamente si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SIVIACK Portal API", version="1.0")

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
    # Crear el modelo de base de datos
    nueva_actividad = models.Actividad(**actividad.dict())
    db.add(nueva_actividad)
    db.commit()
    db.refresh(nueva_actividad)
    
    # Truco para devolver los nombres en la respuesta
    nueva_actividad.nombre_empresa = nueva_actividad.empresa_rel.razon_social
    nueva_actividad.nombre_area = nueva_actividad.area_rel.codigo
    
    return nueva_actividad

@app.get("/actividades/", response_model=List[schemas.ActividadOut], tags=["Actividades"])
def listar_actividades(empresa_id: int = None, db: Session = Depends(get_db)):
    # Iniciar consulta
    query = db.query(models.Actividad)
    
    # Filtro: Si el cliente entra, solo ve SU empresa
    if empresa_id:
        query = query.filter(models.Actividad.empresa_id == empresa_id)
    
    actividades = query.all()

    # Mapeo manual para asegurar que los nombres viajen al frontend
    for act in actividades:
        act.nombre_empresa = act.empresa_rel.razon_social
        act.nombre_area = act.area_rel.codigo
        
    return actividades

@app.put("/actividades/{id}", response_model=schemas.ActividadOut, tags=["Actividades"])
def actualizar_estado(id: int, cambios: schemas.ActividadUpdate, db: Session = Depends(get_db)):
    actividad = db.query(models.Actividad).filter(models.Actividad.id == id).first()
    
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    
    # Actualizar solo los campos enviados
    if cambios.estado: actividad.estado = cambios.estado
    if cambios.avance: actividad.avance = cambios.avance
    if cambios.link_evidencia: actividad.link_evidencia = cambios.link_evidencia
    
    db.commit()
    db.refresh(actividad)
    
    # Rellenar nombres para la respuesta
    actividad.nombre_empresa = actividad.empresa_rel.razon_social
    actividad.nombre_area = actividad.area_rel.codigo
    
    return actividad