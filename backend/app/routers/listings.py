from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.schemas import ListingCreate, ListingUpdate, ListingResponse
from app.deps import get_current_user
from app.database import supabase
import uuid

router = APIRouter(prefix="/listings", tags=["Anúncios e Estante Virtual"])

_MOCK_LISTINGS = [
    {
        "id": "list-1",
        "user_id": "user-mock-123",
        "book_id": "b1",
        "title": "O Hobbit",
        "author": "J.R.R. Tolkien",
        "cover_url": "https://covers.openlibrary.org/b/id/8406786-M.jpg",
        "modality": "VENDA OU TROCA",
        "price": 80.0,
        "condition": "Novo",
        "description": "Livro conservado sem marcas de uso.",
        "status": "Publicado",
        "neighborhood": "Boa Viagem",
        "city": "Recife",
        "uf": "PE",
        "lat": -8.117,
        "lng": -34.895,
        "genre": "Fantasia",
        "is_school_book": False,
        "distance_km": 0.0
    }
]

@router.post("", response_model=ListingResponse)
def create_listing(
    listing: ListingCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Grava o anúncio físico atrelado ao usuário e à foto no Supabase.
    """
    listing_id = str(uuid.uuid4())
    user_id = current_user["id"]

    payload = {
        "id": listing_id,
        "user_id": user_id,
        "book_id": listing.book_id,
        "title": listing.title,
        "author": listing.author,
        "cover_url": listing.cover_url,
        "modality": listing.modality,
        "price": listing.price,
        "condition": listing.condition,
        "description": listing.description,
        "status": "Publicado",
        "neighborhood": listing.neighborhood or "Boa Viagem",
        "city": listing.city or "Recife",
        "uf": listing.uf or "PE",
        "lat": listing.lat or -8.117,
        "lng": listing.lng or -34.895,
        "genre": listing.genre or "Ficção",
        "is_school_book": listing.is_school_book or False
    }

    try:
        res = supabase.table("listings").insert(payload).execute()
        if res.data and len(res.data) > 0:
            item = res.data[0]
            item["distance_km"] = 0.0
            return item
    except Exception:
        pass

    payload["distance_km"] = 0.0
    _MOCK_LISTINGS.append(payload)
    return payload


@router.get("/me", response_model=List[ListingResponse])
def get_my_listings(current_user: dict = Depends(get_current_user)):
    """
    Retorna o histórico de anúncios criados pelo usuário logado (Sua Estante Virtual).
    """
    user_id = current_user["id"]
    try:
        res = supabase.table("listings").select("*").eq("user_id", user_id).execute()
        if res.data and len(res.data) > 0:
            result = []
            for item in res.data:
                item["distance_km"] = 0.0
                result.append(item)
            return result
    except Exception:
        pass

    # Filter in mock
    user_items = [l for l in _MOCK_LISTINGS if l.get("user_id") == user_id or user_id == "user-mock-123"]
    return user_items


@router.put("/{listing_id}", response_model=ListingResponse)
def update_listing(
    listing_id: str,
    update_data: ListingUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Atualiza status da oferta (ex: Editar, Excluir ou 'Marcar como Negociado').
    """
    user_id = current_user["id"]
    update_payload = {k: v for k, v in update_data.model_dump().items() if v is not None}

    try:
        res = supabase.table("listings").update(update_payload).eq("id", listing_id).eq("user_id", user_id).execute()
        if res.data and len(res.data) > 0:
            item = res.data[0]
            item["distance_km"] = 0.0
            return item
    except Exception:
        pass

    for item in _MOCK_LISTINGS:
        if item["id"] == listing_id:
            item.update(update_payload)
            return item

    raise HTTPException(status_code=404, detail="Anúncio não encontrado.")


@router.delete("/{listing_id}")
def delete_listing(
    listing_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Exclui um anúncio do usuário logado.
    """
    user_id = current_user["id"]
    try:
        supabase.table("listings").delete().eq("id", listing_id).eq("user_id", user_id).execute()
    except Exception:
        pass

    global _MOCK_LISTINGS
    _MOCK_LISTINGS = [l for l in _MOCK_LISTINGS if l["id"] != listing_id]
    return {"message": "Anúncio removido com sucesso!"}
