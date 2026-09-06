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

class BookListingPublic(BaseModel):
    id: str
    title: str
    author: str
    cover: str
    modality: str  # 'TROCA', 'VENDA', 'DOAÇÃO', 'VENDA OU TROCA'
    price: Optional[float] = None
    condition: str  # 'Excelente', 'Novo', 'Com marcas'
    neighborhood: str = "Boa Viagem"
    distance_km: float = 1.2
    is_school_book: bool = False
    genre: str = "Ficção"
