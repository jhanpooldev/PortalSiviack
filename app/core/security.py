from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

# CONFIGURACIÓN DE SEGURIDAD (Esto normalmente va en variables de entorno .env)
SECRET_KEY = "SIVIACK_CLAVE_SECRETA_SUPER_DIFICIL_DE_ADIVINAR"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 180 # La sesión dura 180 minutos por seguridad bancaria

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    """Verifica si la contraseña escrita coincide con el hash en la BD"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Convierte '123456' en '$2b$12$...' para no guardar texto plano"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Genera el Token JWT que el frontend guardará"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt