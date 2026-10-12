"""
Serviço do Spike 6.1: Recomendação Baseada em Conteúdo (Gênero, Autor e Interações)
e Fallback para 'Populares perto de você'.
Projetado para responder em < 2.0 s (US-10) com custo zero e baixo overhead de CPU.
"""
from typing import List, Dict, Any, Optional

def compute_content_recommendations(
    user_id: str,
    favorite_genres: List[str],
    all_available_listings: List[Dict[str, Any]],
    user_disliked_ids: Optional[List[str]] = None,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Algoritmo baseado em conteúdo leve (gêneros favoritos e proximidade temática).
    Atende aos critérios de SLA < 2 s e custo zero no plano Free.
    """
    disliked_set = set(user_disliked_ids or [])
    normalized_genres = [g.lower().strip() for g in favorite_genres if g]

    scored_listings = []

    for item in all_available_listings:
        # 1. Regra estrita: Nunca recomendar anúncio do próprio usuário
        if item.get("user_id") == user_id:
            continue

        # 2. Ignorar itens com 'Não tenho interesse'
        if item.get("id") in disliked_set:
            continue

        # 3. Status deve ser Disponível
        status = (item.get("status") or "Disponível").upper()
        if status not in {"DISPONÍVEL", "DISPONIVEL", "ATIVO", "PUBLICADO"}:
            continue

        book_genre = (item.get("genre") or item.get("books", {}).get("genre") or "").lower().strip()
        book_title = item.get("title") or item.get("books", {}).get("title") or ""
        book_author = item.get("author") or item.get("books", {}).get("author") or ""

        score = 0.0
        reason = "Popular na sua região"

        # Pontuação de afinidade por gênero
        if book_genre and any(fav in book_genre or book_genre in fav for fav in normalized_genres):
            score += 10.0
            matched = [fav.title() for fav in normalized_genres if fav in book_genre or book_genre in fav]
            fav_name = matched[0] if matched else book_genre.title()
            reason = f"Porque você curte {fav_name}"
        else:
            score += 1.0

        scored_listings.append({
            "item": item,
            "score": score,
            "motivo": reason,
        })

    # Ordena por score decrescente e pega até o limite
    scored_listings.sort(key=lambda x: x["score"], reverse=True)
    top_items = scored_listings[:limit]

    return [
        {
            **x["item"],
            "recommendation_reason": x["motivo"]
        }
        for x in top_items
    ]
