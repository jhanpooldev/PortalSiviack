from sqlalchemy.orm import Session
# OJO: Ajustamos los imports a tu nueva estructura de carpetas
from app.db.database import SessionLocal
from app.db import models
from app.core import security

def crear_super_admin():
    db = SessionLocal()
    print("🚀 Creando Super Usuario...")
    try:
        email_admin = "admin@siviack.com"
        pass_admin = "Admin123." # Esta será tu contraseña maestra
        
        # Verificar si ya existe para no duplicarlo
        existe = db.query(models.Usuario).filter_by(email=email_admin).first()
        if existe:
            print("⚠️ El usuario admin ya existe. No se hizo nada.")
            return

        # Crear Usuario con password HASHED (Encriptado)
        # Esto convierte 'admin123' en '$2b$12$KixNm...'
        nuevo_usuario = models.Usuario(
            nombre_completo="Administrador SIVIACK",
            email=email_admin,
            password_hash=security.get_password_hash(pass_admin), 
            rol="ADMIN",
            empresa_id=None # Es staff interno
        )
        
        db.add(nuevo_usuario)
        db.commit()
        print(f"✅ ¡ÉXITO! Usuario Creado: {email_admin}")
        print(f"🔑 Tu contraseña es: {pass_admin}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    crear_super_admin()