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
    - Tamanho máximo (máx 25 MB)
    - Foto não totalmente preta / corrompida
    """
    if len(image_bytes) == 0:
        return False, "Arquivo de imagem vazio.", None

    MAX_BYTES = 700 * 1024  # 700 KB

    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()  # Verifica integridade dos bytes
        # Reabre para operações porque verify fecha os buffers
        img = Image.open(io.BytesIO(image_bytes))

        # Se exceder 700 KB, comprime e redimensiona automaticamente para caber no limite
        if len(image_bytes) > MAX_BYTES:
            print(f"[RESIZE FOTO] Reduzindo foto de {len(image_bytes) // 1024} KB para o limite de 700 KB...", flush=True)
            img.thumbnail((1200, 1200))
            out_buf = io.BytesIO()
            img.convert('RGB').save(out_buf, format='JPEG', quality=80, optimize=True)
            # Se ainda passar, reduz qualidade progressivamente
            if out_buf.tell() > MAX_BYTES:
                out_buf = io.BytesIO()
                img.thumbnail((800, 800))
                img.convert('RGB').save(out_buf, format='JPEG', quality=65, optimize=True)
            img = Image.open(out_buf)

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
            # Redimensiona para lado maior <= 480 para resposta ultrarrápida (<3.5s) e poupar cota
            img.thumbnail((480, 480))
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

    # 2. Prepara chamada ao modelo multimodal Gemini ultrarrápido
    try:
        print("[VISÃO IA] Iniciando análise multimodal com modelo gemini-flash-lite-latest...", flush=True)
        model = genai.GenerativeModel(
            model_name="gemini-flash-lite-latest",
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

        # Se a IA detectou que as fotos NÃO são de livros, define condição como Péssimo
        tem_foto_livro = any(f.eh_livro for f in output.fotos) if output.fotos else False
        if not tem_foto_livro or output.condicao is None:
            output.condicao = CondicaoLivroEnum.PESSIMO
            output.confianca = 1.0
            if not output.justificativa or "livro" not in output.justificativa.lower():
                output.justificativa = "As fotos enviadas não mostram um livro reconhecível (marcado como Péssimo)."

        print(f"[VISÃO IA] Análise concluída: {output.condicao} (confiança: {output.confianca}) - Justificativa: {output.justificativa}", flush=True)
        return output

    except Exception as e:
        print(f"[VISÃO IA] Aviso/Falha na API Gemini: {e}", flush=True)
        # Fallback seguro para erro de API / quota esgotada (429) / timeout
        return AvaliacaoCondicaoOutput(
            condicao=None,
            confianca=0.0,
            defeitos_detectados=[],
            justificativa="Avaliação por IA indisponível no momento. Por favor, confirme o estado manualmente.",
            fotos_insuficientes=False,
            fotos=inspected_photos
        )
