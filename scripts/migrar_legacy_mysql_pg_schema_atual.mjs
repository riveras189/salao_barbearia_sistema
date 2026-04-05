import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não está definida no .env');
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const LEGACY = {
  host: process.env.MYSQL_LEGACY_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_LEGACY_PORT || 3306),
  user: process.env.MYSQL_LEGACY_USER || 'root',
  password: process.env.MYSQL_LEGACY_PASSWORD || '',
  database: process.env.MYSQL_LEGACY_DATABASE || 'salao_legado',
};

const CLEAR_DESTINATION = String(process.env.LIMPAR_DESTINO || '').toLowerCase() === 'true';
const OUTPUT_DIR = path.resolve(process.cwd(), 'storage', 'migrations');

const idMap = {
  empresaId: null,
  empresaLegacyId: null,
  clientes: {},
  profissionais: {},
  servicos: {},
  produtos: {},
  usuarios: {},
  agendamentos: {},
  comandas: {},
  fornecedores: {},
  despesaCategorias: {},
};

const cache = {
  fornecedorByNome: new Map(),
  categoriaByNome: new Map(),
  clienteByKey: new Map(),
  profissionalByNome: new Map(),
  servicoByNome: new Map(),
  produtoByNome: new Map(),
  usuarioByLogin: new Map(),
  comandaPaymentCount: new Map(),
};

function d(value) {
  if (value == null || value === '') return new Prisma.Decimal(0);
  return new Prisma.Decimal(String(value));
}

function intOr(value, fallback = 0) {
  const n = parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

function boolOr(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 't', 'yes', 'sim'].includes(String(value).trim().toLowerCase());
}

function digits(value) {
  return String(value || '').replace(/\D+/g, '');
}

function textOrNull(value) {
  if (value == null) return null;
  const t = String(value).trim();
  return t ? t : null;
}

function toYMD(value) {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function dateOnly(value) {
  const ymd = toYMD(value);
  return ymd ? new Date(`${ymd}T00:00:00`) : null;
}

function dateTime(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const raw = String(value).trim();

  const direct = new Date(raw.replace(' ', 'T'));
  if (!Number.isNaN(direct.getTime())) return direct;

  return null;
}

function timeOnly(value) {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toTimeString().slice(0, 8);
  }

  const raw = String(value).trim().slice(0, 8);
  return /^\d{2}:\d{2}:\d{2}$/.test(raw) ? raw : null;
}

