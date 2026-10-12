"""
Rotas para o sistema de IA de Recomendação (Release 2 - US-10).
Endpoint com SLA < 2s e registro de feedback negativo ('Não tenho interesse').
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.deps import get_current_user
from app.database import supabase
from app.services.recommendation_service import compute_content_recommendations

router = APIRouter(prefix="/recommendations", tags=["Recomendações com IA"])

@router.get("", response_model=List[Dict[str, Any]])
def get_recommendations(current_user: dict = Depends(get_current_user)):
    """
    Retorna até 10 livros recomendados com justificativa para o leitor.
    SLA < 2 s. Exclui livros do próprio leitor e itens marcados como 'Não tenho interesse'.
    """
    user_id = current_user["id"]

    favorite_genres = []
    disliked_ids = []

    # 1. Busca gêneros favoritos do perfil
    try:
        prof_res = supabase.table("profiles").select("favorite_genres").eq("id", user_id).maybe_single().execute()
        if prof_res and prof_res.data:
            favorite_genres = prof_res.data.get("favorite_genres") or []
    except Exception:
        pass

    # 2. Busca anúncios rejeitados pelo usuário ('DISLIKE')
    try:
        dislikes_res = supabase.table("interacoes_usuario").select("listing_id").eq("user_id", user_id).eq("tipo_interacao", "DISLIKE").execute()
        if dislikes_res and dislikes_res.data:
            disliked_ids = [d["listing_id"] for d in dislikes_res.data if d.get("listing_id")]
    except Exception:
        pass

    # 3. Busca livros disponíveis no catálogo
    listings_pool = []
    try:
        listings_res = supabase.table("listings").select("*, books(*)").neq("user_id", user_id).limit(50).execute()
        if listings_res and listings_res.data:
            listings_pool = listings_res.data
    except Exception:
        pass

    # 4. Executa cálculo leve de recomendação com SLA garantido < 2s
    recommended = compute_content_recommendations(
        user_id=user_id,
        favorite_genres=favorite_genres,
        all_available_listings=listings_pool,
        user_disliked_ids=disliked_ids,
        limit=10
    )

    return recommended

@router.post("/dislike/{listing_id}")
def record_dislike(listing_id: str, current_user: dict = Depends(get_current_user)):
    """
    Registra 'Não tenho interesse' para o anúncio especificado, influenciando próximas recomendações.
    """
    user_id = current_user["id"]
    try:
        supabase.table("interacoes_usuario").insert({
            "user_id": user_id,
            "listing_id": listing_id,
            "tipo_interacao": "DISLIKE"
        }).execute()
        return {"status": "ok", "message": "Interesse negativo registrado com sucesso."}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
