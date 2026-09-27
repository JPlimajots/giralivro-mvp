from pydantic import BaseModel, Field
from typing import List, Optional

class UserSignUp(BaseModel):
    email: str
    password: str
    full_name: str
    cep: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    favorite_genres: Optional[List[str]] = []

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    cep: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    favorite_genres: Optional[List[str]] = None
    avatar_url: Optional[str] = None

class ImpactMetrics(BaseModel):
    saved_amount: float = 240.0
    saved_books_count: int = 3
    paper_saved_kg: float = 2.0

class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = "Leitor GiraLivro"
    cep: Optional[str] = "51020-010"
    lat: Optional[float] = -8.117
    lng: Optional[float] = -34.895
    favorite_genres: List[str] = []
    avatar_url: Optional[str] = None
    impact: ImpactMetrics = Field(default_factory=ImpactMetrics)

# ========================================================
# SCHEMAS PARA CATÁLOGO DE LIVROS E ANÚNCIOS (TAREFA 4.1)
# ========================================================

class BookCreate(BaseModel):
    isbn: Optional[str] = None
    title: str
    author: str
    cover_url: Optional[str] = None
    description: Optional[str] = None
    genre: Optional[str] = "Ficção"
    page_count: Optional[int] = 200
    publisher: Optional[str] = None
    published_year: Optional[int] = 2023

class BookResponse(BookCreate):
    id: str

class ListingCreate(BaseModel):
    book_id: Optional[str] = None
    title: str
    author: str
    cover_url: str
    modality: str  # 'TROCA', 'VENDA', 'DOAÇÃO', 'VENDA OU TROCA'
    price: Optional[float] = None
    condition: str  # 'Novo', 'Excelente', 'Com marcas'
    description: Optional[str] = None
    neighborhood: Optional[str] = "Boa Viagem"
    city: Optional[str] = "Recife"
    uf: Optional[str] = "PE"
    lat: Optional[float] = -8.117
    lng: Optional[float] = -34.895
    genre: Optional[str] = "Ficção"
    is_school_book: Optional[bool] = False

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    modality: Optional[str] = None
    price: Optional[float] = None
    condition: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # 'Publicado', 'Em Negociação', 'Negociado'

class ListingResponse(ListingCreate):
    id: str
    user_id: str
    status: str = "Publicado"
    distance_km: float = 1.2

class BookListingPublic(BaseModel):
    id: str
    title: str
    author: str
    cover: str
    modality: str
    price: Optional[float] = None
    condition: str
    neighborhood: str = "Boa Viagem"
    distance_km: float = 1.2
    is_school_book: bool = False
    genre: str = "Ficção"

# ========================================================
# SCHEMAS PARA WISHLIST, SEARCH E HOME (TAREFA 4.2)
# ========================================================

class WishlistItemCreate(BaseModel):
    book_title: str
    author: Optional[str] = None
    genre: Optional[str] = None
    max_price: Optional[float] = None

class WishlistItemResponse(WishlistItemCreate):
    id: str
    user_id: str

class HomeFeedResponse(BaseModel):
    recommended: List[ListingResponse]
    wishlist_matches: List[ListingResponse]
    highlights: List[ListingResponse]
