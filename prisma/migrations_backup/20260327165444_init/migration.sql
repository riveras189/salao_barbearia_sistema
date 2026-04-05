-- CreateEnum
CREATE TYPE "TipoArquivo" AS ENUM ('LOGO', 'CLIENTE_FOTO', 'PROFISSIONAL_FOTO', 'PRODUTO_FOTO', 'CERTIFICACAO', 'GALERIA_SITE', 'DOCUMENTO', 'BANNER', 'SERVICO_IMAGEM');

-- CreateEnum
CREATE TYPE "PapelBaseUsuario" AS ENUM ('ADMIN', 'GERENTE', 'PROFISSIONAL', 'RECEPCIONISTA');

-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'CANCELADO', 'FALTOU');

-- CreateEnum
CREATE TYPE "OrigemAgendamento" AS ENUM ('INTERNO', 'SITE', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "StatusComanda" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'FECHADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoComandaItem" AS ENUM ('SERVICO', 'PRODUTO');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'MISTO', 'FIADO');

-- CreateEnum
CREATE TYPE "TipoMovimentacaoEstoque" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE', 'CONSUMO_COMANDA', 'PERDA');

-- CreateEnum
CREATE TYPE "OrigemMovimentacaoEstoque" AS ENUM ('MANUAL', 'COMPRA', 'COMANDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "TipoBloqueioAgenda" AS ENUM ('ALMOCO', 'FOLGA', 'MEDICO', 'MANUTENCAO', 'AUSENCIA', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoAlertaCliente" AS ENUM ('ANIVERSARIO', 'INADIMPLENTE', 'RESTRICAO', 'PREFERENCIA');

-- CreateEnum
CREATE TYPE "StatusConta" AS ENUM ('ABERTA', 'PARCIAL', 'PAGA', 'VENCIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoCaixaMovimento" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "CategoriaCaixaMovimento" AS ENUM ('COMANDA', 'DESPESA', 'SANGRIA', 'SUPRIMENTO', 'ESTORNO', 'RECEBIMENTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoProfissionalDocumento" AS ENUM ('CERTIFICACAO', 'CONTRATO', 'DOCUMENTO');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "razaoSocial" TEXT,
    "nomeFantasia" TEXT,
    "cnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "cep" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "descricaoPublica" TEXT,
    "missao" TEXT,
    "valores" TEXT,
    "horarioFuncionamento" JSONB,
    "corPrimaria" TEXT,
    "corSecundaria" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "logoFileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpresaConfiguracao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "intervaloAgendaMin" INTEGER NOT NULL DEFAULT 30,
    "diasAntecedenciaAgendamentoOnline" INTEGER NOT NULL DEFAULT 30,
    "exigeSinalAgendamento" BOOLEAN NOT NULL DEFAULT false,
    "percentualSinal" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "permiteEncaixe" BOOLEAN NOT NULL DEFAULT true,
    "notificacaoWhatsappAtiva" BOOLEAN NOT NULL DEFAULT false,
    "notificacaoEmailAtiva" BOOLEAN NOT NULL DEFAULT false,
    "politicaCancelamento" TEXT,
    "tema" TEXT,
    "sitePublicado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmpresaConfiguracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendamentoOnlineConfig" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "antecedenciaMinHoras" INTEGER NOT NULL DEFAULT 2,
    "antecedenciaMaxDias" INTEGER NOT NULL DEFAULT 30,
    "exigeConfirmacao" BOOLEAN NOT NULL DEFAULT true,
    "exigeSinal" BOOLEAN NOT NULL DEFAULT false,
    "percentualSinal" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgendamentoOnlineConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Arquivo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT,
    "nomeOriginal" TEXT NOT NULL,
    "nomeInterno" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "categoria" "TipoArquivo" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Arquivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "login" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papelBase" "PapelBaseUsuario" NOT NULL,
    "profissionalId" TEXT,
    "funcionarioId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoLoginEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permissao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioPermissao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "permissaoId" TEXT NOT NULL,
    "permitido" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UsuarioPermissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginLog" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "sucesso" BOOLEAN NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "fotoFileId" TEXT,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "email" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "cep" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "observacoes" TEXT,
    "origemCadastro" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteTag" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClienteTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteTagItem" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ClienteTagItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteAlerta" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" "TipoAlertaCliente" NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClienteAlerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profissional" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "fotoFileId" TEXT,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "cnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "cep" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "dataAdmissao" TIMESTAMP(3),
    "dataDemissao" TIMESTAMP(3),
    "observacoes" TEXT,
    "corAgenda" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profissional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfissionalHorario" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "intervaloInicio" TEXT,
    "intervaloFim" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProfissionalHorario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfissionalServico" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "comissaoPercentualOverride" DECIMAL(5,2),
    "valorOverride" DECIMAL(12,2),
    "duracaoMinOverride" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProfissionalServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfissionalDocumento" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "arquivoId" TEXT NOT NULL,
    "tipo" "TipoProfissionalDocumento" NOT NULL,
    "descricao" TEXT,
    "validadeEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfissionalDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funcionario" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "cep" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "dataAdmissao" TIMESTAMP(3),
    "dataDemissao" TIMESTAMP(3),
    "cargo" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicoCategoria" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordemExibicao" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServicoCategoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servico" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "categoriaId" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "duracaoMin" INTEGER NOT NULL,
    "preco" DECIMAL(12,2) NOT NULL,
    "comissaoPercentualPadrao" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "exibirNoSite" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicoImagem" (
    "id" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "arquivoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ServicoImagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdutoCategoria" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "ProdutoCategoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "contato" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "fotoFileId" TEXT,
    "categoriaId" TEXT,
    "fornecedorId" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "sku" TEXT,
    "codigoBarras" TEXT,
    "unidade" TEXT DEFAULT 'UN',
    "estoqueAtual" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "estoqueMinimo" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "valorCusto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valorVenda" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstoqueMovimentacao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "tipo" "TipoMovimentacaoEstoque" NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "valorUnitario" DECIMAL(12,2),
    "valorTotal" DECIMAL(12,2),
    "motivo" TEXT,
    "origemTipo" "OrigemMovimentacaoEstoque" NOT NULL,
    "origemId" TEXT,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstoqueMovimentacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'AGENDADO',
    "origem" "OrigemAgendamento" NOT NULL DEFAULT 'INTERNO',
    "observacoes" TEXT,
    "encaixe" BOOLEAN NOT NULL DEFAULT false,
    "comandaId" TEXT,
    "criadoPorUsuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendamentoServico" (
    "id" TEXT NOT NULL,
    "agendamentoId" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "nomeSnapshot" TEXT NOT NULL,
    "duracaoMinSnapshot" INTEGER NOT NULL,
    "valorSnapshot" DECIMAL(12,2) NOT NULL,
    "comissaoPercentualSnapshot" DECIMAL(5,2) NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AgendamentoServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloqueioAgenda" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoBloqueioAgenda" NOT NULL,
    "descricao" TEXT,
    "cor" TEXT,
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BloqueioAgenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListaEspera" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "servicoId" TEXT,
    "profissionalPreferidoId" TEXT,
    "dataPreferida" TIMESTAMP(3),
    "periodoPreferido" TEXT,
    "observacoes" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListaEspera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comanda" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "numeroSequencial" INTEGER NOT NULL,
    "clienteId" TEXT,
    "profissionalPrincipalId" TEXT,
    "agendamentoId" TEXT,
    "status" "StatusComanda" NOT NULL DEFAULT 'ABERTA',
    "subtotalServicos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotalProdutos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "descontoValor" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "acrescimoValor" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "abertaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechadaEm" TIMESTAMP(3),
    "abertaPorUsuarioId" TEXT,
    "fechadaPorUsuarioId" TEXT,

    CONSTRAINT "Comanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComandaItem" (
    "id" TEXT NOT NULL,
    "comandaId" TEXT NOT NULL,
    "tipo" "TipoComandaItem" NOT NULL,
    "servicoId" TEXT,
    "produtoId" TEXT,
    "profissionalId" TEXT,
    "descricao" TEXT NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "valorUnitario" DECIMAL(12,2) NOT NULL,
    "valorTotal" DECIMAL(12,2) NOT NULL,
    "custoUnitario" DECIMAL(12,2),
    "comissaoPercentual" DECIMAL(5,2),
    "valorComissao" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComandaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComandaPagamento" (
    "id" TEXT NOT NULL,
    "comandaId" TEXT NOT NULL,
    "metodo" "FormaPagamento" NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "observacoes" TEXT,
    "transacaoExternaId" TEXT,
    "pagoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recebidoPorUsuarioId" TEXT,

    CONSTRAINT "ComandaPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recibo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "comandaId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "urlPdf" TEXT,
    "enviadoWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "enviadoEmail" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recibo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaixaMovimento" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" "TipoCaixaMovimento" NOT NULL,
    "categoria" "CategoriaCaixaMovimento" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "formaPagamento" "FormaPagamento",
    "referenciaTipo" TEXT,
    "referenciaId" TEXT,
    "usuarioId" TEXT,
    "dataMovimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaixaMovimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaReceber" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT,
    "descricao" TEXT NOT NULL,
    "valorOriginal" DECIMAL(12,2) NOT NULL,
    "valorAberto" DECIMAL(12,2) NOT NULL,
    "vencimento" TIMESTAMP(3),
    "status" "StatusConta" NOT NULL DEFAULT 'ABERTA',
    "origemTipo" TEXT,
    "origemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContaReceber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaReceberPagamento" (
    "id" TEXT NOT NULL,
    "contaReceberId" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "metodo" "FormaPagamento" NOT NULL,
    "pagoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT,

    CONSTRAINT "ContaReceberPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaPagar" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "fornecedorId" TEXT,
    "descricao" TEXT NOT NULL,
    "valorOriginal" DECIMAL(12,2) NOT NULL,
    "valorAberto" DECIMAL(12,2) NOT NULL,
    "vencimento" TIMESTAMP(3),
    "status" "StatusConta" NOT NULL DEFAULT 'ABERTA',
    "categoria" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContaPagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaPagarPagamento" (
    "id" TEXT NOT NULL,
    "contaPagarId" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "pagoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodo" "FormaPagamento",
    "usuarioId" TEXT,

    CONSTRAINT "ContaPagarPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaginaSite" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudoJson" JSONB NOT NULL,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaginaSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BannerSite" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "titulo" TEXT,
    "subtitulo" TEXT,
    "arquivoId" TEXT NOT NULL,
    "link" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BannerSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GaleriaItem" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "titulo" TEXT,
    "descricao" TEXT,
    "arquivoId" TEXT NOT NULL,
    "categoria" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GaleriaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Depoimento" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nomeCliente" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Depoimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT,
    "profissionalId" TEXT,
    "comandaId" TEXT,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaLog" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "dadosAntes" JSONB,
    "dadosDepois" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Empresa_ativo_idx" ON "Empresa"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "EmpresaConfiguracao_empresaId_key" ON "EmpresaConfiguracao"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "AgendamentoOnlineConfig_empresaId_key" ON "AgendamentoOnlineConfig"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_profissionalId_key" ON "Usuario"("profissionalId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_funcionarioId_key" ON "Usuario"("funcionarioId");

-- CreateIndex
CREATE INDEX "Usuario_empresaId_ativo_idx" ON "Usuario"("empresaId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_empresaId_login_key" ON "Usuario"("empresaId", "login");

-- CreateIndex
CREATE INDEX "Permissao_empresaId_modulo_idx" ON "Permissao"("empresaId", "modulo");

-- CreateIndex
CREATE UNIQUE INDEX "Permissao_empresaId_codigo_key" ON "Permissao"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioPermissao_usuarioId_permissaoId_key" ON "UsuarioPermissao"("usuarioId", "permissaoId");

-- CreateIndex
CREATE INDEX "LoginLog_empresaId_createdAt_idx" ON "LoginLog"("empresaId", "createdAt");

-- CreateIndex
CREATE INDEX "Cliente_empresaId_nome_idx" ON "Cliente"("empresaId", "nome");

-- CreateIndex
CREATE INDEX "Cliente_empresaId_telefone_idx" ON "Cliente"("empresaId", "telefone");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_empresaId_cpf_key" ON "Cliente"("empresaId", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteTag_empresaId_nome_key" ON "ClienteTag"("empresaId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteTagItem_clienteId_tagId_key" ON "ClienteTagItem"("clienteId", "tagId");

-- CreateIndex
CREATE INDEX "ClienteAlerta_clienteId_ativo_idx" ON "ClienteAlerta"("clienteId", "ativo");

-- CreateIndex
CREATE INDEX "Profissional_empresaId_nome_idx" ON "Profissional"("empresaId", "nome");

-- CreateIndex
CREATE INDEX "Profissional_empresaId_ativo_idx" ON "Profissional"("empresaId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "Profissional_empresaId_cpf_key" ON "Profissional"("empresaId", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Profissional_empresaId_cnpj_key" ON "Profissional"("empresaId", "cnpj");

-- CreateIndex
CREATE INDEX "ProfissionalHorario_profissionalId_diaSemana_ativo_idx" ON "ProfissionalHorario"("profissionalId", "diaSemana", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "ProfissionalServico_profissionalId_servicoId_key" ON "ProfissionalServico"("profissionalId", "servicoId");

-- CreateIndex
CREATE INDEX "Funcionario_empresaId_nome_idx" ON "Funcionario"("empresaId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_empresaId_cpf_key" ON "Funcionario"("empresaId", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "ServicoCategoria_empresaId_nome_key" ON "ServicoCategoria"("empresaId", "nome");

-- CreateIndex
CREATE INDEX "Servico_empresaId_nome_idx" ON "Servico"("empresaId", "nome");

-- CreateIndex
CREATE INDEX "Servico_empresaId_ativo_idx" ON "Servico"("empresaId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "ProdutoCategoria_empresaId_nome_key" ON "ProdutoCategoria"("empresaId", "nome");

-- CreateIndex
CREATE INDEX "Fornecedor_empresaId_nome_idx" ON "Fornecedor"("empresaId", "nome");

-- CreateIndex
CREATE INDEX "Produto_empresaId_nome_idx" ON "Produto"("empresaId", "nome");

-- CreateIndex
CREATE INDEX "Produto_empresaId_ativo_idx" ON "Produto"("empresaId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_empresaId_sku_key" ON "Produto"("empresaId", "sku");

-- CreateIndex
CREATE INDEX "EstoqueMovimentacao_empresaId_createdAt_idx" ON "EstoqueMovimentacao"("empresaId", "createdAt");

-- CreateIndex
CREATE INDEX "EstoqueMovimentacao_produtoId_createdAt_idx" ON "EstoqueMovimentacao"("produtoId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Agendamento_comandaId_key" ON "Agendamento"("comandaId");

-- CreateIndex
CREATE INDEX "Agendamento_empresaId_inicio_idx" ON "Agendamento"("empresaId", "inicio");

-- CreateIndex
CREATE INDEX "Agendamento_profissionalId_inicio_fim_idx" ON "Agendamento"("profissionalId", "inicio", "fim");

-- CreateIndex
CREATE INDEX "Agendamento_clienteId_inicio_idx" ON "Agendamento"("clienteId", "inicio");

-- CreateIndex
CREATE INDEX "AgendamentoServico_agendamentoId_ordem_idx" ON "AgendamentoServico"("agendamentoId", "ordem");

-- CreateIndex
CREATE INDEX "BloqueioAgenda_profissionalId_dataInicio_dataFim_idx" ON "BloqueioAgenda"("profissionalId", "dataInicio", "dataFim");

-- CreateIndex
CREATE INDEX "ListaEspera_empresaId_dataPreferida_idx" ON "ListaEspera"("empresaId", "dataPreferida");

-- CreateIndex
CREATE UNIQUE INDEX "Comanda_agendamentoId_key" ON "Comanda"("agendamentoId");

-- CreateIndex
CREATE INDEX "Comanda_empresaId_status_idx" ON "Comanda"("empresaId", "status");

-- CreateIndex
CREATE INDEX "Comanda_clienteId_idx" ON "Comanda"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Comanda_empresaId_numeroSequencial_key" ON "Comanda"("empresaId", "numeroSequencial");

-- CreateIndex
CREATE INDEX "ComandaItem_comandaId_idx" ON "ComandaItem"("comandaId");

-- CreateIndex
CREATE INDEX "ComandaItem_servicoId_idx" ON "ComandaItem"("servicoId");

-- CreateIndex
CREATE INDEX "ComandaItem_produtoId_idx" ON "ComandaItem"("produtoId");

-- CreateIndex
CREATE INDEX "ComandaPagamento_comandaId_pagoEm_idx" ON "ComandaPagamento"("comandaId", "pagoEm");

-- CreateIndex
CREATE UNIQUE INDEX "Recibo_empresaId_numero_key" ON "Recibo"("empresaId", "numero");

-- CreateIndex
CREATE INDEX "CaixaMovimento_empresaId_dataMovimento_idx" ON "CaixaMovimento"("empresaId", "dataMovimento");

-- CreateIndex
CREATE INDEX "CaixaMovimento_referenciaTipo_referenciaId_idx" ON "CaixaMovimento"("referenciaTipo", "referenciaId");

-- CreateIndex
CREATE INDEX "ContaReceber_empresaId_status_vencimento_idx" ON "ContaReceber"("empresaId", "status", "vencimento");

-- CreateIndex
CREATE INDEX "ContaReceberPagamento_contaReceberId_pagoEm_idx" ON "ContaReceberPagamento"("contaReceberId", "pagoEm");

-- CreateIndex
CREATE INDEX "ContaPagar_empresaId_status_vencimento_idx" ON "ContaPagar"("empresaId", "status", "vencimento");

-- CreateIndex
CREATE INDEX "ContaPagarPagamento_contaPagarId_pagoEm_idx" ON "ContaPagarPagamento"("contaPagarId", "pagoEm");

-- CreateIndex
CREATE UNIQUE INDEX "PaginaSite_empresaId_slug_key" ON "PaginaSite"("empresaId", "slug");

-- CreateIndex
CREATE INDEX "BannerSite_empresaId_ordem_ativo_idx" ON "BannerSite"("empresaId", "ordem", "ativo");

-- CreateIndex
CREATE INDEX "GaleriaItem_empresaId_ordem_ativo_idx" ON "GaleriaItem"("empresaId", "ordem", "ativo");

-- CreateIndex
CREATE INDEX "Depoimento_empresaId_ordem_ativo_idx" ON "Depoimento"("empresaId", "ordem", "ativo");

-- CreateIndex
CREATE INDEX "Avaliacao_empresaId_nota_idx" ON "Avaliacao"("empresaId", "nota");

-- CreateIndex
CREATE INDEX "AuditoriaLog_empresaId_entidade_entidadeId_idx" ON "AuditoriaLog"("empresaId", "entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "AuditoriaLog_empresaId_createdAt_idx" ON "AuditoriaLog"("empresaId", "createdAt");

-- AddForeignKey
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_logoFileId_fkey" FOREIGN KEY ("logoFileId") REFERENCES "Arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpresaConfiguracao" ADD CONSTRAINT "EmpresaConfiguracao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendamentoOnlineConfig" ADD CONSTRAINT "AgendamentoOnlineConfig_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arquivo" ADD CONSTRAINT "Arquivo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permissao" ADD CONSTRAINT "Permissao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioPermissao" ADD CONSTRAINT "UsuarioPermissao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioPermissao" ADD CONSTRAINT "UsuarioPermissao_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "Permissao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginLog" ADD CONSTRAINT "LoginLog_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginLog" ADD CONSTRAINT "LoginLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_fotoFileId_fkey" FOREIGN KEY ("fotoFileId") REFERENCES "Arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteTag" ADD CONSTRAINT "ClienteTag_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteTagItem" ADD CONSTRAINT "ClienteTagItem_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteTagItem" ADD CONSTRAINT "ClienteTagItem_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ClienteTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteAlerta" ADD CONSTRAINT "ClienteAlerta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profissional" ADD CONSTRAINT "Profissional_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profissional" ADD CONSTRAINT "Profissional_fotoFileId_fkey" FOREIGN KEY ("fotoFileId") REFERENCES "Arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfissionalHorario" ADD CONSTRAINT "ProfissionalHorario_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfissionalServico" ADD CONSTRAINT "ProfissionalServico_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfissionalServico" ADD CONSTRAINT "ProfissionalServico_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfissionalDocumento" ADD CONSTRAINT "ProfissionalDocumento_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfissionalDocumento" ADD CONSTRAINT "ProfissionalDocumento_arquivoId_fkey" FOREIGN KEY ("arquivoId") REFERENCES "Arquivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicoCategoria" ADD CONSTRAINT "ServicoCategoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "ServicoCategoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicoImagem" ADD CONSTRAINT "ServicoImagem_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicoImagem" ADD CONSTRAINT "ServicoImagem_arquivoId_fkey" FOREIGN KEY ("arquivoId") REFERENCES "Arquivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoCategoria" ADD CONSTRAINT "ProdutoCategoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fornecedor" ADD CONSTRAINT "Fornecedor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_fotoFileId_fkey" FOREIGN KEY ("fotoFileId") REFERENCES "Arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "ProdutoCategoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimentacao" ADD CONSTRAINT "EstoqueMovimentacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimentacao" ADD CONSTRAINT "EstoqueMovimentacao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimentacao" ADD CONSTRAINT "EstoqueMovimentacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_criadoPorUsuarioId_fkey" FOREIGN KEY ("criadoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "Comanda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendamentoServico" ADD CONSTRAINT "AgendamentoServico_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendamentoServico" ADD CONSTRAINT "AgendamentoServico_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloqueioAgenda" ADD CONSTRAINT "BloqueioAgenda_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloqueioAgenda" ADD CONSTRAINT "BloqueioAgenda_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaEspera" ADD CONSTRAINT "ListaEspera_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaEspera" ADD CONSTRAINT "ListaEspera_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaEspera" ADD CONSTRAINT "ListaEspera_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaEspera" ADD CONSTRAINT "ListaEspera_profissionalPreferidoId_fkey" FOREIGN KEY ("profissionalPreferidoId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comanda" ADD CONSTRAINT "Comanda_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comanda" ADD CONSTRAINT "Comanda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comanda" ADD CONSTRAINT "Comanda_profissionalPrincipalId_fkey" FOREIGN KEY ("profissionalPrincipalId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comanda" ADD CONSTRAINT "Comanda_abertaPorUsuarioId_fkey" FOREIGN KEY ("abertaPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comanda" ADD CONSTRAINT "Comanda_fechadaPorUsuarioId_fkey" FOREIGN KEY ("fechadaPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComandaItem" ADD CONSTRAINT "ComandaItem_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "Comanda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComandaItem" ADD CONSTRAINT "ComandaItem_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComandaItem" ADD CONSTRAINT "ComandaItem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComandaItem" ADD CONSTRAINT "ComandaItem_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComandaPagamento" ADD CONSTRAINT "ComandaPagamento_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "Comanda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComandaPagamento" ADD CONSTRAINT "ComandaPagamento_recebidoPorUsuarioId_fkey" FOREIGN KEY ("recebidoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "Comanda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaixaMovimento" ADD CONSTRAINT "CaixaMovimento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaixaMovimento" ADD CONSTRAINT "CaixaMovimento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaReceber" ADD CONSTRAINT "ContaReceber_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaReceber" ADD CONSTRAINT "ContaReceber_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaReceberPagamento" ADD CONSTRAINT "ContaReceberPagamento_contaReceberId_fkey" FOREIGN KEY ("contaReceberId") REFERENCES "ContaReceber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaReceberPagamento" ADD CONSTRAINT "ContaReceberPagamento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaPagar" ADD CONSTRAINT "ContaPagar_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaPagar" ADD CONSTRAINT "ContaPagar_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaPagarPagamento" ADD CONSTRAINT "ContaPagarPagamento_contaPagarId_fkey" FOREIGN KEY ("contaPagarId") REFERENCES "ContaPagar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaPagarPagamento" ADD CONSTRAINT "ContaPagarPagamento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaginaSite" ADD CONSTRAINT "PaginaSite_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BannerSite" ADD CONSTRAINT "BannerSite_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BannerSite" ADD CONSTRAINT "BannerSite_arquivoId_fkey" FOREIGN KEY ("arquivoId") REFERENCES "Arquivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GaleriaItem" ADD CONSTRAINT "GaleriaItem_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GaleriaItem" ADD CONSTRAINT "GaleriaItem_arquivoId_fkey" FOREIGN KEY ("arquivoId") REFERENCES "Arquivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Depoimento" ADD CONSTRAINT "Depoimento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "Comanda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaLog" ADD CONSTRAINT "AuditoriaLog_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaLog" ADD CONSTRAINT "AuditoriaLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
