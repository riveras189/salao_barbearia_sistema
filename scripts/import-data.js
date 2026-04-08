const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 300_000,
});

const prisma = new PrismaClient({
    adapter,
    log: ["error", "warn"],
});

async function importData() {
  try {
    console.log('Importando dados para o banco PostgreSQL...');
    
    // Empresa (upsert)
    console.log('Criando empresa...');
    await prisma.empresa.upsert({
      where: { id: 'cmnnhyxmc0000jcbkj1apv5oa' },
      update: {},
      create: {
        id: 'cmnnhyxmc0000jcbkj1apv5oa',
        razaoSocial: 'Empresa Migrada',
        nomeFantasia: 'Empresa Migrada',
        email: 'riveras.adm@gmail.com',
        telefone: '(17) 98105-1200',
        whatsapp: '(17) 98105-1200',
        cep: '15070500',
        numero: '189',
        bairro: 'Jardim Roseiral',
        cidade: 'São José do Rio Preto',
        corPrimaria: '#0FA320',
        corSecundaria: '#3BE874',
        ativo: true,
        createdAt: new Date('2026-04-06T18:01:49.236'),
        updatedAt: new Date('2026-04-06T18:01:49.236'),
      }
    });
    console.log('Empresa criada/atualizada com ID: cmnnhyxmc0000jcbkj1apv5oa');

    // Configuração da empresa (upsert)
    console.log('Criando configuração...');
    await prisma.empresaConfiguracao.upsert({
      where: { id: 'cmnnhyxmr0001jcbk4gjxpn70' },
      update: {},
      create: {
        id: 'cmnnhyxmr0001jcbk4gjxpn70',
        empresaId: 'cmnnhyxmc0000jcbkj1apv5oa',
        moeda: 'BRL',
        timezone: 'America/Sao_Paulo',
        intervaloAgendaMin: 30,
        diasAntecedenciaAgendamentoOnline: 30,
        exigeSinalAgendamento: false,
        percentualSinal: 0,
        permiteEncaixe: true,
        tema: 'sistema',
        sitePublicado: false,
        createdAt: new Date('2026-04-06T18:01:49.251'),
        updatedAt: new Date('2026-04-06T18:01:49.251'),
      }
    });
    console.log('Configuração criada');

    // SystemModels (upsert)
    console.log('Criando system models...');
    const systemModels = [
      { id: 'barbearia_v1', nome: 'Barbearia', descricao: 'Tema e linguagem de barbearia', icone: 'scissors', ativo: true, padrao: true, configuracoes: { greeting: "Bem-vindo à barbearia!", priceTemplate: "R$ {value}", responseTone: "informal", colorScheme: "barbearia", serviceLabel: "corte", appointmentLabel: "horário", heroVariant: "barber-dark" } },
      { id: 'padrao_v1', nome: 'Padrão', descricao: 'Modelo original do sistema', icone: 'sparkles', ativo: true, padrao: false, configuracoes: { greeting: "Bem-vindo ao sistema!", priceTemplate: "R$ {value}", responseTone: "formal", colorScheme: "default", serviceLabel: "serviço", appointmentLabel: "agendamento", heroVariant: "default" } },
      { id: 'personalizado_v1', nome: 'Personalizado', descricao: 'Modelo customizável pelo administrador', icone: 'sliders', ativo: true, padrao: false, configuracoes: { greeting: "Olá!", priceTemplate: "R$ {value}", responseTone: "formal", colorScheme: "custom", serviceLabel: "serviço", appointmentLabel: "agendamento", heroVariant: "custom" } },
    ];
    for (const model of systemModels) {
      await prisma.systemModel.upsert({
        where: { id: model.id },
        update: {},
        create: { ...model, createdAt: new Date('2026-04-06T18:01:50.785'), updatedAt: new Date('2026-04-06T18:07:16.756') }
      });
    }
    console.log('System models criados');

    // Empresa System Preference (upsert)
    await prisma.empresaSystemPreference.upsert({
      where: { id: 'cmnnhyyu50000mgbkni9q4drf' },
      update: {},
      create: {
        id: 'cmnnhyyu50000mgbkni9q4drf',
        empresaId: 'cmnnhyxmc0000jcbkj1apv5oa',
        modelId: 'barbearia_v1',
        changedAt: new Date('2026-04-06T18:01:50.813'),
      }
    });
    console.log('Empresa system preference criada');

    // Profissionais PRIMEIRO (antes dos usuários que referenciam)
    console.log('Criando profissionais...');
    const profissionais = [
      { id: 'cmnnhyye5008hjcbkm4trmqv8', nome: 'Ricardo Ferreira', cpf: '11422849805', cnpj: '14564544554454', email: 'riveras189@gmail.com', telefone: '(17) 98105-1200', whatsapp: '(17) 98105-1200', fotoUrl: '/uploads/prof_8_1770666091.jpg' },
      { id: 'cmnnhyyeb008ijcbkay99lhq8', nome: 'Vera Ferreira', email: 'veraferreira189@hotmail.com', telefone: '(17) 99637-4842', whatsapp: '(17) 99637-4842', fotoUrl: '/uploads/prof_9_1770666114.jpg' },
      { id: 'cmnnhyyeg008jjcbku1alq0y5', nome: 'Victor', email: 'victor.bf700@gmail.com', telefone: '(17) 99654-1819', whatsapp: '(17) 99654-1819', fotoUrl: '/uploads/prof_10_1770666127.jpg' },
    ];
    for (const p of profissionais) {
      await prisma.profissional.upsert({
        where: { id: p.id },
        update: {},
        create: { ...p, empresaId: 'cmnnhyxmc0000jcbkj1apv5oa', ativo: true, createdAt: new Date('2026-04-06T18:01:50.237'), updatedAt: new Date('2026-04-06T18:01:50.248') }
      });
    }
    console.log('Profissionais criados');

    // DEPOIS criar usuários (que referenciam profissionais)
    console.log('Criando usuários...');
    const usuarios = [
      { id: 'cmnnhyynp00apjcbkquaiyfpc', nome: 'Administrador', login: 'admin', senhaHash: '$2b$10$SMOCAcwCHLtNErBkaRU.S.qnXQ/OXofX4jfNCSaAyQuYdjblPO4my', papelBase: 'ADMIN' },
      { id: 'cmnnhyynu00aqjcbkqexpgo03', nome: 'Vera Ferreira', login: 'veraferreira9', senhaHash: '$2a$10$LPR51G92YB8vTBLh0qLPgOVqQpcw0q1DCoromjulbkwUqJGSo6FAG', papelBase: 'PROFISSIONAL', profissionalId: 'cmnnhyyeb008ijcbkay99lhq8' },
      { id: 'cmnnhyynx00arjcbk7rwxl73a', nome: 'Victor', login: 'victor', senhaHash: '$2a$10$IYL3jVnNsbGOGmaPFg77EuQmCs4/PL9YHeUC/8h9Z1hx48ydh3wV6', papelBase: 'ADMIN' },
      { id: 'cmnnhyynz00asjcbk223atktx', nome: 'Ricardo Ferreira', email: 'riveras189@gmail.com', login: 'ricardo', senhaHash: '$2b$10$pXgLA/gPqVFU3Yf4UvnSYOYd3DIusYEai5J3bpPQjFrVc3LNTUFNu', papelBase: 'ADMIN', profissionalId: 'cmnnhyye5008hjcbkm4trmqv8' },
    ];
    for (const u of usuarios) {
      await prisma.usuario.upsert({
        where: { id: u.id },
        update: {},
        create: { ...u, empresaId: 'cmnnhyxmc0000jcbkj1apv5oa', ativo: true, createdAt: new Date('2026-04-06T18:01:50.581'), updatedAt: new Date('2026-04-06T18:01:50.591') }
      });
    }
    console.log('Usuários criados');

    // Clientes
    console.log('Criando clientes...');
    const clientesData = [
      { id: 'cmnnhyxn70002jcbkwducensl', nome: 'Consumidor', telefone: '(17) 12456-4654', whatsapp: '(17) 12456-4654' },
      { id: 'cmnnhyxnc0003jcbkc4gcd6rk', nome: 'Niceia', telefone: '(17) 00000-0000', whatsapp: '(17) 00000-0000' },
      { id: 'cmnnhyxnk0004jcbkn3foec1m', nome: 'Ivanildo', telefone: '(17) 98822-2090', whatsapp: '(17) 98822-2090' },
      { id: 'cmnnhyxno0005jcbkkz3ugmrg', nome: 'Renan (vidraçaria)', telefone: '(17) 98209-1115', whatsapp: '(17) 98209-1115' },
      { id: 'cmnnhyxns0006jcbkju8vtolm', nome: 'Anderson (Filho Luzinete)', telefone: '(17) 98119-1042', whatsapp: '(17) 98119-1042' },
      { id: 'cmnnhyxnx0007jcbkoqpc6vbw', nome: 'Luzinete', telefone: '(17) 98118-9934', whatsapp: '(17) 98118-9934' },
      { id: 'cmnnhyxo20008jcbkv66aatfc', nome: 'Sandra (prima melissa)', telefone: '(17) 99119-1188', whatsapp: '(17) 99119-1188' },
      { id: 'cmnnhyxo60009jcbknem25ftp', nome: 'Edvaldo Pereira', telefone: '(12) 99173-1746', whatsapp: '(12) 99173-1746' },
    ];
    for (const c of clientesData) {
      await prisma.cliente.upsert({
        where: { id: c.id },
        update: {},
        create: { ...c, empresaId: 'cmnnhyxmc0000jcbkj1apv5oa', ativo: true, origemCadastro: 'MIGRACAO', createdAt: new Date('2026-04-06T18:01:49.267'), updatedAt: new Date('2026-04-06T18:01:49.267') }
      });
    }
    console.log('Clientes criados');

    // Serviços
    console.log('Criando serviços...');
    const servicosData = [
      { id: 'cmnnhyyam0078jcbksp8p4iqp', nome: 'Corte Masculino', duracaoMin: 30, preco: 40.00 },
      { id: 'cmnnhyyas0079jcbka09r18xt', nome: 'Corte Feminino', duracaoMin: 30, preco: 50.00 },
      { id: 'cmnnhyyau007ajcbkz7dokpev', nome: 'Cabelo e Barba', duracaoMin: 45, preco: 70.00 },
      { id: 'cmnnhyyax007bjcbkumpmo5sk', nome: 'Escova Curta', duracaoMin: 30, preco: 30.00 },
      { id: 'cmnnhyyb0007cjcbksprck52v', nome: 'Escova Media', duracaoMin: 30, preco: 40.00 },
      { id: 'cmnnhyyb4007djcbkurjcewjy', nome: 'Barba', duracaoMin: 15, preco: 30.00 },
      { id: 'cmnnhyyb7007ejcbkiqmjty2o', nome: 'Pé e Mão', duracaoMin: 60, preco: 60.00 },
      { id: 'cmnnhyyba007fjcbkrizdk6sa', nome: 'Pé', duracaoMin: 30, preco: 30.00 },
      { id: 'cmnnhyybc007gjcbknnhhha9e', nome: 'Mão', duracaoMin: 30, preco: 30.00 },
      { id: 'cmnnhyybf007hjcbkt75dad9m', nome: 'Escova Longa', duracaoMin: 30, preco: 60.00 },
      { id: 'cmnnhyybm007jjcbkvzmc23z3', nome: 'Escova Progressiva Média', duracaoMin: 45, preco: 80.00 },
      { id: 'cmnnhyybp007kjcbkq6zz6ccb', nome: 'Raspado', duracaoMin: 15, preco: 25.00 },
    ];
    for (const s of servicosData) {
      await prisma.servico.upsert({
        where: { id: s.id },
        update: {},
        create: { ...s, empresaId: 'cmnnhyxmc0000jcbkj1apv5oa', ativo: true, exibirNoSite: true, comissaoPercentualPadrao: 0, createdAt: new Date('2026-04-06T18:01:50.110'), updatedAt: new Date('2026-04-06T18:01:50.110') }
      });
    }
    console.log('Serviços criados');

    // Produtos
    console.log('Criando produtos...');
    const produtosData = [
      { id: 'cmnnhyykn00anjcbkll5dspyh', nome: 'Perfume vera', unidade: 'UN', estoqueAtual: 50, preco: 15.00 },
      { id: 'cmnnhyyks00aojcbkql4xlmqx', nome: 'Gel Cola', unidade: 'UN', estoqueAtual: 50, preco: 20.00 },
    ];
    for (const p of produtosData) {
      await prisma.produto.upsert({
        where: { id: p.id },
        update: {},
        create: { ...p, empresaId: 'cmnnhyxmc0000jcbkj1apv5oa', estoqueMinimo: 0, ativo: true, custo: 0, comissao: 0, createdAt: new Date('2026-04-06T18:01:50.471'), updatedAt: new Date('2026-04-06T18:01:50.476') }
      });
    }
    console.log('Produtos criados');

    console.log('\n=== Importação concluída com sucesso! ===');
    console.log('Empresa ID: cmnnhyxmc0000jcbkj1apv5oa');
    console.log('Logins disponíveis: admin, ricardo, victor, veraferreira9');

  } catch (error) {
    console.error('Erro durante importação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();