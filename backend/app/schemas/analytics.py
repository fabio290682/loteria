from typing import List, Literal

from pydantic import BaseModel, Field


LotteryType = Literal['megasena', 'quina', 'lotofacil']


class ResultadoConcurso(BaseModel):
    concurso: str
    dezenas: List[str]


class ResumoItem(BaseModel):
    titulo: str
    valor: str
    detalhe: str


class DezenaQuente(BaseModel):
    dezena: str
    freq: int
    tendencia: str


class DezenaAtrasada(BaseModel):
    dezena: str
    atraso: int


class ConcursoPerformance(BaseModel):
    concurso: str
    acertos: str
    estrategia: str
    score: str


class DashboardAnalyticsResponse(BaseModel):
    resumo: List[ResumoItem]
    dezenas_quentes: List[DezenaQuente]
    dezenas_atrasadas: List[DezenaAtrasada]
    concursos: List[ConcursoPerformance]
    jogos_sugeridos: List[List[str]]
    resultados: List[ResultadoConcurso]


class GenerateAnalyticsFilters(BaseModel):
    range: int = 30
    balanced: bool = True
    includeHot: bool = True
    includeDelayed: bool = True


class GenerateAnalyticsGamesRequest(BaseModel):
    lottery: LotteryType
    amount: int = Field(default=3, ge=1, le=20)
    filters: GenerateAnalyticsFilters = Field(default_factory=GenerateAnalyticsFilters)


class GenerateAnalyticsGamesResponse(BaseModel):
    jogos: List[List[str]]
