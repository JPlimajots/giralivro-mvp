from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import supabase
from app.routers import feed, users, auth, books, listings, wishlist, search

app = FastAPI(
    title="GiraLivro API",
    description="API Completa do MVP do GiraLivro para troca de livros, autenticação, busca especializada e economia circular.",
    version="1.0.0"
)

# Configuração de CORS para permitir acesso do React Native / Expo e Web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra todos os roteadores de módulos
app.include_router(auth.router)
app.include_router(feed.router)
app.include_router(users.router)
app.include_router(books.router)
app.include_router(listings.router)
app.include_router(wishlist.router)
app.include_router(search.router)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do GiraLivro!"}

@app.get("/health")
def health_check():
    try:
        response = supabase.table("genres").select("*").limit(1).execute()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "ok", "database": "standalone_mode", "detail": str(e)}