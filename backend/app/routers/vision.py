"""
Rotas para o serviço de Visão Computacional de Avaliação da Condição de Livros (Release 2).
Endpoint: POST /anuncios/avaliar-condicao
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
from app.models.vision_schemas import AvaliacaoCondicaoOutput
from app.services.vision_service import evaluate_book_condition_with_gemini

router = APIRouter(prefix="/anuncios", tags=["Visão Computacional e Condição"])

@router.post("/avaliar-condicao", response_model=AvaliacaoCondicaoOutput)
async def avaliar_condicao(
    capa: Optional[UploadFile] = File(None),
    lombada: Optional[UploadFile] = File(None),
    contracapa: Optional[UploadFile] = File(None),
    miolo: Optional[UploadFile] = File(None),
):
    """
    Recebe as fotos enviadas nos slots do anúncio e retorna a sugestão automática de condição com justificativa e inspeção por foto.
    """
    images_data = []

    if capa:
        bytes_data = await capa.read()
        images_data.append({"slot": "capa", "bytes": bytes_data})

    if lombada:
        bytes_data = await lombada.read()
        images_data.append({"slot": "lombada", "bytes": bytes_data})

    if contracapa:
        bytes_data = await contracapa.read()
        images_data.append({"slot": "contracapa", "bytes": bytes_data})

    if miolo:
        bytes_data = await miolo.read()
        images_data.append({"slot": "miolo", "bytes": bytes_data})

    if not images_data:
        raise HTTPException(status_code=400, detail="Pelo menos uma foto deve ser enviada para análise.")

    resultado = evaluate_book_condition_with_gemini(images_data)
    return resultado
