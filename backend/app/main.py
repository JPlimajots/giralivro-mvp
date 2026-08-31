from fastapi import FastAPI
from app.database import supabase

app = FastAPI(
    title="GiraLivro API",
    description="API do MVP do GiraLivro para troca de livros e economia circular.",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do GiraLivro!"}

@app.get("/health")
def health_check():
    # Testa a conexão com o banco buscando apenas 1 gênero (se houver) ou retornando sucesso
    try:
        response = supabase.table("genres").select("*").limit(1).execute()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
    