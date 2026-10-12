"""
Serviço de máquina de estados para anúncios (Release 2).
Regras:
- Disponível ⇄ Reservado
- Reservado → Trocado / Vendido / Doado (conforme modalidade)
- Transições inválidas geram erro HTTP 409 (Conflict).
- Status finais (Trocado, Vendido, Doado) são estritamente irreversíveis.
"""
from fastapi import HTTPException, status
from typing import Optional

STATUS_DISPONIVEL = "Disponível"
STATUS_RESERVADO = "Reservado"
STATUS_TROCADO = "Trocado"
STATUS_VENDIDO = "Vendido"
STATUS_DOADO = "Doado"

STATUS_FINAIS = {STATUS_TROCADO, STATUS_VENDIDO, STATUS_DOADO}

# Mapeamento de compatibilidade caso o banco use uppercase legado
STATUS_NORMALIZATION = {
    "ATIVO": STATUS_DISPONIVEL,
    "DISPONIVEL": STATUS_DISPONIVEL,
    "PUBLICADO": STATUS_DISPONIVEL,
    "NEGOCIADO": STATUS_TROCADO,
}

def normalize_status(st: Optional[str]) -> str:
    if not st:
        return STATUS_DISPONIVEL
    normalized = STATUS_NORMALIZATION.get(st.upper(), st)
    return normalized

def validate_status_transition(
    current_status_raw: str,
    new_status_raw: str,
    modality: Optional[str] = None
) -> str:
    """
    Valida a transição de status. Retorna o novo status validado ou levanta HTTPException(409).
    """
    current_status = normalize_status(current_status_raw)
    new_status = normalize_status(new_status_raw)

    # 1. Se o status atual já for final, nenhuma transição é permitida (irreversível)
    if current_status in STATUS_FINAIS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Transição inválida: o anúncio já está finalizado como '{current_status}' e não pode ser alterado."
        )

    # 2. Transições permitidas a partir de Disponível
    if current_status == STATUS_DISPONIVEL:
        if new_status in {STATUS_DISPONIVEL, STATUS_RESERVADO}:
            return new_status
        # Permitir conclusão direta se necessário
        if new_status in STATUS_FINAIS:
            return new_status
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Transição inválida de '{current_status}' para '{new_status}'."
        )

    # 3. Transições permitidas a partir de Reservado
    if current_status == STATUS_RESERVADO:
        if new_status in {STATUS_DISPONIVEL, STATUS_RESERVADO, STATUS_TROCADO, STATUS_VENDIDO, STATUS_DOADO}:
            return new_status
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Transição inválida de '{current_status}' para '{new_status}'."
        )

    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=f"Status desconhecido ou transição não permitida: '{current_status}' -> '{new_status}'."
    )
