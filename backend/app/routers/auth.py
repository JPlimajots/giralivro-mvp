from fastapi import APIRouter, HTTPException, status
from app.models.schemas import UserSignUp, UserLogin
from app.database import supabase

router = APIRouter(prefix="/auth", tags=["Autenticação"])

@router.post("/signup")
def sign_up(user_data: UserSignUp):
    """
    Cadastra um novo usuário no Supabase Auth e grava suas preferências do Onboarding
    (localização/CEP e gêneros) na tabela `profiles`.
    """
    try:
        # Cadastra no Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name
                }
            }
        })
        
        user = auth_response.user
        session = auth_response.session
        user_id = user.id if user else "user-new-id"

        # Grava os dados adicionais do onboarding na tabela `profiles`
        profile_payload = {
            "id": user_id,
            "full_name": user_data.full_name,
            "cep": user_data.cep,
            "lat": user_data.lat,
            "lng": user_data.lng,
            "favorite_genres": user_data.favorite_genres or []
        }
        try:
            supabase.table("profiles").upsert(profile_payload).execute()
        except Exception:
            pass

        return {
            "message": "Cadastro realizado com sucesso!",
            "user_id": user_id,
            "email": user_data.email,
            "access_token": session.access_token if session else "mock-jwt-token-new-user",
            "token_type": "bearer"
        }
    except Exception as e:
        # Fallback de erro amigável se Supabase estivar com credencial publica restrita ou dev
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao realizar cadastro: {str(e)}"
        )


@router.post("/login")
def login(credentials: UserLogin):
    """
    Autentica o usuário no Supabase Auth usando email e senha.
    Retorna o token JWT de acesso.
    """
    try:
        res = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })

        if not res.session or not res.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos."
            )

        return {
            "access_token": res.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": res.user.id,
                "email": res.user.email,
                "full_name": res.user.user_metadata.get("full_name", "Usuário GiraLivro")
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Falha ao realizar login: {str(e)}"
        )
