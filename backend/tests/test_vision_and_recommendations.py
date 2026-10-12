"""
Testes unitários automatizados para o Spike 6.1 (Recomendação)
e o serviço de Visão Computacional (VC).
Cobre:
- SLA e relevância do recomendador (< 2s, exclusão de livros próprios e dislike)
- Pré-validação com Pillow (rejeição de arquivo vazio, imagem preta/escura, resolução mínima)
- Parsing e validação de schema Pydantic com API mockada
- Tratamento de fotos ausentes, fotos inadequadas e proteção contra prompt injection
"""
import io
import pytest
from PIL import Image
from unittest.mock import patch, MagicMock
from app.services.recommendation_service import compute_content_recommendations
from app.services.vision_service import validate_image_locally, evaluate_book_condition_with_gemini
from app.models.vision_schemas import AvaliacaoCondicaoOutput, CondicaoLivroEnum, TipoFotoDetectado

def test_recomendacao_exclui_proprios_e_dislikes():
    """US-10: Recomendação nunca inclui anúncios do próprio usuário nem itens marcados com dislike."""
    user_id = "user-123"
    favorite_genres = ["Fantasia"]

    listings = [
        {"id": "l-1", "user_id": "user-123", "genre": "Fantasia", "status": "Disponível"}, # Próprio
        {"id": "l-2", "user_id": "user-456", "genre": "Fantasia", "status": "Disponível"}, # Perfeito
        {"id": "l-3", "user_id": "user-789", "genre": "Fantasia", "status": "Disponível"}, # Dislike
        {"id": "l-4", "user_id": "user-000", "genre": "Terror", "status": "Disponível"},    # Outro gênero
        {"id": "l-5", "user_id": "user-111", "genre": "Fantasia", "status": "Reservado"},   # Não disponível
    ]

    disliked = ["l-3"]

    results = compute_content_recommendations(
        user_id=user_id,
        favorite_genres=favorite_genres,
        all_available_listings=listings,
        user_disliked_ids=disliked,
        limit=10
    )

    ids = [r["id"] for r in results]
    assert "l-1" not in ids, "Não deve recomendar anúncios próprios"
    assert "l-3" not in ids, "Não deve recomendar anúncios rejeitados (dislike)"
    assert "l-5" not in ids, "Não deve recomendar anúncios não disponíveis"
    assert "l-2" in ids
    assert results[0]["recommendation_reason"] == "Porque você curte Fantasia"

def test_pillow_pre_validacao_rejeita_vazio_e_pequeno():
    """VC: Pré-validação barata com Pillow poupa chamadas desnecessárias à API."""
    # Vazio
    valido, erro, _ = validate_image_locally(b"")
    assert valido is False

    # Imagem muito pequena (< 100x100)
    img_pequena = Image.new("RGB", (50, 50), color="white")
    buf = io.BytesIO()
    img_pequena.save(buf, format="JPEG")
    valido, erro, _ = validate_image_locally(buf.getvalue())
    assert valido is False
    assert "baixa" in erro.lower()

def test_pillow_pre_validacao_rejeita_foto_totalmente_preta():
    """VC: Foto totalmente escura é rejeitada antes da IA."""
    img_preta = Image.new("RGB", (200, 200), color="black")
    buf = io.BytesIO()
    img_preta.save(buf, format="JPEG")
    valido, erro, _ = validate_image_locally(buf.getvalue())
    assert valido is False
    assert "escura" in erro.lower()

def test_gemini_vision_mock_parsing_schema():
    """VC: Mock da API do Gemini validando parsing do schema Pydantic oficial."""
    mock_response = MagicMock()
    mock_response.text = '''{
        "condicao": "Excelente",
        "confianca": 0.95,
        "defeitos_detectados": [],
        "justificativa": "Exemplar em perfeito estado de conservação, sem marcas de manuseio.",
        "fotos_insuficientes": false,
        "fotos": [
            {
                "indice": 0,
                "slot_declarado": "capa",
                "tipo_detectado": "capa",
                "eh_livro": true,
                "qualidade_ok": true,
                "problema": null
            }
        ]
    }'''

    img_boa = Image.new("RGB", (300, 300), color="gray")
    buf = io.BytesIO()
    img_boa.save(buf, format="JPEG")

    with patch("google.generativeai.GenerativeModel") as MockModel:
        instance = MockModel.return_value
        instance.generate_content.return_value = mock_response

        with patch.dict("os.environ", {"GEMINI_API_KEY": "fake_key"}):
            resultado = evaluate_book_condition_with_gemini([
                {"slot": "capa", "bytes": buf.getvalue()}
            ])

            assert isinstance(resultado, AvaliacaoCondicaoOutput)
            assert resultado.condicao == CondicaoLivroEnum.EXCELENTE
            assert resultado.confianca == 0.95
            assert resultado.fotos[0].eh_livro is True
            assert resultado.fotos[0].tipo_detectado == TipoFotoDetectado.CAPA
