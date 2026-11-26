# Painel de Oportunidades de Emprego — Versão 4.3.2

**Projeto autoral: Nailson Rodrigues de Lima.** Aplicação web para organizar referências de oportunidades de emprego, concursos públicos e divulgação gratuita de softwares autorais no rodapé.


## Correção 4.3.2 — integração da atualização

- Reorganizados os arquivos nas pastas que o próprio sistema já espera: `data/`, `scripts/` e `.github/workflows/`.
- Corrigida a causa do erro de consulta: a interface procurava `data/atualizacoes.json`, mas o catálogo estava publicado na raiz.
- O workflow agora está em `.github/workflows/atualizar-vagas.yml`, é acionado quando a estrutura dos motores, testes, curadoria ou o próprio workflow é alterada na branch padrão e sincroniza a branch remota antes de publicar os catálogos.
- Incluída uma suíte Node.js executável pelo GitHub Actions e filtros de relevância para excluir manchetes de cursos, vestibulares, concursos, eventos e notícias sem contratação.
- A janela de validade das referências de emprego foi alinhada ao período de busca de 14 dias, reduzindo a permanência de notícias antigas.
- Registros antigos preservados só permanecem se também passarem pelos novos filtros de relevância; manchetes sobre cursos, concursos, eventos e temas sem contratação são descartadas.
- O botão **Consultar atualizações** relê o último catálogo publicado; a coleta externa é feita pelo GitHub Actions, não diretamente pelo navegador. O painel não incorpora tokens ou segredos no HTML.
- A consulta no navegador agora tem limite de tempo e informa a causa técnica resumida quando falha.

## Correção 4.3.1 — Navegação para concursos no celular

- Corrigida a camada decorativa do cartão de destaque: o pseudo-elemento `.promo:after` agora usa `pointer-events: none` e não intercepta toques.
- O link **Ver concursos em destaque** fica explicitamente acima da decoração, com `z-index` e `touch-action` apropriados.
- Os links para `#concursos` agora possuem tratamento explícito: atualizam a âncora e chamam `scrollIntoView`, respeitando a preferência do dispositivo por movimento reduzido.
- A âncora mantém seu `href` nativo como alternativa de navegação caso o JavaScript não esteja disponível.

## O que mudou na versão 4.3

- Inclusão do **Motor de QA de Integridade**, executado depois dos motores de atualização e antes da publicação dos catálogos.
- O QA valida formato dos JSON, datas, idade dos catálogos, fontes e domínios HTTPS permitidos, IDs/URLs duplicados, consistência entre a curadoria de concursos e o catálogo público, anúncios autorais habilitados, identidade do sistema e agenda do workflow.
- Falhas críticas **bloqueiam a publicação dos catálogos**. Alertas não críticos permitem a publicação com o estado `passed_with_warnings`, que fica registrado para revisão.
- Relatório automático em `data/qa-status.json`, exibido no painel como estado da última verificação.
- Atualização agendada duas vezes ao dia: **06h17 e 18h17, horário de Brasília** (09h17 e 21h17 UTC). Também é possível iniciar manualmente em GitHub Actions.
- Os catálogos de emprego e concursos continuam separados. A descoberta de manchetes não transforma automaticamente uma notícia em vaga aberta ou edital confirmado.

## Como funciona a atualização

1. GitHub Actions inicia o workflow `.github/workflows/atualizar-vagas.yml` após mudanças na estrutura de atualização, nos dois horários diários ou por acionamento manual.
2. `scripts/atualizar.mjs` consulta RSS intermediário do Google Notícias para localizar referências sobre emprego, estágio, trainee e aprendizagem.
3. `scripts/atualizar-concursos.mjs` mantém os concursos da curadoria oficial e consulta manchetes para revisão. A rotina não altera prazos de editais curados por conta própria.
4. `scripts/atualizar-concursos.mjs` sincroniza também o catálogo de fallback embutido no `index.html`, para que a consulta offline não fique diferente da curadoria.
5. `scripts/qa-integridade.mjs` valida os dados recém-gerados e grava `data/qa-status.json`.
6. Só se o QA não encontrar falhas críticas o workflow faz commit e push do HTML sincronizado e dos arquivos de dados. Se o QA falhar, os catálogos não são publicados e o relatório é anexado à execução como artefato para auditoria.

**Fuso horário:** o cron do GitHub usa UTC. `17 9,21 * * *` corresponde a 06h17 e 18h17 em Brasília (UTC−3). O GitHub pode atrasar ou enfileirar execuções; os horários são agendados, não uma garantia de execução exata ao minuto.

## Publicação no GitHub Pages

