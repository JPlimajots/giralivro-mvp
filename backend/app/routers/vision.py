"""
Rotas para o serviço de Visão Computacional de Avaliação da Condição de Livros (Release 2).
Endpoint: POST /anuncios/avaliar-condicao-urls
Endpoint: POST /anuncios/avaliar-condicao-base64
"""
import base64
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import requests
import urllib3

from app.models.vision_schemas import AvaliacaoCondicaoOutput
from app.services.vision_service import evaluate_book_condition_with_gemini
from app.deps import verify_api_key

# Silencia avisos de SSL em ambientes de desenvolvimento local
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

router = APIRouter(
    prefix="/anuncios",
    tags=["Visão Computacional e Condição"]
)

# Headers realistas de navegador para download das fotos do Supabase Storage
BROWSER_HEADERS = {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6,es;q=0.5',
    'cache-control': 'no-cache',
    'dnt': '1',
    'pragma': 'no-cache',
    'priority': 'u=0, i',
    'sec-ch-ua': '"Microsoft Edge";v="155", "Chromium";v="155", "Not(A:Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0',
}


# --- Schemas de Entrada ---

class FotoUrlItem(BaseModel):
    slot: str
    url: str


class AvaliarCondicaoUrlsRequest(BaseModel):
    fotos: List[FotoUrlItem]


class FotoBase64Item(BaseModel):
    slot: str
    base64: str


class AvaliarCondicaoBase64Request(BaseModel):
    fotos: List[FotoBase64Item]


# --- Endpoints ---

@router.post("/avaliar-condicao-urls", response_model=AvaliacaoCondicaoOutput)
async def avaliar_condicao_urls(payload: AvaliarCondicaoUrlsRequest):
    """
    Recebe as URLs públicas das fotos já salvas no Supabase Storage.
    Se VISION_API_URL estiver definida no .env (API na Vercel), repassa a requisição
    para a Vercel com o secret key. Caso contrário, processa localmente.
    """
    import os
    vercel_vision_url = os.getenv("VISION_API_URL")
    secret_key = os.getenv("API_KEY_SECRET", "giralivro_secret_key_release2")

    if vercel_vision_url:
        print(f"\n[ROUTER VISÃO] Repassando análise para a API Serverless na Vercel ({vercel_vision_url})...", flush=True)
        try:
            target_url = f"{vercel_vision_url.rstrip('/')}/api/avaliar-condicao"
            v_res = requests.post(
                target_url,
                json=payload.model_dump(),
                headers={"X-API-Key": secret_key},
                timeout=30
            )
            if v_res.status_code == 200:
                print("[ROUTER VISÃO] Resposta recebida da Vercel com sucesso!", flush=True)
                return AvaliacaoCondicaoOutput.model_validate(v_res.json())
            else:
                print(f"[ROUTER VISÃO] Vercel retornou erro {v_res.status_code}: {v_res.text}", flush=True)
        except Exception as v_err:
            print(f"[ROUTER VISÃO] Falha na conexão com a Vercel ({v_err}), usando motor local como fallback...", flush=True)

    # Processamento local de fallback caso não haja Vercel configurada
    print(f"\n[ROUTER VISÃO LOCAL] Processando {len(payload.fotos)} fotos localmente...", flush=True)
    images_data = []
    for item in payload.fotos:
        try:
            resp = requests.get(item.url, headers=BROWSER_HEADERS, verify=False, timeout=12)
            if resp.status_code == 200:
                images_data.append({"slot": item.slot, "bytes": resp.content})
        except Exception as e:
            print(f"[ROUTER VISÃO LOCAL] Erro baixando {item.url}: {e}", flush=True)

    if not images_data:
        raise HTTPException(status_code=400, detail="Não foi possível recuperar as fotos a partir das URLs fornecidas.")

    return evaluate_book_condition_with_gemini(images_data)


@router.post("/avaliar-condicao-base64", response_model=AvaliacaoCondicaoOutput)
async def avaliar_condicao_base64(payload: AvaliarCondicaoBase64Request):
    """
    Recebe as fotos em Base64 puro via JSON como fallback.
    """
    print(f"\n[ROUTER VISÃO] Recebido payload Base64 com {len(payload.fotos)} foto(s) para análise.", flush=True)
    images_data = []
    for item in payload.fotos:
        try:
            raw_b64 = item.base64
            if ',' in raw_b64:
                raw_b64 = raw_b64.split(',')[1]
            bytes_data = base64.b64decode(raw_b64)
            images_data.append({"slot": item.slot, "bytes": bytes_data})
        except Exception:
            continue

    if not images_data:
        raise HTTPException(status_code=400, detail="Nenhuma foto válida em base64 fornecida.")

    return evaluate_book_condition_with_gemini(images_data)
