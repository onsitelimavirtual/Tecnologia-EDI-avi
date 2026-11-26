# Relatório de QA — Painel de Oportunidades de Emprego v4.3.3

## Diagnóstico da falha de atualização

A interface consultava `./data/atualizacoes.json`, enquanto o arquivo publicado estava na raiz do repositório. Os motores também calculavam a raiz do projeto como diretório pai de `scripts/`, mas estavam armazenados na raiz. O workflow estava fora do diretório reconhecido pelo GitHub Actions (`.github/workflows/`).

Essa divergência impedia a leitura do catálogo e a execução da rotina agendada. A mensagem exibida no navegador era genérica, mas os registros locais permaneciam preservados.

## Métrica de acessos — versão 4.3.3\n\n- Cartão agregado **Acessos à página** inserido nos indicadores do painel.\n- Conta carregamentos da página publicada por meio da API pública do CounterAPI, com namespace e chave fixos.\n- A contagem inicia na ativação; não recupera visualizações históricas e não representa visitantes únicos.\n- O código do painel não envia nome, e-mail, localização ou identificadores de usuário. O provedor declara anonimizar IP e dados do navegador por hashes; por ser um serviço externo, a contagem é aproximada e sujeita às limitações do provedor.\n- Se a API falhar, a interface apresenta indisponibilidade e mantém o restante do painel funcional.\n\n## Correções implementadas

- Catálogos colocados em `data/`, no mesmo caminho consumido pela interface, pelos scripts e pelo QA.
- Motores colocados em `scripts/`, com os caminhos relativos já previstos no código.
- Workflow colocado em `.github/workflows/atualizar-vagas.yml`.
- Workflow configurado para executar após mudanças nos scripts, testes, curadoria ou no próprio workflow; também mantém agenda diária às 06h17 e 18h17 (Brasília) e acionamento manual.
- Testes Node.js adicionados para parser RSS, domínios, datas, prazos, descoberta de concursos, preservação do catálogo em falha total e atualização parcial.
- Consulta do navegador agora tem limite de 12 segundos e exibe o motivo técnico resumido em caso de erro.
- Nenhum dado pessoal de candidato é coletado. Manchetes de notícias permanecem referências, não confirmação de vaga aberta ou edital vigente.

## Testes automatizados incluídos

Arquivo: `tests/atualizacao.test.mjs`.

A suíte contém 16 testes unitários. Ela deve ser executada pelo workflow com:

```bash
node --test tests/*.test.mjs
```

Os resultados reais da primeira execução serão os exibidos no GitHub Actions. Não se declara aprovação de execução remota antes da conclusão do workflow.

## Critérios de publicação

1. As fontes de emprego precisam ter pelo menos uma resposta bem-sucedida; se todas falharem, o catálogo anterior não é sobrescrito.
2. A curadoria de concursos precisa permanecer coerente com o catálogo público e com o fallback offline.
3. O QA valida estrutura, domínios, datas, duplicidades, consistência e anúncios autorais.
4. Uma falha crítica impede o commit dos catálogos gerados.
5. Alertas de curadoria antiga, prazos encerrados ou feeds parciais são registrados como avisos, não como prova de inscrições abertas.

## Limitações mantidas

- Google Notícias RSS é índice intermediário, não API oficial dos jornais ou das bancas.
- A descoberta automática não transforma manchetes em vagas confirmadas nem altera prazos de editais.
- A curadoria de concursos fornecida permanece datada de 15/10/2026 e contém prazos que precisam de conferência humana. O sistema não inventa reabertura nem prorrogação.
- O teste automatizado não substitui a validação do resultado publicado no GitHub Pages nem o teste físico em Android.

## Estado da última execução antes da métrica v4.3.3

**Execução concluída em 26/11/2026, às 02h27 UTC.**

- Testes Node.js: **15 aprovados, 0 falhas na execução anterior à inclusão da métrica de acessos**.
- Atualização de empregos: **3 de 3 feeds responderam**; 10 referências permaneceram após filtros de relevância e janela de 14 dias.
- Concursos: 5 registros permanecem na curadoria oficial e 16 manchetes foram coletadas para revisão humana.
- QA: **27 de 27 verificações aprovadas na execução anterior à inclusão da métrica de acessos**, sem falhas críticas e com 3 alertas de curadoria/prazos.
- Publicação dos catálogos: concluída com sucesso.
- GitHub Pages: build e deploy concluídos com sucesso.

A rotina está habilitada para execução agendada às 06h17 e 18h17 (Brasília). O botão do painel consulta o último catálogo publicado; a coleta externa é feita pelo GitHub Actions. As manchetes de concursos não são editais confirmados e os cinco registros curados possuem prazos informados encerrados, exigindo revisão humana antes de qualquer divulgação como oportunidade aberta.
