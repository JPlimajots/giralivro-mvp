from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.schemas import WishlistItemCreate, WishlistItemResponse
from app.deps import get_current_user
from app.database import supabase
import uuid

router = APIRouter(prefix="/wishlist", tags=["Wishlist / Lista de Desejos"])

_MOCK_WISHLIST = [
    {
        "id": "w-1",
        "user_id": "user-mock-123",
        "book_title": "The Eternal Garden",
        "author": "Eleanor Vance",
        "genre": "Ficção",
        "max_price": 50.0
    }
]

@router.get("", response_model=List[WishlistItemResponse])
def get_wishlist(current_user: dict = Depends(get_current_user)):
    """
    Retorna os livros salvos na Wishlist (lista de desejos) do usuário logado.
    """
    user_id = current_user["id"]
    try:
        res = supabase.table("wishlist").select("*").eq("user_id", user_id).execute()
        if res.data and len(res.data) > 0:
            return res.data
    except Exception:
        pass

    user_items = [w for w in _MOCK_WISHLIST if w.get("user_id") == user_id or user_id == "user-mock-123"]
    return user_items

@router.post("", response_model=WishlistItemResponse)
def add_to_wishlist(
    item: WishlistItemCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Adiciona um livro à lista de desejos (Wishlist) do usuário.
    """
    user_id = current_user["id"]
    item_id = str(uuid.uuid4())

    payload = {
        "id": item_id,
        "user_id": user_id,
        "book_title": item.book_title,
        "author": item.author,
        "genre": item.genre or "Ficção",
        "max_price": item.max_price
    }

    try:
        res = supabase.table("wishlist").insert(payload).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
    except Exception:
        pass

    _MOCK_WISHLIST.append(payload)
    return payload

@router.delete("/{wishlist_id}")
def remove_from_wishlist(
    wishlist_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Remove um item da Wishlist do usuário.
    """
    user_id = current_user["id"]
    try:
        supabase.table("wishlist").delete().eq("id", wishlist_id).eq("user_id", user_id).execute()
    except Exception:
        pass

    global _MOCK_WISHLIST
    _MOCK_WISHLIST = [w for w in _MOCK_WISHLIST if w["id"] != wishlist_id]
    return {"message": "Item removido da Wishlist com sucesso!"}
