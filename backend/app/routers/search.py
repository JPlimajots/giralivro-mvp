from fastapi import APIRouter, Query
from typing import List, Optional
from app.models.schemas import BookListingPublic
from app.services.haversine import calculate_haversine_distance
from app.database import supabase

router = APIRouter(prefix="/search", tags=["Busca e Filtros Especializados"])

DEFAULT_USER_LAT = -8.117
DEFAULT_USER_LNG = -34.895

MOCK_SEARCH_CATALOG = [
    BookListingPublic(
        id="s1",
        title="O Hobbit",
        author="J.R.R. Tolkien",
        cover="https://covers.openlibrary.org/b/id/8406786-M.jpg",
        modality="TROCA",
        price=None,
        condition="Excelente",
        neighborhood="Boa Viagem",
        distance_km=1.2,
        genre="Fantasia"
    ),
    BookListingPublic(
        id="s2",
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
        id="s3",
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
        id="s4",
        title="1984",
        author="George Orwell",
        cover="https://covers.openlibrary.org/b/id/153253-M.jpg",
        modality="TROCA",
        price=None,
        condition="Excelente",
        neighborhood="Boa Viagem",
        distance_km=0.8,
        genre="Ficção"
    ),
    BookListingPublic(
        id="s5",
        title="Neon Echo",
        author="Eliza Reed",
        cover="https://covers.openlibrary.org/b/id/8231856-M.jpg",
        modality="VENDA",
        price=35.0,
        condition="Novo",
        neighborhood="Boa Viagem",
        distance_km=1.2,
        genre="Sci-Fi"
    ),
    BookListingPublic(
        id="s6",
        title="Throne of Shadows",
        author="Elyon B. Drake",
        cover="https://covers.openlibrary.org/b/id/10454955-M.jpg",
        modality="TROCA",
        price=None,
        condition="Excelente",
        neighborhood="Boa Viagem",
        distance_km=1.5,
        genre="Fantasia"
    )
]


def _matches_filters(
    item: BookListingPublic,
    q: Optional[str],
    genre: Optional[str],
    modality: Optional[str],
    max_distance: Optional[float],
    min_price: Optional[float],
    max_price: Optional[float]
) -> bool:
    if q:
        term = q.lower()
        if term not in item.title.lower() and term not in item.author.lower():
            return False

    if genre and genre.lower() != 'todos' and item.genre.lower() != genre.lower():
        return False

    if modality and modality.lower() != 'todas' and modality.lower() not in item.modality.lower():
        return False

    if max_distance and item.distance_km > max_distance:
        return False

    if item.price is not None:
        if min_price and item.price < min_price:
            return False
        if max_price and item.price > max_price:
            return False

    return True


@router.get("", response_model=List[BookListingPublic])
def search_listings(
    q: Optional[str] = Query(None, description="Busca por título, autor ou ISBN"),
    genre: Optional[str] = Query(None, description="Filtrar por gênero"),
    modality: Optional[str] = Query(None, description="Filtrar por modalidade ex: TROCA, VENDA, DOAÇÃO"),
    max_distance: Optional[float] = Query(None, description="Distância máxima em km"),
    min_price: Optional[float] = Query(None, description="Preço mínimo para venda"),
    max_price: Optional[float] = Query(None, description="Preço máximo para venda"),
    user_lat: Optional[float] = Query(DEFAULT_USER_LAT, description="Latitude do usuário"),
    user_lng: Optional[float] = Query(DEFAULT_USER_LNG, description="Longitude do usuário")
):
    """
    Busca textual cruzada com suporte a múltiplos parâmetros combinados na query string.
    Calcula distâncias via Haversine.
    """
    try:
        query = supabase.table("listings").select("*")
        if q:
            query = query.or_(f"title.ilike.%{q}%,author.ilike.%{q}%")
        if genre:
            query = query.eq("genre", genre)
        if modality:
            query = query.ilike("modality", f"%{modality}%")
        
        res = query.execute()
        if res.data:
            result = []
            for item in res.data:
                item_lat = item.get("lat", DEFAULT_USER_LAT)
                item_lng = item.get("lng", DEFAULT_USER_LNG)
                dist = calculate_haversine_distance(user_lat, user_lng, item_lat, item_lng)

                if max_distance and dist > max_distance:
                    continue

                price = item.get("price")
                if min_price and (price is None or price < min_price):
                    continue
                if max_price and (price is not None and price > max_price):
                    continue

                result.append(BookListingPublic(
                    id=str(item.get("id")),
                    title=item.get("title", ""),
                    author=item.get("author", ""),
                    cover=item.get("cover_url", ""),
                    modality=item.get("modality", "TROCA"),
                    price=price,
                    condition=item.get("condition", "Excelente"),
                    neighborhood=item.get("neighborhood", "Boa Viagem"),
                    distance_km=dist,
                    genre=item.get("genre", "Geral")
                ))
            return result
    except Exception:
        pass

    return [
        item for item in MOCK_SEARCH_CATALOG
        if _matches_filters(item, q, genre, modality, max_distance, min_price, max_price)
    ]
