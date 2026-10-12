"""
Serviço de Visão Computacional para Avaliação da Condição de Livros (Release 2).
Utiliza a API do Google Gemini (1.5 Flash) com pré-validação local via Pillow (MIME magic bytes,
tamanho, resolução mínima e detecção de fotos pretas) para economizar cota do Free Tier.
"""
import os
import io
import json
from typing import List, Dict, Any, Tuple, Optional
from PIL import Image, ImageStat
import google.generativeai as genai
from app.models.vision_schemas import AvaliacaoCondicaoOutput, TipoFotoDetectado, CondicaoLivroEnum
from app.prompts.rubrica_condicao import RUBRICA_CONDICAO_SYSTEM_PROMPT

def validate_image_locally(image_bytes: bytes) -> Tuple[bool, Optional[str], Optional[Image.Image]]:
    """
    Pré-validação barata com Pillow para poupar a cota da API do Gemini:
    - Bytes reais de imagem (não confia só na extensão)
    - Resolução mínima (pelo menos 100x100)
    - Tamanho máximo (máx 10 MB)
    - Foto não totalmente preta / corrompida
    """
    if len(image_bytes) == 0:
        return False, "Arquivo de imagem vazio.", None

    if len(image_bytes) > 10 * 1024 * 1024:
        return False, "Imagem excede o tamanho máximo de 10 MB.", None

    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()  # Verifica integridade dos bytes
        # Reabre para operações porque verify fecha os buffers
        img = Image.open(io.BytesIO(image_bytes))

        if img.width < 100 or img.height < 100:
            return False, "Resolução da imagem é muito baixa (mínimo 100x100).", None

        # Teste de imagem totalmente escura
        grayscale = img.convert("L")
        stat = ImageStat.Stat(grayscale)
        if stat.mean[0] < 5:  # Média de brilho quase zero
            return False, "A imagem está excessivamente escura para análise.", None

        return True, None, img
    except Exception as e:
        return False, f"Arquivo corrompido ou formato não suportado: {str(e)}", None


def evaluate_book_condition_with_gemini(
    images_data: List[Dict[str, Any]]
) -> AvaliacaoCondicaoOutput:
    """
    Envia as imagens validadas para a API do Gemini multimodal e retorna AvaliacaoCondicaoOutput estruturado.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        # Fallback gracioso se a chave não estiver configurada
        return AvaliacaoCondicaoOutput(
            condicao=None,
            confianca=0.0,
            defeitos_detectados=[],
            justificativa="Chave da API de IA não configurada no servidor. Por favor, selecione a condição manualmente.",
            fotos_insuficientes=True,
            fotos=[]
        )

    genai.configure(api_key=api_key)

    # 1. Pré-processa imagens localmente
    valid_pillow_images = []
    inspected_photos = []

    for idx, item in enumerate(images_data):
        raw_bytes = item.get("bytes", b"")
        slot = item.get("slot", "capa")

        is_valid, error_msg, img = validate_image_locally(raw_bytes)
        if not is_valid:
            inspected_photos.append({
                "indice": idx,
                "slot_declarado": slot,
                "tipo_detectado": TipoFotoDetectado.OUTRO,
                "eh_livro": False,
                "qualidade_ok": False,
                "problema": error_msg
            })
        else:
            # Redimensiona para lado maior <= 1024 para economizar tokens e tráfego
            img.thumbnail((1024, 1024))
            valid_pillow_images.append((idx, slot, img))

    if not valid_pillow_images:
        return AvaliacaoCondicaoOutput(
            condicao=None,
            confianca=0.0,
            defeitos_detectados=["Nenhuma foto com qualidade mínima fornecida"],
            justificativa="Não foi possível avaliar o livro pois nenhuma imagem atendeu aos requisitos mínimos.",
            fotos_insuficientes=True,
            fotos=inspected_photos
        )

    # 2. Prepara chamada ao modelo multimodal Gemini 1.5 Flash
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.2,
            },
            system_instruction=RUBRICA_CONDICAO_SYSTEM_PROMPT
        )

        content_parts = [
            "Avalie o estado de conservação destas fotos do livro de acordo com a rubrica oficial."
        ]

        for idx, slot, img in valid_pillow_images:
            content_parts.append(f"Foto {idx} (Declarada como '{slot}'):")
            content_parts.append(img)

        response = model.generate_content(content_parts)
        raw_json = json.loads(response.text)

        # Valida via Pydantic
        output = AvaliacaoCondicaoOutput.model_validate(raw_json)
        return output

    except Exception as e:
        # Fallback seguro para erro de API / quota esgotada (429) / timeout
        return AvaliacaoCondicaoOutput(
            condicao=None,
            confianca=0.0,
            defeitos_detectados=[],
            justificativa=f"A avaliação automática por IA está temporariamente indisponível ({str(e)[:60]}). Você pode selecionar o estado manualmente.",
            fotos_insuficientes=False,
            fotos=inspected_photos
        )
