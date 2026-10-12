"""
Rotas para o serviço de Visão Computacional de Avaliação da Condição de Livros (Release 2).
Endpoint: POST /anuncios/avaliar-condicao
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
from app.models.vision_schemas import AvaliacaoCondicaoOutput
from app.services.vision_service import evaluate_book_condition_with_gemini

router = APIRouter(prefix="/anuncios", tags=["Visão Computacional e Condição"])

from pydantic import BaseModel
import base64

class FotoBase64Item(BaseModel):
    slot: str
    base64: str

class AvaliarCondicaoBase64Request(BaseModel):
    fotos: List[FotoBase64Item]

@router.post("/avaliar-condicao-base64", response_model=AvaliacaoCondicaoOutput)
async def avaliar_condicao_base64(payload: AvaliarCondicaoBase64Request):
    """
    Recebe as fotos em Base64 puro via JSON, garantindo 100% de compatibilidade com React Native / Expo no Android e iOS.
    """
    images_data = []
    for item in payload.fotos:
        try:
            raw_b64 = item.base64
            if ',' in raw_b64:
                raw_b64 = raw_b64.split(',')[1]
            bytes_data = base64.b64decode(raw_b64)
            images_data.append({"slot": item.slot, "bytes": bytes_data})
        except Exception as e:
            continue

    if not images_data:
        raise HTTPException(status_code=400, detail="Nenhuma foto válida em base64 fornecida.")

    return evaluate_book_condition_with_gemini(images_data)
