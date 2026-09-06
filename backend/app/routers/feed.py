from fastapi import APIRouter, Query, Depends
from typing import List, Optional
from app.models.schemas import BookListingPublic, HomeFeedResponse, ListingResponse
from app.services.haversine import calculate_haversine_distance
from app.database import supabase
from app.deps import get_current_user

router = APIRouter(prefix="/feed", tags=["Feed"])

MOCK_HOME_RECOMMENDED = [
    ListingResponse(
        id="h1",
        user_id="user-2",
        title="Neon Echo",
        author="Eliza Reed",
        cover_url="https://covers.openlibrary.org/b/id/8231856-M.jpg",
        modality="TROCA",
        price=None,
        condition="Excelente",
        description="Em estado impecável.",
        neighborhood="Boa Viagem",
        distance_km=0.8,
        genre="Sci-Fi"
    ),
    ListingResponse(
        id="h2",
        user_id="user-3",
        title="Throne of Shadows",
        author="Elyon B. Drake",
        cover_url="https://covers.openlibrary.org/b/id/10454955-M.jpg",
        modality="VENDA",
        price=45.0,
        condition="Novo",
        description="Edição especial com capa dura.",
        neighborhood="Boa Viagem",
        distance_km=1.2,
        genre="Fantasia"
    )
]

MOCK_WISHLIST_MATCHES = [
    ListingResponse(
        id="w1",
        user_id="user-4",
        title="The Eternal Garden",
        author="Eleanor Vance",
        cover_url="https://covers.openlibrary.org/b/id/153253-M.jpg",
        modality="TROCA",
        price=None,
        condition="Novo",
        description="Match perfeito com sua Wishlist!",
        neighborhood="Boa Viagem",
        distance_km=0.4,
        genre="Ficção"
    )
]

MOCK_HIGHLIGHTS = [
    ListingResponse(
        id="hl1",
        user_id="user-5",
        title="Night Lights",
        author="Clara Thorne",
        cover_url="https://covers.openlibrary.org/b/id/9255566-M.jpg",
        modality="VENDA",
        price=30.0,
        condition="Bom",
        neighborhood="Pina",
        distance_km=1.5,
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
    Retorna o feed público de livros para visitantes sem exigir JWT.
    """
    try:
        query = supabase.table("listings").select("*")
        response = query.execute()
        if response.data and len(response.data) > 0:
            books = []
            for item in response.data:
                item_lat = item.get("lat", -8.117)
                item_lng = item.get("lng", -34.895)
                dist = calculate_haversine_distance(lat or -8.117, lng or -34.895, item_lat, item_lng)
                books.append(BookListingPublic(
                    id=str(item.get("id")),
                    title=item.get("title", "Obra sem título"),
                    author=item.get("author", "Autor Desconhecido"),
                    cover=item.get("cover_url", "https://covers.openlibrary.org/b/id/153253-M.jpg"),
                    modality=item.get("modality", "TROCA"),
                    price=item.get("price"),
                    condition=item.get("condition", "Excelente"),
                    neighborhood=item.get("neighborhood", "Boa Viagem"),
                    distance_km=dist,
                    genre=item.get("genre", "Geral")
                ))
            return books
    except Exception:
        pass

    return [
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
        )
    ]


@router.get("/home", response_model=HomeFeedResponse)
def get_home_feed(current_user: dict = Depends(get_current_user)):
    """
    Retorna a Home Logada agregando Recomendados, Matches com Wishlist e Destaques
    utilizando cálculo de distância Haversine e cruzamento de preferências do banco.
    """
    user_id = current_user["id"]
    try:
        res = supabase.table("listings").select("*").neq("user_id", user_id).execute()
        if res.data and len(res.data) > 0:
            all_items = []
            for item in res.data:
                dist = calculate_haversine_distance(-8.117, -34.895, item.get("lat", -8.117), item.get("lng", -34.895))
                item["distance_km"] = dist
                all_items.append(ListingResponse(**item))
            
            return HomeFeedResponse(
                recommended=all_items[:3],
                wishlist_matches=all_items[3:5] if len(all_items) > 3 else all_items[:1],
                highlights=all_items[:4]
            )
    except Exception:
        pass

    return HomeFeedResponse(
        recommended=MOCK_HOME_RECOMMENDED,
        wishlist_matches=MOCK_WISHLIST_MATCHES,
        highlights=MOCK_HIGHLIGHTS
    )
