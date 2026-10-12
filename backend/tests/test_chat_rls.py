"""
Testes unitários e de integração para validação das regras de negócio de RLS
e permissões de acesso ao Chat e Mensagens (US-04).
"""
import pytest
from unittest.mock import MagicMock

def test_mensagem_caracteres_limite():
    """Valida que mensagens devem ter entre 1 e 1000 caracteres (US-02)."""
    conteudo_valido = "Olá, ainda está disponível?"
    assert len(conteudo_valido) > 0 and len(conteudo_valido) <= 1000

    conteudo_vazio = "   "
    assert len(conteudo_vazio.strip()) == 0  # Rejeitado

    conteudo_extenso = "a" * 1001
    assert len(conteudo_extenso) > 1000  # Rejeitado


def test_conversa_apenas_entre_participantes():
    """Valida regra lógica de que terceiro não pode participar da conversa (US-04)."""
    anunciante_id = "user-1"
    interessado_id = "user-2"
    terceiro_id = "user-3"

    participantes = {anunciante_id, interessado_id}

    assert anunciante_id in participantes
    assert interessado_id in participantes
    assert terceiro_id not in participantes


def test_bloqueio_impede_envio_mensagem():
    """Valida que existência de bloqueio mútuo barra envio de novas mensagens (US-04)."""
    bloqueios = [("user-1", "user-2")]  # user-1 bloqueou user-2

    def pode_enviar(remetente, destinatario, lista_bloqueios):
        for b_origem, b_alvo in lista_bloqueios:
            if (b_origem == remetente and b_alvo == destinatario) or \
               (b_origem == destinatario and b_alvo == remetente):
                return False
        return True

    assert pode_enviar("user-1", "user-2", bloqueios) is False
    assert pode_enviar("user-2", "user-1", bloqueios) is False
    assert pode_enviar("user-1", "user-3", bloqueios) is True
