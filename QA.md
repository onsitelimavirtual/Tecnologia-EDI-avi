# Relatório de QA — Painel de Oportunidades de Emprego v4.3

**Data de implementação e teste local:** 23/11/2026.  
**Escopo:** motor de QA de integridade, agendamento duas vezes ao dia, indicador do QA na interface e preservação dos módulos anteriores.

## Resultado dos testes executados

### Testes Node.js

- **27/27 testes aprovados** com `node --test tests/*.test.mjs`.
- Oito testes do indexador de referências de emprego.
- Nove testes de curadoria, descoberta de concursos e sincronização do fallback offline.
- Dez testes do motor de QA de integridade.

Os testes do QA verificam: aprovação de catálogos consistentes; alertas para curadoria antiga e prazos encerrados; bloqueio de URLs inválidas; detecção de IDs/URLs duplicados; divergência entre concursos públicos e curadoria; publicidade habilitada incompleta; timestamp futuro; e ausência de agendamento/QA antes da publicação.

### Testes de interface

- **32/32 verificações aprovadas** em Chromium/Playwright por `tests/testar_v4_1.py`, atualizado para a versão 4.3.
- Conferidos título, identidade, grade de vagas, pesquisa, filtros, favoritos, editor de publicidade, upload de imagem, exportação JSON, ocultação do rodapé, paginação e larguras mobile de 390 px e 320 px.
- Capturas atualizadas: `captura-desktop.png`, `captura-mobile.png`, `captura-editor.png` e `captura-publicidade-ativa.png`.

**Total de testes concluídos e aprovados nesta rodada: 59.** Uma suíte complementar antiga de interface (`tests/ui_v42.py`) excedeu o limite de execução local e não foi contabilizada.

## Motor de QA de integridade

Arquivo: `scripts/qa-integridade.mjs`.

### Verificações críticas — bloqueiam publicação

- JSON válido e estrutura esperada dos catálogos;
- geração recente e timestamp sem data futura;
- status e contadores de feeds coerentes;
- campos obrigatórios, datas, tipos e fontes permitidas;
- URLs HTTPS esperadas e domínios de origem permitidos;
- IDs e URLs duplicados;
- correspondência exata entre `concursos-curados.json`, `concursos.json` e o fallback de concursos embutido no HTML;
- manchetes de concursos separadas dos editais curados;
- anúncios autorais habilitados com nome e descrição, URL segura quando informada e imagem dentro do formato/limite aceito;
- título oficial do sistema, presença do indicador de QA e agenda de duas execuções diárias;
- execução do QA antes do commit/push dos catálogos.

### Alertas não bloqueantes

- feed de empregos parcial ou sem referências encontradas;
- índice de notícias de concursos parcial ou offline;
- curadoria de concursos com mais de 14 dias sem revisão;
- ausência de concursos dentro do período informado;
- concursos cujo prazo informado já terminou.

O status `passed_with_warnings` significa que a estrutura está consistente, mas requer revisão humana. O status `failed` impede a publicação dos catálogos.

## Agenda implementada

Workflow: `.github/workflows/atualizar-vagas.yml`.

- Cron: `17 9,21 * * *` em UTC.
- Horários equivalentes: **06h17 e 18h17 no horário de Brasília**.
- `workflow_dispatch` permite execução manual.
- O workflow executa testes, atualizadores, motor de QA e só então faz commit/push dos catálogos aprovados.
- Relatório QA é arquivado como artefato da execução para auditoria.

## Limitações e pendências reais

1. **Não houve publicação nem execução real no repositório GitHub do administrador.** A agenda está configurada nos arquivos, mas só passa a operar após upload para a branch padrão, ativação de Actions e permissão `contents: write`.
2. Os testes dos motores utilizam fixtures/simulações. Não foi confirmada a resposta atual dos feeds externos nesta rodada.
3. A curadoria de concursos incluída no pacote foi verificada em 15/10/2026. Em 23/11/2026, o QA deve sinalizar que ela está antiga e que os prazos registrados já terminaram. O motor não inventa novos prazos nem presume reabertura.
4. O QA valida integridade técnica e coerência entre arquivos; não substitui a leitura de editais, retificações, suspensões e cancelamentos em páginas oficiais.
5. Ainda pendem testes em Android físico, leitores de tela, navegadores antigos e comportamento real do CDN/GitHub Pages após publicação.

## Conclusão

A integração local do motor de QA e a agenda de duas execuções diárias foram implementadas. **A validação automatizada local passou nos 56 testes contabilizados.** A ativação efetiva das atualizações automáticas depende da publicação e da primeira execução do workflow no GitHub do administrador.
