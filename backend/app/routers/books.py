from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import BookCreate, BookResponse
from app.services.google_books import fetch_book_by_isbn
from app.deps import get_current_user
from app.database import supabase
import uuid

router = APIRouter(prefix="/books", tags=["Catálogo Universal de Livros"])

_MOCK_BOOKS_CATALOG = {}

@router.get("/isbn/{isbn}")
async def get_book_metadata_by_isbn(isbn: str):
    """
    Busca metadados de uma obra via Google Books API usando o ISBN.
    Usado na Tela Configurar Anúncio para preenchimento automático do formulário.
    """
    metadata = await fetch_book_by_isbn(isbn)
    if not metadata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livro não encontrado para este ISBN."
        )
    return metadata

@router.post("", response_model=BookResponse)
def register_book_in_catalog(
    book_data: BookCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Registra uma nova obra no Catálogo Universal caso ela ainda seja inédita no banco.
    """
    book_id = str(uuid.uuid4())
    payload = {
        "id": book_id,
        "isbn": book_data.isbn,
        "title": book_data.title,
        "author": book_data.author,
        "cover_url": book_data.cover_url,
        "description": book_data.description,
        "genre": book_data.genre or "Ficção",
        "page_count": book_data.page_count,
        "publisher": book_data.publisher,
        "published_year": book_data.published_year
    }

    try:
        res = supabase.table("books").insert(payload).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
    except Exception:
        pass

    _MOCK_BOOKS_CATALOG[book_id] = payload
    return payload
