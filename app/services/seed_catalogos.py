from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db import models

def poblar_catalogos():
    db = SessionLocal()
    print("🌱 Iniciando siembra de datos maestros (Catálogos)...")

    try:
        # 1. ORIGEN DEL REQUERIMIENTO
        origenes = [
            "Reunión Ordinaria", "Reunión Extraordinaria", "Comité Técnico",
            "RQ del Área", "RQ de Gerencia", "RQ del Cliente"
        ]
        for nombre in origenes:
            if not db.query(models.OrigenRequerimiento).filter_by(nombre=nombre).first():
                db.add(models.OrigenRequerimiento(nombre=nombre))
        print("✅ Orígenes cargados.")

        # 2. TIPO DE REQUERIMIENTO
        tipos_req = [
            "Observación", "No conformidad", "Recomendación", 
            "Acuerdo", "Oportunidad de mejora"
        ]
        for nombre in tipos_req:
            if not db.query(models.TipoRequerimiento).filter_by(nombre=nombre).first():
                db.add(models.TipoRequerimiento(nombre=nombre))
        print("✅ Tipos de Requerimiento cargados.")

        # 3. TIPO DE SERVICIO
        servicios = [
            "Asesoría", "Consultoría", "Asistencia", "Inducción",
            "Capacitación", "Entrenamiento", "Comercialización"
        ]
        for nombre in servicios:
            if not db.query(models.TipoServicio).filter_by(nombre=nombre).first():
                db.add(models.TipoServicio(nombre=nombre))
        print("✅ Tipos de Servicio cargados.")

        # 4. TIPO DE INTERVENCIÓN (CORREGIDO: Sin tilde en la clase)
        intervenciones = [
            "Asesor/Consultor", "Facilitador", "Instructor", "Coordinador",
            "Proveedor", "Colaborador", "Especialista", "Freelance"
        ]
        for nombre in intervenciones:
            # OJO: La clase en models.py se llama TipoIntervencion (sin tilde)
            if not db.query(models.TipoIntervencion).filter_by(nombre=nombre).first():
                db.add(models.TipoIntervencion(nombre=nombre))
        print("✅ Tipos de Intervención cargados.")

        # 5. MEDIO DE CONTROL
        medios = ["Físico", "Digital", "Drive", "Presencial", "Virtual", "Mixto"]
        for nombre in medios:
            if not db.query(models.MedioControl).filter_by(nombre=nombre).first():
                db.add(models.MedioControl(nombre=nombre))
        print("✅ Medios de Control cargados.")

        # 6. CONTROL DE RESULTADOS
        resultados = [
            "Done/Hecho", "Release Ready", "Descarted/Descartado", 
            "Blocked/Bloqueado", "Feedback"
        ]
        for nombre in resultados:
            if not db.query(models.ControlResultados).filter_by(nombre=nombre).first():
                db.add(models.ControlResultados(nombre=nombre))
        print("✅ Control de Resultados cargados.")

        # 7. STATUS (ESTADOS)
        status_list = [
            "Entregado a Tiempo", "En Proceso", "Tiempo Límite",
            "Entregado Fuera de Plazo", "Recibido para su Atención",
            "Enviado para su Revisión", "Atrasado", "Bloqueado"
        ]
        for nombre in status_list:
            if not db.query(models.StatusActividad).filter_by(nombre=nombre).first():
                db.add(models.StatusActividad(nombre=nombre))
        print("✅ Status cargados.")

        db.commit()
        print("🎉 ¡TODO LISTO! Base de datos poblada correctamente.")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc() # Esto te dirá exactamente dónde falla
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    poblar_catalogos()