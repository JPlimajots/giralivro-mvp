from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class CondicaoLivroEnum(str, Enum):
    EXCELENTE = "Excelente"
    BOM = "Bom"
    RUIM = "Ruim"
    PESSIMO = "Péssimo"

class TipoFotoDetectado(str, Enum):
    CAPA = "capa"
    LOMBADA = "lombada"
    CONTRACAPA = "contracapa"
    MIOLO = "miolo"
    CANTOS = "cantos"
    OUTRO = "outro"
    NAO_E_LIVRO = "nao_e_livro"

class AvaliacaoFotoItem(BaseModel):
    indice: int
    slot_declarado: str
    tipo_detectado: TipoFotoDetectado
    eh_livro: bool
    qualidade_ok: bool
    problema: Optional[str] = None

class AvaliacaoCondicaoOutput(BaseModel):
    condicao: Optional[CondicaoLivroEnum] = None
    confianca: float = Field(..., ge=0.0, le=1.0)
    defeitos_detectados: List[str] = Field(default_factory=list)
    justificativa: str
    fotos_insuficientes: bool = False
    fotos: List[AvaliacaoFotoItem] = Field(default_factory=list)
