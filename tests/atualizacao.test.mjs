import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { decodeEntities, extractReferences, updateCatalog } from '../scripts/atualizar.mjs';
import { validateContest, dueStatus, parseLeads } from '../scripts/atualizar-concursos.mjs';

const now = new Date('2026-11-25T12:00:00.000Z');
const quietLog = { info() {}, error() {}, warn() {} };

function jobFeed({ sourceUrl = 'https://www.correiobraziliense.com.br', title = 'Vagas de emprego em TI - Correio Braziliense', pubDate = 'Tue, 24 Nov 2026 10:00:00 GMT' } = {}) {
  return `<rss version="2.0"><channel><item>
    <title>${title}</title>
    <link>https://news.google.com/rss/articles/job-123</link>
    <pubDate>${pubDate}</pubDate>
    <source url="${sourceUrl}">Fonte</source>
  </item></channel></rss>`;
}

function contestFeed({ sourceUrl = 'https://www.gov.br', title = 'Concurso público: edital e inscrições abertas', pubDate = 'Tue, 24 Nov 2026 10:00:00 GMT' } = {}) {
  return `<rss version="2.0"><channel><item>
    <title>${title}</title>
    <link>https://news.google.com/rss/articles/contest-123</link>
    <pubDate>${pubDate}</pubDate>
    <source url="${sourceUrl}">Fonte</source>
  </item></channel></rss>`;
}

test('decodifica entidades XML e caracteres Unicode', () => {
  assert.equal(decodeEntities('&amp; &#233; &#x1F600;'), '& é 😀');
});

test('indexa uma manchete de emprego apenas quando fonte e data são válidas', () => {
  const records = extractReferences(jobFeed(), {
    source: 'Correio Braziliense',
    host: 'correiobraziliense.com.br'
  }, now);
  assert.equal(records.length, 1);
  assert.equal(records[0].title, 'Vagas de emprego em TI');
  assert.equal(records[0].type, 'Emprego');
  assert.equal(records[0].origin, 'automatico');
});

test('não atribui uma manchete a um portal cuja origem não corresponde', () => {
  const records = extractReferences(jobFeed({ sourceUrl: 'https://example.org' }), {
    source: 'Correio Braziliense',
    host: 'correiobraziliense.com.br'
  }, now);
  assert.equal(records.length, 0);
});

test('descarta referências de emprego fora da janela de 45 dias', () => {
  const records = extractReferences(jobFeed({ pubDate: 'Wed, 30 Sep 2026 10:00:00 GMT' }), {
    source: 'Correio Braziliense',
    host: 'correiobraziliense.com.br'
  }, now);
  assert.equal(records.length, 0);
});

test('rejeita RSS inválido', () => {
  assert.throws(() => extractReferences('<html>sem feed</html>', {
    source: 'Correio Braziliense',
    host: 'correiobraziliense.com.br'
  }, now), /RSS inválido/);
});

test('aceita concurso com URL HTTPS de banca oficial e datas válidas', () => {
  assert.equal(validateContest({
    id: 'concurso-teste',
    title: 'Concurso de teste',
    organ: 'Órgão público',
    begin: '2026-11-01',
    end: '2026-11-30',
    url: 'https://www.cebraspe.org.br/concursos/teste'
  }), true);
});

test('rejeita concurso com URL não oficial ou data impossível', () => {
  const base = {
    id: 'concurso-teste',
    title: 'Concurso de teste',
    organ: 'Órgão público',
    begin: '2026-11-01',
    end: '2026-11-30',
    url: 'https://www.cebraspe.org.br/concursos/teste'
  };
  assert.equal(validateContest({ ...base, url: 'https://example.org/edital' }), false);
  assert.equal(validateContest({ ...base, begin: '2026-02-30' }), false);
});

test('classifica corretamente os prazos dos concursos', () => {
  const item = { begin: '2026-11-10', end: '2026-11-20' };
  assert.equal(dueStatus(item, '2026-11-09'), 'futuro');
  assert.equal(dueStatus(item, '2026-11-15'), 'prazo');
  assert.equal(dueStatus(item, '2026-11-21'), 'passado');
});

test('descobre manchetes de concursos apenas em fontes oficiais e links Google Notícias', () => {
  const leads = parseLeads(contestFeed(), now);
  assert.equal(leads.length, 1);
  assert.match(leads[0].title, /Concurso público/);
  assert.equal(leads[0].source, 'https://www.gov.br');
});

test('ignora manchetes de concursos sem origem oficial', () => {
  const leads = parseLeads(contestFeed({ sourceUrl: 'https://example.org' }), now);
  assert.equal(leads.length, 0);
});

test('preserva o catálogo existente quando todas as fontes externas falham', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'painel-oportunidades-'));
  try {
    const dest = path.join(dir, 'data', 'atualizacoes.json');
    await fs.mkdir(path.dirname(dest), { recursive: true });
    const previous = JSON.stringify({ generatedAt: '2026-11-24T12:00:00.000Z', records: [{ id: 'anterior' }] });
    await fs.writeFile(dest, previous, 'utf8');
    await assert.rejects(
      updateCatalog({
        fetchFn: async () => { throw new Error('fonte indisponível'); },
        now,
        dest,
        log: quietLog
      }),
      /Todas as consultas falharam/
    );
    assert.equal(await fs.readFile(dest, 'utf8'), previous);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('publica atualização parcial quando pelo menos uma fonte responde', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'painel-oportunidades-'));
  try {
    const dest = path.join(dir, 'data', 'atualizacoes.json');
    const feed = jobFeed();
    const result = await updateCatalog({
      fetchFn: async (url) => {
        if (new URL(url).searchParams.get('q').includes('correiobraziliense.com.br')) {
          return { ok: true, text: async () => feed };
        }
        return { ok: false, status: 503, text: async () => '' };
      },
      now,
      dest,
      log: quietLog
    });
    assert.equal(result.status, 'partial');
    assert.equal(result.feedsSucceeded, 1);
    assert.equal(result.records.length, 1);
    const saved = JSON.parse(await fs.readFile(dest, 'utf8'));
    assert.equal(saved.generatedAt, now.toISOString());
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
