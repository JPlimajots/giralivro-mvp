from fastapi import APIRouter, Depends, HTTPException, status
from app.deps import get_current_user
from app.models.schemas import UserProfileResponse, UserProfileUpdate, ImpactMetrics
from app.database import supabase

router = APIRouter(prefix="/users", tags=["Usuários e Perfil"])

# Memória temporária fallback se o banco de dados Supabase ainda não tiver as colunas
_MOCK_PROFILES = {}

@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(current_user: dict = Depends(get_current_user)):
    """
    Retorna os dados do usuário autenticado e suas métricas de impacto no GiraLivro.
    Exige JWT token no header Authorization: Bearer <token>.
    """
    user_id = current_user["id"]
    email = current_user.get("email", "")

    # Tenta buscar do Supabase
    try:
        res = supabase.table("profiles").select("*").eq("id", user_id).execute()
        if res.data and len(res.data) > 0:
            profile_data = res.data[0]
            return UserProfileResponse(
                id=user_id,
                email=email,
                full_name=profile_data.get("full_name") or current_user.get("user_metadata", {}).get("full_name") or "Camila Silva",
                cep=profile_data.get("cep") or "51020-010",
                lat=profile_data.get("lat") or -8.117,
                lng=profile_data.get("lng") or -34.895,
                favorite_genres=profile_data.get("favorite_genres") or ["Ficção", "Romance"],
                avatar_url=profile_data.get("avatar_url"),
                impact=ImpactMetrics(
                    saved_amount=profile_data.get("saved_amount", 240.0),
                    saved_books_count=profile_data.get("saved_books_count", 3),
                    paper_saved_kg=profile_data.get("paper_saved_kg", 2.0)
                )
            )
    except Exception:
        pass

    # Fallback caso ainda não exista registro na tabela profiles do Supabase
    cached = _MOCK_PROFILES.get(user_id)
    if cached:
        return cached

    # Dados padrão do protótipo (Camila)
    default_profile = UserProfileResponse(
        id=user_id,
        email=email or "camila@giralivro.com.br",
        full_name=current_user.get("user_metadata", {}).get("full_name") or "Camila Silva",
        cep="51020-010",
        lat=-8.117,
        lng=-34.895,
        favorite_genres=["Ficção", "Romance", "Fantasia"],
        impact=ImpactMetrics(
            saved_amount=240.0,
            saved_books_count=3,
            paper_saved_kg=2.0
        )
    )
    _MOCK_PROFILES[user_id] = default_profile
    return default_profile


@router.put("/me", response_model=UserProfileResponse)
def update_my_profile(
    update_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Atualiza os dados cadastrais, localização (CEP/Lat/Lng) e gêneros do usuário logado.
    Exige JWT token no header Authorization.
    """
    user_id = current_user["id"]
    email = current_user.get("email", "")

    payload = {
        "id": user_id,
        "email": email,
        "updated_at": "now()"
    }
    if update_data.full_name is not None:
        payload["full_name"] = update_data.full_name
    if update_data.cep is not None:
        payload["cep"] = update_data.cep
    if update_data.lat is not None:
        payload["lat"] = update_data.lat
    if update_data.lng is not None:
        payload["lng"] = update_data.lng
    if update_data.favorite_genres is not None:
        payload["favorite_genres"] = update_data.favorite_genres
    if update_data.avatar_url is not None:
        payload["avatar_url"] = update_data.avatar_url

    # Tenta persistir no Supabase
    try:
        supabase.table("profiles").upsert(payload).execute()
    except Exception:
        pass

    # Atualiza em memória para consistência imediata
    existing = get_my_profile(current_user)
    updated_profile = UserProfileResponse(
        id=user_id,
        email=email,
        full_name=update_data.full_name if update_data.full_name is not None else existing.full_name,
        cep=update_data.cep if update_data.cep is not None else existing.cep,
        lat=update_data.lat if update_data.lat is not None else existing.lat,
        lng=update_data.lng if update_data.lng is not None else existing.lng,
        favorite_genres=update_data.favorite_genres if update_data.favorite_genres is not None else existing.favorite_genres,
        avatar_url=update_data.avatar_url if update_data.avatar_url is not None else existing.avatar_url,
        impact=existing.impact
    )
    _MOCK_PROFILES[user_id] = updated_profile

    return updated_profile
