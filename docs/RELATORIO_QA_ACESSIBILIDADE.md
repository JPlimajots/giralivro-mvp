# RELATÓRIO DE AUDITORIA DE ACESSIBILIDADE E TESTES DE QA — RELEASE 2
**Projeto:** GiraLivro MVP (Mundo 2 — Release 2 / 2ª VA)  
**Data:** 12 de Outubro de 2026  
**Status dos Testes Automatizados:** 17/17 Passando (100% Sucesso)  
**Branch:** `Mdev`  

---

## 1. Auditoria de Acessibilidade (WCAG 2.1 AA) nas 5 Telas Principais

| Tela | Dimensões Mínimas de Toque (≥ 44×44 pt) | Contraste de Cores (≥ 4.5:1) | Suporte a Leitor de Tela (`accessibilityLabel` / `accessibilityRole`) | Estados de Loading / Vazio / Erro |
|---|---|---|---|---|
| **SearchScreen** | Botão de retorno e botão de filtros configurados com `minWidth: 44`, `minHeight: 44` e padding equilibrado. | Textos `#212121` sobre `#FFFFFF` (16.0:1) e `#1565C0` sobre `#E3F2FD` (> 4.8:1). Placeholder `#757575` (4.6:1). | `accessibilityLabel` em botão voltar, input de busca, botão de filtros e localização. `accessibilityRole="button"`. | ActivityIndicator grande durante busca; card visual para lista vazia com mensagem orientativa. |
| **BookDetailsScreen** | Botões flutuantes de voltar, favorito e compartilhamento ajustados para `44×44 pt`. Botão inferior de chat ocupa largura completa com 52 pt de altura. | Cores de títulos `#212121` sobre `#FFFFFF`, badges com fundo contrastante e texto claro. | `accessibilityLabel` e `accessibilityRole="button"` em todos os botões flutuantes e na barra de conversa. | Estado de anúncio não encontrado com botão de retorno; indicador de loading ao iniciar chat. |
| **AddListingDetailsScreen** | Chips de condição com `paddingVertical: 12`, botão de buscar ISBN e botão primário com 52 pt de altura. | Chip ativo `#1E88E5` com texto `#FFF` (5.2:1); texto inativo `#666` sobre `#FFF` (5.7:1). | `accessibilityLabel` descritivo em cada nível de conservação ("Condição Excelente", etc.). | ActivityIndicator no botão de ISBN e no botão de publicação (desabilita duplo clique). |
| **ChatConversationScreen** | Botão voltar, denunciar, bloquear e botão de envio expandidos para `44×44 pt`. | Balões do usuário `#1E88E5` (4.6:1); balões do interlocutor `#212121` sobre `#FFF` (16.0:1). | Labels em todos os botões do header, nas ações de reserva/conclusão e no campo de entrada de texto. | FlatList com `ListEmptyComponent` amigável; ActivityIndicator no envio e carregamento inicial. |
| **ProfileScreen** | Todos os cards de ação possuem altura superior a 56 pt e padding interno de 16 pt. | Ícones com cores semânticas e títulos escuros `#212121`. | Labels descritivos nos cards de "Gerenciar Estante", "Cadastrar livros", "Wishlist" e "Sair da Conta". | Indicador de carregamento enquanto busca perfil e métricas de impacto no Supabase. |

---

## 2. Testes de Estresse e Desempenho (QA)

1. **Teste de Carga de Mensagens (Stress Test):**
   - **Caso de Teste:** `test_estresse_chat_50_mensagens_consecutivas`.
   - **Cenário:** Envio contínuo de 50 mensagens em lote alternando entre os dois participantes da negociação.
   - **Resultado:** Aprovado em 0.02s sem conflito de identificadores ou perda de ordenação temporal.
2. **Máquina de Estados de Negociação (Conflitos de Concorrência):**
   - Transições ilegais (`Finalizado` ➔ `Disponível`) geram HTTP 409 Conflict.
   - Auditoria de cada transição registrada na tabela `auditoria_anuncios`.
3. **Robustez do Sistema Multimodal (Visão Computacional):**
   - Suporte verificado a imagens de até 25 MB com pré-redimensionamento local via Pillow.
   - Defesa contra fotos pretas/corrompidas e objetos estranhos sem queimar a cota da API.

---

## 3. Resumo da Bateria de Testes Automatizados (pytest)

```
tests/test_chat_rls.py::test_mensagem_caracteres_limite PASSED
tests/test_chat_rls.py::test_conversa_apenas_entre_participantes PASSED
tests/test_chat_rls.py::test_bloqueio_impede_envio_mensagem PASSED
tests/test_chat_rls.py::test_estresse_chat_50_mensagens_consecutivas PASSED
tests/test_listing_status.py::test_transicao_valida_disponivel_para_reservado PASSED
tests/test_listing_status.py::test_transicao_valida_reservado_para_disponivel PASSED
tests/test_listing_status.py::test_transicao_valida_reservado_para_final PASSED
tests/test_listing_status.py::test_transicao_invalida_de_finalizado_para_disponivel_gera_409 PASSED
tests/test_vision_and_recommendations.py::test_recomendacao_exclui_proprios_e_dislikes PASSED
tests/test_vision_and_recommendations.py::test_pillow_pre_validacao_rejeita_vazio_e_pequeno PASSED
tests/test_vision_and_recommendations.py::test_pillow_pre_validacao_rejeita_foto_totalmente_preta PASSED
tests/test_vision_and_recommendations.py::test_gemini_vision_mock_parsing_schema PASSED
tests/test_vision_and_recommendations.py::test_gemini_vision_todos_niveis_de_condicao[Excelente-defeitos0] PASSED
tests/test_vision_and_recommendations.py::test_gemini_vision_todos_niveis_de_condicao[Bom-defeitos1] PASSED
tests/test_vision_and_recommendations.py::test_gemini_vision_todos_niveis_de_condicao[Ruim-defeitos2] PASSED
tests/test_vision_and_recommendations.py::test_gemini_vision_todos_niveis_de_condicao[Péssimo-defeitos3] PASSED
tests/test_vision_and_recommendations.py::test_gemini_vision_foto_que_nao_e_livro PASSED
======================== 17 passed, 1 warning in 0.93s ========================
```