function combineDateTime(dateValue, timeValue) {
  const ymd = toYMD(dateValue);
  if (!ymd) return null;

  const hms = timeOnly(timeValue) || '00:00:00';
  const dt = new Date(`${ymd}T${hms}`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function addMinutes(date, minutes) {
  const out = new Date(date.getTime());
  out.setMinutes(out.getMinutes() + intOr(minutes, 0));
  return out;
}

function normalizeFileUrl(raw) {
  const t = textOrNull(raw);
  if (!t) return null;
  const v = t.replace(/\\/g, '/');
  if (v.startsWith('http://') || v.startsWith('https://')) return v;
  return v.startsWith('/') ? v : `/uploads/${v.replace(/^uploads\//, '')}`;
}

function mapPapelBase(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (v === 'admin') return 'ADMIN';
  if (v === 'profissional') return 'PROFISSIONAL';
  if (v === 'gerente') return 'GERENTE';
  return 'RECEPCIONISTA';
}

function mapAgendamentoStatus(raw, motivo) {
  const v = String(raw || '').trim().toLowerCase();
  const m = String(motivo || '').trim().toLowerCase();
  if (v === 'concluido') return 'CONCLUIDO';
  if (v === 'cancelado' && m.includes('falt')) return 'FALTOU';
  if (v === 'cancelado') return 'CANCELADO';
  if (v === 'confirmado') return 'CONFIRMADO';
  return 'AGENDADO';
}

function mapComandaStatus(raw) {
  const v = String(raw || '').trim().toLowerCase();
  return v === 'fechada' ? 'FECHADA' : 'ABERTA';
}

function mapContaStatus(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (v === 'pago') return 'PAGA';
  if (v === 'cancelado') return 'CANCELADA';
  return 'ABERTA';
}

function mapCaixaTipo(raw) {
  return String(raw || '').trim().toLowerCase() === 'saida' ? 'SAIDA' : 'ENTRADA';
}

function mapFormaPagamento(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (!v) return null;
  if (v === 'pix') return 'PIX';
  if (v === 'dinheiro') return 'DINHEIRO';
  if (v === 'fiado') return 'FIADO';
  if (v === 'cartao_credito') return 'CARTAO_CREDITO';
  if (v === 'cartao_debito') return 'CARTAO_DEBITO';
  if (v === 'cartao') return 'CARTAO_CREDITO';
  if (v === 'transferencia') return 'TRANSFERENCIA';
  if (v === 'boleto') return 'BOLETO';
  if (v === 'misto') return 'MISTO';
  return 'OUTRO';
}

function mapBloqueioTipo(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (v.includes('almoc')) return 'ALMOCO';
  if (v.includes('folga')) return 'FOLGA';
  if (v.includes('medic')) return 'MEDICO';
  if (v.includes('manut')) return 'MANUTENCAO';
  if (v.includes('aus') || v.includes('saiu')) return 'AUSENCIA';
  return 'OUTRO';
}

function mapCaixaCategoria(origem, descricao) {
  const o = String(origem || '').trim().toLowerCase();
  const dsc = String(descricao || '').trim().toLowerCase();
  if (o === 'cancelamento') return 'ESTORNO';
  if (o === 'servico' || o === 'produto') return 'COMANDA';
  if (dsc.includes('sangria')) return 'SANGRIA';
  if (dsc.includes('suprimento')) return 'SUPRIMENTO';
  return 'OUTRO';
}

function mapCaixaReferenciaTipo(origem) {
  const o = String(origem || '').trim().toLowerCase();
  if (o === 'servico' || o === 'produto') return 'COMANDA';
  return 'OUTRO';
}

function diaSemanaLegacyParaAtual(v) {
  const n = intOr(v, 0);
  if (n === 1) return 7;
  if (n >= 2 && n <= 7) return n - 1;
  return 1;
}

function agendamentoObservacoes(row) {
  const parts = [];
  const motivo = textOrNull(row.motivo_cancelamento);
  const servico = textOrNull(row.servico);
  if (servico) parts.push(`Serviço legado: ${servico}`);
  if (motivo) parts.push(`Motivo: ${motivo}`);
  return parts.length ? parts.join(' | ') : null;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function saveJson(name, data) {
  await ensureDir(OUTPUT_DIR);
  await fs.writeFile(path.join(OUTPUT_DIR, name), JSON.stringify(data, null, 2), 'utf8');
}

async function tableExists(conn, tableName) {
  const [rows] = await conn.query('SHOW TABLES LIKE ?', [tableName]);
  return rows.length > 0;
}

async function getRows(conn, tableName, orderBy = 'id') {
  if (!(await tableExists(conn, tableName))) return [];
  const sql = orderBy
    ? `SELECT * FROM \`${tableName}\` ORDER BY \`${orderBy}\``
    : `SELECT * FROM \`${tableName}\``;
  const [rows] = await conn.query(sql);
  return rows;
}

async function clearDestination() {
  const order = [
    prisma.usuarioPermissao,
    prisma.permissao,
    prisma.loginLog,
    prisma.contaReceberPagamento,
    prisma.contaPagarPagamento,
    prisma.caixaMovimento,
    prisma.recibo,
    prisma.comandaPagamento,
    prisma.comandaItem,
    prisma.comanda,
    prisma.agendamentoServico,
    prisma.bloqueioAgenda,
    prisma.agendamento,
    prisma.estoqueMovimentacao,
    prisma.produto,
    prisma.profissionalServico,
    prisma.profissionalHorario,
    prisma.profissionalDocumento,
    prisma.profissional,
    prisma.funcionario,
    prisma.servicoImagem,
    prisma.servico,
    prisma.servicoCategoria,
    prisma.produtoCategoria,
    prisma.contaReceber,
    prisma.contaPagar,
    prisma.despesaCategoria,
    prisma.fornecedor,
    prisma.clienteAcesso,
    prisma.clienteAlerta,
    prisma.clienteTagItem,
    prisma.clienteTag,
    prisma.cliente,
    prisma.listaEspera,
    prisma.avaliacao,
    prisma.auditoriaLog,
    prisma.galeriaItem,
    prisma.bannerSite,
    prisma.depoimento,
    prisma.paginaSite,
    prisma.arquivo,
    prisma.agendamentoOnlineConfig,
    prisma.empresaConfiguracao,
    prisma.usuario,
    prisma.empresa,
  ];

  for (const model of order) {
    await model.deleteMany({});
  }
}

async function ensureEmpresa(conn) {
  const empresas = await getRows(conn, 'empresa');
  const legacy = empresas[0] || {};

  const empresa = await prisma.empresa.create({
    data: {
      razaoSocial:
        textOrNull(legacy.razao_social) ||
        textOrNull(legacy.nome_fantasia) ||
        'Empresa Migrada',
      nomeFantasia:
        textOrNull(legacy.nome_fantasia) ||
        textOrNull(legacy.razao_social) ||
        'Empresa Migrada',
      cnpj: digits(legacy.cnpj) || null,
      email: textOrNull(legacy.email),
      telefone: textOrNull(legacy.telefone),
      whatsapp: textOrNull(legacy.whatsapp) || textOrNull(legacy.telefone),
      cep: digits(legacy.cep) || null,
      logradouro: textOrNull(legacy.endereco) || textOrNull(legacy.logradouro),
      numero: textOrNull(legacy.numero),
      complemento: textOrNull(legacy.complemento),
      bairro: textOrNull(legacy.bairro),
      cidade: textOrNull(legacy.cidade),
      uf: textOrNull(legacy.uf),
      descricaoPublica: textOrNull(legacy.descricao),
      corPrimaria: textOrNull(legacy.cor_primaria) || '#0f172a',
      corSecundaria: textOrNull(legacy.cor_secundaria) || '#1e293b',
      ativo: true,
    },
  });

  await prisma.empresaConfiguracao.create({
    data: {
      empresaId: empresa.id,
      moeda: 'BRL',
      timezone: 'America/Sao_Paulo',
      intervaloAgendaMin: 30,
      permiteEncaixe: true,
      tema: textOrNull(legacy.tema) || 'sistema',
      sitePublicado: boolOr(legacy.site_publicado, false),
    },
  });

  idMap.empresaId = empresa.id;
  idMap.empresaLegacyId = legacy.id ?? null;

  console.log(`Empresa criada: ${empresa.nomeFantasia || empresa.razaoSocial} (${empresa.id})`);
}

async function migrateClientes(conn) {
  const rows = await getRows(conn, 'clientes');
  for (const row of rows) {
    const nome = textOrNull(row.nome) || `Cliente legado ${row.id}`;
    const cpf = digits(row.cpf) || null;
    const telefone = textOrNull(row.telefone) || textOrNull(row.telefone_norm);
    const whatsapp = textOrNull(row.whatsapp) || telefone;
    const email = textOrNull(row.email);
    const fotoUrl = normalizeFileUrl(row.foto || row.foto_url);

    const cliente = await prisma.cliente.create({
      data: {
        empresaId: idMap.empresaId,
        nome,
        cpf,
        dataNascimento: dateOnly(row.data_nascimento || row.nascimento),
        email,
        telefone,
        whatsapp,
        cep: digits(row.cep) || null,
        logradouro: textOrNull(row.endereco) || textOrNull(row.logradouro),
        numero: textOrNull(row.numero),
        complemento: textOrNull(row.complemento),
        bairro: textOrNull(row.bairro),
        cidade: textOrNull(row.cidade),
        uf: textOrNull(row.uf),
        observacoes: textOrNull(row.observacoes) || textOrNull(row.obs),
        origemCadastro: 'MIGRACAO',
        ativo: boolOr(row.ativo, true),
        fotoUrl,
      },
    });

    idMap.clientes[row.id] = cliente.id;
    if (cpf) cache.clienteByKey.set(`cpf:${cpf}`, cliente.id);
    if (telefone) cache.clienteByKey.set(`tel:${digits(telefone)}`, cliente.id);
    cache.clienteByKey.set(`nome:${nome.toLowerCase()}`, cliente.id);
  }

  console.log(`Clientes migrados: ${rows.length}`);
}

async function migrateServicos(conn) {
  const rows = await getRows(conn, 'servicos');
  for (const row of rows) {
    const nome = textOrNull(row.nome) || `Serviço legado ${row.id}`;

    const servico = await prisma.servico.create({
      data: {
        empresaId: idMap.empresaId,
        nome,
        descricao: textOrNull(row.descricao),
        duracaoMin: intOr(row.duracao_min || row.duracao || row.tempo, 30),
        preco: d(row.preco || row.valor || 0),
        comissaoPercentualPadrao: d(row.comissao || row.comissao_percentual || 0),
        ativo: boolOr(row.ativo, true),
        exibirNoSite: true,
      },
    });

    idMap.servicos[row.id] = servico.id;
    cache.servicoByNome.set(nome.toLowerCase(), servico.id);
  }

  console.log(`Serviços migrados: ${rows.length}`);
}

async function migrateProfissionais(conn) {
  const rows = await getRows(conn, 'profissionais');
  for (const row of rows) {
    const nome = textOrNull(row.nome) || `Profissional legado ${row.id}`;
    const telefone = textOrNull(row.telefone);
    const cpf = digits(row.cpf) || null;
    const cnpj = digits(row.cnpj) || null;

    const profissional = await prisma.profissional.create({
      data: {
        empresaId: idMap.empresaId,
        nome,
        cpf,
        cnpj,
        email: textOrNull(row.email),
        telefone,
        whatsapp: textOrNull(row.whatsapp) || telefone,
        cep: digits(row.cep) || null,
        logradouro: textOrNull(row.endereco) || textOrNull(row.logradouro),
        numero: textOrNull(row.numero),
        complemento: textOrNull(row.complemento),
        bairro: textOrNull(row.bairro),
        cidade: textOrNull(row.cidade),
        uf: textOrNull(row.uf),
        dataAdmissao: dateOnly(row.data_admissao),
        dataDemissao: dateOnly(row.data_demissao),
        observacoes: textOrNull(row.observacoes) || textOrNull(row.obs),
        corAgenda: textOrNull(row.cor_agenda) || textOrNull(row.cor),
        ativo: boolOr(row.ativo, true),
        fotoUrl: normalizeFileUrl(row.foto || row.foto_url),
      },
    });

    idMap.profissionais[row.id] = profissional.id;
    cache.profissionalByNome.set(nome.toLowerCase(), profissional.id);
  }

  console.log(`Profissionais migrados: ${rows.length}`);
}

async function migrateProfissionalHorarios(conn) {
  const candidates = ['profissionais_horarios', 'profissional_horarios', 'profissional_horario'];
  let rows = [];
  for (const t of candidates) {
    rows = await getRows(conn, t);
    if (rows.length) break;
  }

  for (const row of rows) {
    const profissionalId = idMap.profissionais[row.profissional_id];
    if (!profissionalId) continue;

    await prisma.profissionalHorario.create({
      data: {
        profissionalId,
        diaSemana: diaSemanaLegacyParaAtual(row.dia_semana),
        horaInicio: timeOnly(row.hora_inicio) || '08:00:00',
        horaFim: timeOnly(row.hora_fim) || '18:00:00',
        intervaloInicio: timeOnly(row.intervalo_inicio),
        intervaloFim: timeOnly(row.intervalo_fim),
        ativo: boolOr(row.ativo, true),
      },
    });
  }

  console.log(`Horários de profissionais migrados: ${rows.length}`);
}

async function migrateProfissionalServicos(conn) {
  const candidates = ['profissional_servicos', 'profissionais_servicos'];
  let rows = [];
  for (const t of candidates) {
    rows = await getRows(conn, t);
    if (rows.length) break;
  }

  for (const row of rows) {
    const profissionalId = idMap.profissionais[row.profissional_id];
    const servicoId = idMap.servicos[row.servico_id];
    if (!profissionalId || !servicoId) continue;

    await prisma.profissionalServico.upsert({
      where: {
        profissionalId_servicoId: { profissionalId, servicoId },
      },
      update: {
        comissaoPercentualOverride: row.comissao != null ? d(row.comissao) : null,
        valorOverride: row.preco != null ? d(row.preco) : null,
        duracaoMinOverride: row.duracao_min != null ? intOr(row.duracao_min) : null,
        ativo: boolOr(row.ativo, true),
      },
      create: {
        profissionalId,
        servicoId,
        comissaoPercentualOverride: row.comissao != null ? d(row.comissao) : null,
        valorOverride: row.preco != null ? d(row.preco) : null,
        duracaoMinOverride: row.duracao_min != null ? intOr(row.duracao_min) : null,
        ativo: boolOr(row.ativo, true),
      },
    });
  }

  console.log(`Vínculos profissional/serviço migrados: ${rows.length}`);
}

async function ensureFornecedor(nome) {
  const key = nome.toLowerCase();
  if (cache.fornecedorByNome.has(key)) return cache.fornecedorByNome.get(key);

  const fornecedor = await prisma.fornecedor.create({
    data: { empresaId: idMap.empresaId, nome, ativo: true },
  });

  cache.fornecedorByNome.set(key, fornecedor.id);
  return fornecedor.id;
}

async function migrateProdutos(conn) {
  const rows = await getRows(conn, 'produtos');
  for (const row of rows) {
    const nome = textOrNull(row.nome) || `Produto legado ${row.id}`;
    const fornecedorNome = textOrNull(row.fornecedor);
    const fornecedorId = fornecedorNome ? await ensureFornecedor(fornecedorNome) : null;

    const produto = await prisma.produto.create({
      data: {
        empresaId: idMap.empresaId,
        nome,
        descricao: textOrNull(row.descricao),
        codigoBarras: textOrNull(row.codigo_barras),
        unidade: textOrNull(row.unidade) || 'UN',
        estoqueAtual: intOr(row.estoque_atual || row.estoque || 0),
        estoqueMinimo: intOr(row.estoque_minimo || 0),
        ativo: boolOr(row.ativo, true),
        fotoUrl: normalizeFileUrl(row.foto || row.foto_url),
        custo: d(row.custo || 0),
        marca: textOrNull(row.marca),
        preco: d(row.preco || row.valor_venda || 0),
        fornecedorId,
      },
    });

    idMap.produtos[row.id] = produto.id;
    cache.produtoByNome.set(nome.toLowerCase(), produto.id);
  }

  console.log(`Produtos migrados: ${rows.length}`);
}

async function migrateEstoqueMovimentacoes(conn) {
  const rows = await getRows(conn, 'estoque_movimentacoes');
  let inserted = 0;

  for (const row of rows) {
    const produtoId = idMap.produtos[row.produto_id];
    if (!produtoId) continue;

    await prisma.estoqueMovimentacao.create({
      data: {
        empresaId: idMap.empresaId,
        produtoId,
        tipo: intOr(row.quantidade, 0) >= 0 ? 'ENTRADA' : 'SAIDA',
        quantidade: Math.abs(intOr(row.quantidade, 0)),
        createdAt: dateTime(row.data || row.created_at) || new Date(),
        observacao: textOrNull(row.observacao) || textOrNull(row.descricao),
        origem: 'MANUAL',
        saldoAnterior: intOr(row.saldo_anterior, 0),
        saldoAtual: intOr(row.saldo_atual, intOr(row.estoque_atual, 0)),
      },
    });

    inserted++;
  }

  console.log(`Movimentações de estoque migradas: ${inserted}`);
}

async function migrateUsuarios(conn) {
  const rows = await getRows(conn, 'usuarios');
  for (const row of rows) {
    const login = textOrNull(row.login) || textOrNull(row.usuario) || `usuario_${row.id}`;
    const nome = textOrNull(row.nome) || login;
    const profissionalId = row.profissional_id ? idMap.profissionais[row.profissional_id] || null : null;

    const usuario = await prisma.usuario.create({
      data: {
        empresaId: idMap.empresaId,
        nome,
        email: textOrNull(row.email),
        login,
        senhaHash: textOrNull(row.senha_hash) || textOrNull(row.senha) || 'migrado_sem_hash_valido',
        papelBase: mapPapelBase(row.perfil),
        profissionalId,
        ativo: boolOr(row.ativo, true),
        ultimoLoginEm: dateTime(row.ultimo_login_em || row.ultimo_login),
        desativadoEm: boolOr(row.ativo, true) ? null : dateTime(row.updated_at) || new Date(),
      },
    });

    idMap.usuarios[row.id] = usuario.id;
    cache.usuarioByLogin.set(login.toLowerCase(), usuario.id);
  }

  console.log(`Usuários migrados: ${rows.length}`);
}

function resolveClienteId(row) {
  if (row.cliente_id && idMap.clientes[row.cliente_id]) return idMap.clientes[row.cliente_id];
  const nome = textOrNull(row.cliente);
  if (nome) return cache.clienteByKey.get(`nome:${nome.toLowerCase()}`) || null;
  return null;
}

function resolveProfissionalId(row) {
  if (row.profissional_id && idMap.profissionais[row.profissional_id]) {
    return idMap.profissionais[row.profissional_id];
  }
  const nome = textOrNull(row.profissional);
  if (!nome) return null;
  return cache.profissionalByNome.get(nome.toLowerCase()) || null;
}

async function migrateAgendamentos(conn) {
  const rows = await getRows(conn, 'agendamentos');
  let inserted = 0;

  for (const row of rows) {
    const clienteId = resolveClienteId(row);
    const profissionalId = resolveProfissionalId(row);
    const inicio = combineDateTime(row.data, row.hora);

    if (!clienteId || !profissionalId || !inicio) continue;

    const duracao = intOr(row.duracao_total_min, 30);
    const fim = addMinutes(inicio, duracao || 30);

    const ag = await prisma.agendamento.create({
      data: {
        empresaId: idMap.empresaId,
        clienteId,
        profissionalId,
        inicio,
        fim,
        status: mapAgendamentoStatus(row.status, row.motivo_cancelamento),
        origem: 'INTERNO',
        observacoes: agendamentoObservacoes(row),
        encaixe: boolOr(row.encaixe, false),
        createdAt: inicio,
        updatedAt: inicio,
      },
    });

    idMap.agendamentos[row.id] = ag.id;
    inserted++;
  }

  console.log(`Agendamentos migrados: ${inserted}`);
}

async function migrateAgendamentoServicos(conn) {
  const rows = await getRows(conn, 'agendamento_servicos');
  const orderByAgendamento = new Map();
  let inserted = 0;

  for (const row of rows) {
    const agendamentoId = idMap.agendamentos[row.agendamento_id];
    const servicoId = idMap.servicos[row.servico_id];
    if (!agendamentoId || !servicoId) continue;

    const servico = await prisma.servico.findUnique({ where: { id: servicoId } });
    if (!servico) continue;

    const currentOrder = orderByAgendamento.get(agendamentoId) || 0;
    orderByAgendamento.set(agendamentoId, currentOrder + 1);

    await prisma.agendamentoServico.create({
      data: {
        agendamentoId,
        servicoId,
        nomeSnapshot: servico.nome,
        duracaoMinSnapshot: intOr(row.duracao_min, servico.duracaoMin),
        valorSnapshot: row.preco != null ? d(row.preco) : servico.preco,
        comissaoPercentualSnapshot: servico.comissaoPercentualPadrao,
        ordem: currentOrder,
      },
    });

    inserted++;
  }

  console.log(`Itens de serviço do agendamento migrados: ${inserted}`);
}

async function migrateBloqueios(conn) {
  const rows = await getRows(conn, 'bloqueios');
  let inserted = 0;

  for (const row of rows) {
    const profissionalId = idMap.profissionais[row.profissional_id];
    if (!profissionalId) continue;

    const dataInicio = combineDateTime(row.data, row.hora);
    if (!dataInicio) continue;

    await prisma.bloqueioAgenda.create({
      data: {
        empresaId: idMap.empresaId,
        profissionalId,
        dataInicio,
        dataFim: addMinutes(dataInicio, intOr(row.duracao_min, 30)),
        tipo: mapBloqueioTipo(row.motivo),
        descricao: textOrNull(row.motivo),
        cor: '#fca5a5',
        recorrente: false,
        ativo: true,
      },
    });

    inserted++;
  }

  console.log(`Bloqueios migrados: ${inserted}`);
}

async function migrateComandas(conn) {
  const rows = await getRows(conn, 'comandas');
  let sequencial = 1;

  for (const row of rows) {
    const clienteId = row.cliente_id ? idMap.clientes[row.cliente_id] || null : null;
    const profissionalPrincipalId = row.profissional_id
      ? idMap.profissionais[row.profissional_id] || null
      : null;
    const agendamentoId = row.agendamento_id ? idMap.agendamentos[row.agendamento_id] || null : null;

    const comanda = await prisma.comanda.create({
      data: {
        empresaId: idMap.empresaId,
        numeroSequencial: sequencial++,
        clienteId,
        profissionalPrincipalId,
        agendamentoId,
        status: mapComandaStatus(row.status),
        subtotalServicos: d(row.subtotal_servicos || 0),
        subtotalProdutos: d(row.subtotal_produtos || 0),
        descontoValor: d(row.desconto_valor || 0),
        acrescimoValor: d(row.acrescimo_valor || 0),
        total: d(row.total || 0),
        observacoes: textOrNull(row.observacoes) || textOrNull(row.obs),
        abertaEm: dateTime(row.criada_em || row.created_at) || new Date(),
        fechadaEm: dateTime(row.fechada_em || row.updated_at),
      },
    });

    idMap.comandas[row.id] = comanda.id;
  }

  console.log(`Comandas migradas: ${rows.length}`);
}

function mapItemTipo(raw) {
  const v = String(raw || '').trim().toLowerCase();
  return v === 'produto' ? 'PRODUTO' : 'SERVICO';
}

async function migrateComandaItens(conn) {
  const rows = await getRows(conn, 'comanda_itens');
  let inserted = 0;

  for (const row of rows) {
    const comandaId = idMap.comandas[row.comanda_id];
    if (!comandaId) continue;

    const tipo = mapItemTipo(row.tipo);
    const servicoId = tipo === 'SERVICO' && row.servico_id ? idMap.servicos[row.servico_id] || null : null;
    const produtoId = tipo === 'PRODUTO' && row.produto_id ? idMap.produtos[row.produto_id] || null : null;
    const profissionalId = row.profissional_id ? idMap.profissionais[row.profissional_id] || null : null;

    let descricao = textOrNull(row.descricao);
    if (!descricao && servicoId) {
      const servico = await prisma.servico.findUnique({ where: { id: servicoId } });
      descricao = servico?.nome || null;
    }
    if (!descricao && produtoId) {
      const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
      descricao = produto?.nome || null;
    }
    if (!descricao) descricao = `Item legado ${row.id}`;

    await prisma.comandaItem.create({
      data: {
        comandaId,
        tipo,
        servicoId,
        produtoId,
        profissionalId,
        descricao,
        quantidade: d(row.quantidade || row.qtd || 1),
        valorUnitario: d(row.valor_unitario || row.preco || 0),
        valorTotal: d(row.valor_total || row.total || row.preco || 0),
        custoUnitario: row.custo_unitario != null ? d(row.custo_unitario) : null,
        comissaoPercentual: row.percentual_comissao != null ? d(row.percentual_comissao) : null,
        valorComissao: row.valor_comissao != null ? d(row.valor_comissao) : null,
        createdAt: dateTime(row.criado_em || row.created_at) || new Date(),
      },
    });

    inserted++;
  }

  console.log(`Itens de comanda migrados: ${inserted}`);
}

async function migrateComandaPagamentos(conn) {
  const rows = await getRows(conn, 'comanda_pagamentos');
  let inserted = 0;

  for (const row of rows) {
    const comandaId = idMap.comandas[row.comanda_id];
    if (!comandaId) continue;

    await prisma.comandaPagamento.create({
      data: {
        comandaId,
        metodo: mapFormaPagamento(row.forma_pagamento || row.metodo) || 'OUTRO',
        valor: d(row.valor || 0),
        observacoes: textOrNull(row.observacoes) || textOrNull(row.obs),
        transacaoExternaId: textOrNull(row.transacao_id),
        pagoEm: dateTime(row.pago_em || row.data || row.created_at) || new Date(),
      },
    });

    inserted++;
  }

  console.log(`Pagamentos de comanda migrados: ${inserted}`);
}

async function migrateContasReceber(conn) {
  const rows = await getRows(conn, 'contas_receber');
  let inserted = 0;

  for (const row of rows) {
    const clienteId = row.cliente_id ? idMap.clientes[row.cliente_id] || null : null;

    const conta = await prisma.contaReceber.create({
      data: {
        empresaId: idMap.empresaId,
        clienteId,
        descricao: textOrNull(row.descricao) || `Conta a receber legado ${row.id}`,
        valorOriginal: d(row.valor || row.valor_original || 0),
        valorAberto: d(
          row.valor_aberto != null
            ? row.valor_aberto
            : String(row.status || '').trim().toLowerCase() === 'pago'
              ? 0
              : row.valor || 0
        ),
        vencimento: dateOnly(row.vencimento),
        status: mapContaStatus(row.status),
        origemTipo: 'OUTRO',
        origemId: row.origem_id ? String(row.origem_id) : null,
        createdAt: dateTime(row.created_at || row.criado_em) || new Date(),
      },
    });

    inserted++;

    if (String(row.status || '').trim().toLowerCase() === 'pago') {
      await prisma.contaReceberPagamento.create({
        data: {
          contaReceberId: conta.id,
          valor: d(row.valor_pago || row.valor || row.valor_original || 0),
          metodo: mapFormaPagamento(row.forma_pagamento) || 'DINHEIRO',
          pagoEm: dateTime(row.pago_em || row.updated_at || row.created_at) || new Date(),
        },
      });
    }
  }

  console.log(`Contas a receber migradas: ${inserted}`);
}

async function ensureDespesaCategoria(nome) {
  const key = nome.toLowerCase();
  if (cache.categoriaByNome.has(key)) return cache.categoriaByNome.get(key);

  const categoria = await prisma.despesaCategoria.create({
    data: { empresaId: idMap.empresaId, nome, ativo: true },
  });

  cache.categoriaByNome.set(key, categoria.id);
  return categoria.id;
}

async function migrateContasPagar(conn) {
  const rows = await getRows(conn, 'contas_pagar');
  let inserted = 0;

  for (const row of rows) {
    const fornecedorNome = textOrNull(row.fornecedor);
    const fornecedorId = fornecedorNome ? await ensureFornecedor(fornecedorNome) : null;
    const categoriaNome = textOrNull(row.categoria);
    const categoriaId = categoriaNome ? await ensureDespesaCategoria(categoriaNome) : null;

    const conta = await prisma.contaPagar.create({
      data: {
        empresaId: idMap.empresaId,
        fornecedorId,
        categoriaId,
        descricao: textOrNull(row.descricao) || `Conta a pagar legado ${row.id}`,
        valorOriginal: d(row.valor || row.valor_original || 0),
        valorAberto: d(
          row.valor_aberto != null
            ? row.valor_aberto
            : String(row.status || '').trim().toLowerCase() === 'pago'
              ? 0
              : row.valor || 0
        ),
        vencimento: dateOnly(row.vencimento),
        status: mapContaStatus(row.status),
        createdAt: dateTime(row.created_at || row.criado_em) || new Date(),
      },
    });

    inserted++;

    if (String(row.status || '').trim().toLowerCase() === 'pago') {
      await prisma.contaPagarPagamento.create({
        data: {
          contaPagarId: conta.id,
          valor: d(row.valor_pago || row.valor || row.valor_original || 0),
          metodo: mapFormaPagamento(row.forma_pagamento) || 'DINHEIRO',
          pagoEm: dateTime(row.pago_em || row.updated_at || row.created_at) || new Date(),
        },
      });
    }
  }

  console.log(`Contas a pagar migradas: ${inserted}`);
}

async function migrateCaixa(conn) {
  const rows = await getRows(conn, 'caixa');
  let inserted = 0;

  for (const row of rows) {
    await prisma.caixaMovimento.create({
      data: {
        empresaId: idMap.empresaId,
        tipo: mapCaixaTipo(row.tipo),
        categoria: mapCaixaCategoria(row.origem, row.descricao),
        descricao: textOrNull(row.descricao) || `Movimento legado ${row.id}`,
        valor: d(row.valor || 0),
        formaPagamento: mapFormaPagamento(row.forma_pagamento),
        referenciaTipo: mapCaixaReferenciaTipo(row.origem),
        referenciaId: row.referencia_id
          ? String(row.referencia_id)
          : row.comanda_id
            ? String(row.comanda_id)
            : null,
        dataMovimento: dateTime(row.data || row.created_at) || new Date(),
        createdAt: dateTime(row.data || row.created_at) || new Date(),
      },
    });

    inserted++;
  }

  console.log(`Caixa migrado: ${inserted}`);
}

async function main() {
  console.log('Conectando ao MySQL legado...', LEGACY);
  const conn = await mysql.createConnection(LEGACY);

  try {
    if (CLEAR_DESTINATION) {
      console.log('Limpando banco de destino...');
      await clearDestination();
    }

    await ensureEmpresa(conn);
    await migrateClientes(conn);
    await migrateServicos(conn);
    await migrateProfissionais(conn);
    await migrateProfissionalHorarios(conn);
    await migrateProfissionalServicos(conn);
    await migrateProdutos(conn);
    await migrateEstoqueMovimentacoes(conn);
    await migrateUsuarios(conn);
    await migrateAgendamentos(conn);
    await migrateAgendamentoServicos(conn);
    await migrateBloqueios(conn);
    await migrateComandas(conn);
    await migrateComandaItens(conn);
    await migrateComandaPagamentos(conn);
    await migrateContasReceber(conn);
    await migrateContasPagar(conn);
    await migrateCaixa(conn);

    await saveJson('legacy-id-map.json', idMap);
    console.log('Migração concluída com sucesso.');
    console.log(`Mapa de IDs salvo em: ${path.join(OUTPUT_DIR, 'legacy-id-map.json')}`);
  } finally {
    await conn.end().catch(() => undefined);
    await prisma.$disconnect().catch(() => undefined);
  }
}

main().catch(async (error) => {
  console.error('Erro na migração:', error);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});