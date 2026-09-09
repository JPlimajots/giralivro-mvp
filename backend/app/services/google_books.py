import httpx
from typing import Optional, Dict, Any

GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes"

async def fetch_book_by_isbn(isbn: str) -> Optional[Dict[str, Any]]:
    """
    Busca metadados do livro na Google Books API através do número do ISBN.
    Retorna título, autores, descrição, imagem de capa, número de páginas, etc.
    """
    clean_isbn = isbn.replace("-", "").strip()
    if not clean_isbn:
        return None

    url = f"{GOOGLE_BOOKS_API_URL}?q=isbn:{clean_isbn}"
    
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                if data.get("totalItems", 0) > 0 and "items" in data:
                    item = data["items"][0]
                    volume_info = item.get("volumeInfo", {})
                    image_links = volume_info.get("imageLinks", {})
                    
                    cover_url = (
                        image_links.get("thumbnail") or 
                        image_links.get("smallThumbnail") or 
                        f"https://covers.openlibrary.org/b/isbn/{clean_isbn}-M.jpg"
                    )
                    # Força HTTPS nas imagens do Google Books
                    if cover_url.startswith("http://"):
                        cover_url = cover_url.replace("http://", "https://")

                    authors = volume_info.get("authors", ["Autor Desconhecido"])
                    categories = volume_info.get("categories", ["Geral"])

                    return {
                        "isbn": clean_isbn,
                        "title": volume_info.get("title", "Obra sem Título"),
                        "author": ", ".join(authors),
                        "description": volume_info.get("description", "Sem descrição disponível."),
                        "cover_url": cover_url,
                        "genre": categories[0] if categories else "Ficção",
                        "page_count": volume_info.get("pageCount", 0),
                        "publisher": volume_info.get("publisher", ""),
                        "published_year": int(volume_info.get("publishedDate", "2024")[:4]) if volume_info.get("publishedDate") else None
                    }
    except Exception as e:
        print(f"Erro ao consultar Google Books API para ISBN {clean_isbn}: {e}")

    # Fallback genérico se a API do Google Books não encontrar o ISBN
    return {
        "isbn": clean_isbn,
        "title": f"Livro ISBN {clean_isbn}",
        "author": "Autor Desconhecido",
        "description": "Obra cadastrada pelo usuário no GiraLivro.",
        "cover_url": f"https://covers.openlibrary.org/b/isbn/{clean_isbn}-M.jpg",
        "genre": "Geral",
        "page_count": 250,
        "publisher": "Editora",
        "published_year": 2023
    }
