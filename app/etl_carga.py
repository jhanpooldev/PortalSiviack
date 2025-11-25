import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models

# ---------------------------------------------------------------------
# CONFIGURACIÓN
# ---------------------------------------------------------------------
ARCHIVO_SCP = "datos_scp.csv.xlsx"  # El nombre exacto de tu archivo

def limpiar_fecha(fecha):
    """Convierte cualquier cosa a fecha válida o devuelve None"""
    if pd.isna(fecha) or str(fecha).strip() == "":
        return None
    try:
        # Intenta convertir. dayfirst=True es clave para fechas Perú (dd/mm/yyyy)
        return pd.to_datetime(fecha, dayfirst=True, errors='coerce')
    except:
        return None

def limpiar_porcentaje(valor):
    """Convierte 0.8 o '80%' a 80.0"""
    if pd.isna(valor): return 0.0
    try:
        if isinstance(valor, str) and '%' in valor:
            return float(valor.replace('%', ''))
        # Si es decimal (0.8), lo pasamos a 80.0 si prefieres escala 0-100, 
        # o lo dejamos tal cual si tu app usa 0.0-1.0
        # Asumiremos que el Excel trae 0.8 para representar 80%
        return float(valor) * 100 if float(valor) <= 1 else float(valor)
    except:
        return 0.0

def cargar_datos():
    db = SessionLocal()
    print("🚀 Iniciando Análisis y Carga de Datos...")

    try:
        # 1. CREAR EMPRESA DEFAULT
        # ----------------------------------------
        empresa = db.query(models.Empresa).filter_by(razon_social="SIVIACK Cliente").first()
        if not empresa:
            empresa = models.Empresa(razon_social="SIVIACK Cliente", ruc="20600000001")
            db.add(empresa)
            db.commit()
            print("🏢 Empresa base configurada.")

        # 2. CARGAR Y LIMPIAR DATAFRAME
        # ----------------------------------------
        print(f"📂 Leyendo {ARCHIVO_SCP}...")
        
        # Leemos saltando las primeras 7 filas basura
        df = pd.read_excel(ARCHIVO_SCP, skiprows=7)
    
        # RENOMBRAR COLUMNAS: Estandarizamos los nombres feos del Excel
        # Esto es vital para que el código sea limpio
        mapa_columnas = {
            'Proceso / SP': 'codigo_area',
            'Description of the Activity\n(BACKLOG)': 'descripcion',
            'Responsable del Éxito\nProcess owner': 'responsable',
            'Fecha de Entrega\nEnd Date': 'fecha_entrega',
            'Fecha de Compromiso\nDeliver Date': 'fecha_compromiso',
            'Origin Date': 'fecha_origen',
            'Evidencia del Control ': 'evidencia', # Ojo con el espacio al final si lo tiene
            'Status': 'estado',
            '% Avance': 'avance'
        }
        
        # Intentamos renombrar, si alguna columna no coincide exacto, no fallará, solo la ignora
        df.rename(columns=mapa_columnas, inplace=True)
        
        # Validamos que exista la columna descripción, si no, es fila vacía
        if 'descripcion' not in df.columns:
            # Fallback: A veces pandas nombra columnas diferente si hay caracteres raros
            # Buscamos la columna que contenga "BACKLOG"
            col_desc = [c for c in df.columns if "BACKLOG" in str(c)]
            if col_desc:
                df.rename(columns={col_desc[0]: 'descripcion'}, inplace=True)
        
        df = df.dropna(subset=['descripcion']) # Borramos filas sin tarea
        
        print(f"📊 Procesando {len(df)} filas de actividades...")

        count_nuevos = 0
        
        # 3. PROCESAMIENTO FILA POR FILA
        # ----------------------------------------
        for index, row in df.iterrows():
            
            # --- A. ÁREA ---
            # Buscamos el código del área (Ej: ACD, ATH)
            # A veces viene como "Proceso / SP" o ya renombrada a 'codigo_area'
            cod_area = row.get('codigo_area')
            if pd.isna(cod_area): continue

            area_db = db.query(models.Area).filter_by(codigo=cod_area).first()
            if not area_db:
                area_db = models.Area(codigo=cod_area, nombre=f"Área {cod_area}")
                db.add(area_db)
                db.commit()
                db.refresh(area_db)

            # --- B. USUARIO (RESPONSABLE) ---
            nom_resp = row.get('responsable')
            if pd.isna(nom_resp): nom_resp = "Sin Asignar"
            
            # Limpieza del nombre (quitar espacios extra)
            nom_resp = str(nom_resp).strip()

            usuario_db = db.query(models.Usuario).filter_by(nombre_completo=nom_resp).first()
            if not usuario_db:
                # Generar email falso único
                email_fake = f"{nom_resp.split(' ')[0].lower()}_{index}@siviack.com"
                
                usuario_db = models.Usuario(
                    nombre_completo=nom_resp,
                    email=email_fake,
                    password_hash="123456",
                    rol="CONSULTOR",
                    empresa_id=empresa.id
                )
                db.add(usuario_db)
                db.commit()
                db.refresh(usuario_db)

            # --- C. ACTIVIDAD ---
            # Limpieza de fechas usando la función helper
            f_origen = limpiar_fecha(row.get('fecha_origen'))
            f_compromiso = limpiar_fecha(row.get('fecha_compromiso'))
            f_entrega = limpiar_fecha(row.get('fecha_entrega'))
            
            # Limpieza de avance
            val_avance = limpiar_porcentaje(row.get('avance'))
            
            # Limpieza de estado
            estado_raw = str(row.get('estado', 'Abierta')).capitalize()
            # Validamos que el estado esté en los permitidos por tu SQL Check
            # ('Abierta', 'Cerrada', 'Atrasada', 'Bloqueado')
            if 'Cerrada' in estado_raw: estado_final = 'Cerrada'
            elif 'Atrasada' in estado_raw: estado_final = 'Atrasada'
            elif 'Block' in estado_raw: estado_final = 'Bloqueado'
            else: estado_final = 'Abierta'

            # Crear Actividad
            actividad = models.Actividad(
                empresa_id = empresa.id,
                area_id = area_db.id,
                descripcion = str(row.get('descripcion'))[0:500],
                fecha_compromiso = f_compromiso,
                fecha_entrega_real = f_entrega,
                estado = estado_final,
                avance = val_avance,
                link_evidencia = str(row.get('evidencia', ''))
            )
            
            db.add(actividad)
            count_nuevos += 1

        db.commit()
        print(f"✅ ¡ÉXITO TOTAL! Se han importado {count_nuevos} actividades limpias a SQL Server.")

    except Exception as e:
        print(f"❌ Error crítico importando datos: {e}")
        import traceback
        traceback.print_exc() # Esto nos dirá exactamente dónde falló si pasa algo
    finally:
        db.close()

if __name__ == "__main__":
    cargar_datos()