1. Extraia o pacote de publicação na raiz do repositório GitHub, preservando as pastas `.github/`, `scripts/` e `data/`.
2. Em `Settings → Pages`, configure a publicação pela branch e pasta que contém `index.html`.
3. Em `Settings → Actions → General`, permita que os workflows tenham permissão de leitura e escrita no conteúdo do repositório (`contents: write`). Se a branch tiver proteção, configure uma regra que permita o push do workflow ou adapte o processo de publicação.
4. Na aba **Actions**, execute manualmente **Atualizar oportunidades e executar QA de integridade**.
5. Confira o resultado da execução. O job deve terminar com sucesso e publicar `data/atualizacoes.json`, `data/concursos.json` e `data/qa-status.json`.
6. No painel, a barra de sincronização apresenta a data da atualização e o estado do último QA.

A rotina foi ativada na branch padrão e a primeira execução real do GitHub Actions foi concluída com sucesso: 15 testes aprovados, 3 feeds de emprego consultados, 10 referências filtradas por relevância e atualidade e QA com 27 verificações aprovadas. O relatório registrou alertas de curadoria de concursos antiga e prazos encerrados, sem falhas críticas.

## Interpretação do QA

- `passed`: verificações estruturais e de consistência aprovadas, sem alertas.
- `passed_with_warnings`: estrutura íntegra, mas há pontos que precisam de revisão humana, como curadoria antiga, todos os prazos de concursos encerrados ou falha parcial/offline de uma fonte de notícias.
- `failed`: inconsistência crítica. O workflow não publica os novos catálogos.

O motor verifica **consistência interna**, não a verdade material de cada anúncio. Ele consegue detectar datas impossíveis, links fora dos domínios permitidos, duplicidades, catálogos divergentes e dados incompletos. Não consegue garantir, sozinho, que uma empresa ainda está contratando, que uma banca prorrogou inscrições ou que um edital foi suspenso, a menos que exista uma fonte oficial estruturada para essa informação. Retificações, cancelamentos e prazos continuam exigindo conferência no site oficial ou integração autorizada.

## Testes

Com Node.js 20 ou superior:

```bash
node --test tests/*.test.mjs
```

A suíte Node em `tests/atualizacao.test.mjs` cobre decodificação de entidades, filtragem de feeds por domínio e data, validação de concursos e prazos, descoberta de manchetes oficiais, preservação do catálogo quando todas as fontes falham e atualização parcial quando ao menos uma fonte responde.

Para os testes de interface locais, com Playwright e Chromium instalados:

```bash
python tests/testar_v4_1.py
```

Os testes usam fixtures e respostas simuladas; não substituem a primeira execução real do GitHub Actions, nem a validação manual em aparelhos físicos e leitores de tela.

## Publicidade autoral

A divulgação dos softwares autorais permanece no rodapé e oculta quando não há anúncios habilitados. O editor `ferramentas-locais/editor-projetos.html` é de uso local do administrador e **não deve ser publicado**. Ele gera `projetos-autorais.json`, que deve ser enviado manualmente à raiz do repositório. O motor de QA confere se os anúncios habilitados têm nome, descrição, URL HTTPS válida quando informada e imagem permitida.

## Arquivos principais

| Arquivo | Função |
|---|---|
| `index.html` | Painel público de empregos e concursos |
| `data/atualizacoes.json` | Referências encontradas na rotina de empregos |
| `data/concursos-curados.json` | Curadoria de concursos conferidos pelo administrador |
| `data/concursos.json` | Catálogo público de concursos e manchetes para revisão |
| `data/qa-status.json` | Último relatório do motor de QA |
| `scripts/atualizar.mjs` | Indexador de referências de emprego |
| `scripts/atualizar-concursos.mjs` | Atualizador de concursos e descobridor de manchetes |
| `scripts/qa-integridade.mjs` | Motor de QA que libera ou bloqueia a publicação |
| `.github/workflows/atualizar-vagas.yml` | Agenda, testes, atualização, QA e publicação |
| `tests/*.test.mjs` | Testes unitários dos motores |
| `QA.md` | Relatório de qualidade e limitações |

## Limitações conhecidas

- Google Notícias RSS é índice intermediário, não API oficial dos jornais ou das bancas. Pode omitir resultados ou retornar manchetes que não correspondem a inscrições abertas.
- O QA não navega por cada página oficial para interpretar retificações em linguagem natural.
- A curadoria inicial de concursos tem data de referência de 15/10/2026. Na data desta versão (23/11/2026), o QA deverá sinalizar a necessidade de revisão e os prazos já encerrados; ele não reabre nem inventa editais.
- O agendamento depende do GitHub Actions, da branch padrão, das permissões e da disponibilidade da plataforma.
- Não há coleta de currículos, CPF ou dados de inscrição dos candidatos.
