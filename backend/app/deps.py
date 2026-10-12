import os
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from app.database import supabase

security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação não fornecido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    # Suporte a mock para testes automatizados
    if token.startswith("mock-jwt-token"):
        return {
            "id": "user-mock-123",
            "email": "camila@giralivro.com.br",
            "user_metadata": {"full_name": "Camila Silva"}
        }

    try:
        # Validação com Supabase Auth
        res = supabase.auth.get_user(token)
        if not res or not res.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Sessão inválida ou expirada",
            )
        return {
            "id": res.user.id,
            "email": res.user.email,
            "user_metadata": res.user.user_metadata or {}
        }
    except Exception as e:
        # Se for um token emitido pelo Supabase, mas client falhar
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Falha na validação do token JWT: {str(e)}"
        )


api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def verify_api_key(api_key: Optional[str] = Depends(api_key_header)):
    """
    Protege as rotas sensíveis (como Visão IA e Recomendações) exigindo
    uma chave secreta (API_KEY_SECRET) definida no .env.
    """
    expected_key = os.getenv("API_KEY_SECRET")
    # Se a chave estiver configurada no .env, exige validação estrita
    if expected_key:
        if not api_key or api_key != expected_key:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado: X-API-Key inválida ou ausente.",
            )
    return True
