"""
Testes unitários para regras de transição de status dos anúncios (US-05, US-06, US-07).
Valida que o backend rejeita transições inválidas com erro HTTP 409 Conflict.
"""
import pytest
from fastapi import HTTPException
from app.services.status_service import (
    validate_status_transition,
    STATUS_DISPONIVEL,
    STATUS_RESERVADO,
    STATUS_TROCADO,
    STATUS_VENDIDO,
    STATUS_DOADO,
)

def test_transicao_valida_disponivel_para_reservado():
    """US-05: Disponível pode ir para Reservado."""
    novo = validate_status_transition("Disponível", "Reservado")
    assert novo == STATUS_RESERVADO

def test_transicao_valida_reservado_para_disponivel():
    """US-07: Cancelar reserva volta para Disponível."""
    novo = validate_status_transition("Reservado", "Disponível")
    assert novo == STATUS_DISPONIVEL

def test_transicao_valida_reservado_para_final():
    """US-06: Reservado pode ser concluído como Vendido, Trocado ou Doado."""
    assert validate_status_transition("Reservado", "Trocado") == STATUS_TROCADO
    assert validate_status_transition("Reservado", "Vendido") == STATUS_VENDIDO
    assert validate_status_transition("Reservado", "Doado") == STATUS_DOADO

def test_transicao_invalida_de_finalizado_para_disponivel_gera_409():
    """US-06: Status final é irreversível e deve retornar HTTP 409 Conflict."""
    with pytest.raises(HTTPException) as exc_trocado:
        validate_status_transition("Trocado", "Disponível")
    assert exc_trocado.value.status_code == 409

    with pytest.raises(HTTPException) as exc_vendido:
        validate_status_transition("Vendido", "Disponível")
    assert exc_vendido.value.status_code == 409

    with pytest.raises(HTTPException) as exc_doado:
        validate_status_transition("Doado", "Reservado")
    assert exc_doado.value.status_code == 409
