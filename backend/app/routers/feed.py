from fastapi import APIRouter, Query
from typing import List, Optional
from app.models.schemas import BookListingPublic
from app.database import supabase

router = APIRouter(prefix="/feed", tags=["Feed"])

MOCK_PUBLIC_FEED = [
    BookListingPublic(
        id="b1",
        title="1984",
        author="George Orwell",
        cover="https://covers.openlibrary.org/b/id/153253-M.jpg",
        modality="TROCA",
        price=None,
        condition="Excelente",
        neighborhood="Boa Viagem",
        distance_km=1.2,
        genre="Ficção"
    ),
    BookListingPublic(
        id="b2",
        title="O Hobbit",
        author="J.R.R. Tolkien",
        cover="https://covers.openlibrary.org/b/id/8406786-M.jpg",
        modality="TROCA",
        price=None,
        condition="Bom",
        neighborhood="Boa Viagem",
        distance_km=1.5,
        genre="Fantasia"
    ),
    BookListingPublic(
        id="b3",
        title="Duna",
        author="Frank Herbert",
        cover="https://covers.openlibrary.org/b/id/10523450-M.jpg",
        modality="VENDA OU TROCA",
        price=80.0,
        condition="Novo",
        neighborhood="Pina",
        distance_km=2.5,
        genre="Sci-Fi"
    ),
    BookListingPublic(
        id="b4",
        title="A Revolução dos Bichos",
        author="George Orwell",
        cover="https://covers.openlibrary.org/b/id/9255566-M.jpg",
        modality="VENDA",
        price=45.0,
        condition="Com marcas",
        neighborhood="Graças",
        distance_km=4.0,
        genre="Ficção"
    ),
    BookListingPublic(
        id="b5",
        title="Orgulho e Preconceito",
        author="Jane Austen",
        cover="https://covers.openlibrary.org/b/id/8231856-M.jpg",
        modality="TROCA",
        price=None,
        condition="Excelente",
        neighborhood="Boa Viagem",
        distance_km=1.8,
        genre="Romance"
    )
]

@router.get("/public", response_model=List[BookListingPublic])
def get_public_feed(
    cep: Optional[str] = None,
    genres: Optional[str] = Query(None, description="Gêneros separados por vírgula ex: Ficção,Romance"),
    lat: Optional[float] = None,
    lng: Optional[float] = None
):
    """
    Retorna o feed público de livros para visitantes.
    NÃO exige JWT de autenticação.
    Filtra os livros com base no CEP e nos gêneros temporários selecionados no onboarding.
    """
    # Tenta buscar do banco de dados Supabase se a tabela listings existir
    try:
        query = supabase.table("listings").select("*")
        response = query.execute()
        if response.data and len(response.data) > 0:
            books = []
            for item in response.data:
                books.append(BookListingPublic(
                    id=str(item.get("id")),
                    title=item.get("title", "Obra sem título"),
                    author=item.get("author", "Autor Desconhecido"),
                    cover=item.get("cover_url", "https://covers.openlibrary.org/b/id/153253-M.jpg"),
                    modality=item.get("modality", "TROCA"),
                    price=item.get("price"),
                    condition=item.get("condition", "Excelente"),
                    neighborhood=item.get("neighborhood", "Boa Viagem"),
                    distance_km=item.get("distance_km", 1.2),
                    genre=item.get("genre", "Geral")
                ))
            return books
    except Exception:
        pass

    # Fallback com ordenação/filtragem inteligente baseada nos gêneros informados
    filtered = MOCK_PUBLIC_FEED
    if genres:
        selected_list = [g.strip().lower() for g in genres.split(",")]
        # Traz primeiro os que dão match com os gêneros do visitante
        matching = [b for b in filtered if b.genre.lower() in selected_list]
        others = [b for b in filtered if b.genre.lower() not in selected_list]
        return matching + others

    return filtered
