
/* ==========================================
   APP FINANÇAS - CONTAS A PAGAR

   Utiliza:
   - config.js
   - auth.js
   - api.js
========================================== */


/* ==========================================
   CONFIGURAÇÕES E VARIÁVEIS
========================================== */

const MESES = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
];

const ITENS_POR_PAGINA = 10;

let contas = [];
let contasFiltradas = [];

let paginaAtual = 1;

let idEmEdicao = null;
let idParaExcluir = null;

let ocupado = false;


/* ==========================================
   FUNÇÕES AUXILIARES
========================================== */

const el = id => document.getElementById(id);

const moeda = valor =>
    Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });


function definirStatus(mensagem) {

    if (typeof mostrarStatus === "function") {

        mostrarStatus(mensagem);

    } else {

        const elemento = el("status");

        if (elemento) {
            elemento.textContent = mensagem;
        }

    }
}


function estaAutenticado() {

    try {

        return Boolean(obterToken());

    } catch {

        return false;

    }
}


function normalizar(texto) {

    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

}


function dataConta(conta) {

    const indice = MESES.findIndex(
        mes => normalizar(mes) === normalizar(conta.mes)
    );

    return (
        String(conta.dia).padStart(2, "0") +
        "/" +
        String(indice + 1).padStart(2, "0") +
        "/" +
        conta.ano
    );

}


function criarBotao(texto, classe, acao) {

    const botao = document.createElement("button");

    botao.type = "button";

    botao.className =
        "btn btn-pequeno " + classe;

    botao.textContent = texto;

    botao.addEventListener("click", acao);

    return botao;

}


/* ==========================================
   PREENCHER FILTROS
========================================== */

function popularFiltros() {

    const anos = [
        ...new Set(
            contas.map(conta => String(conta.ano))
        )
    ].sort((a, b) => Number(b) - Number(a));

    const filtroAno = el("filtroAno");

    const anoSelecionado = filtroAno.value;

    filtroAno.replaceChildren(
        new Option("Todos", "")
    );

    anos.forEach(ano => {

        filtroAno.add(
            new Option(ano, ano)
        );

    });

    filtroAno.value = anos.includes(anoSelecionado)
        ? anoSelecionado
        : "";


    const filtroMes = el("filtroMes");

    const mesSelecionado = filtroMes.value;

    filtroMes.replaceChildren(
        new Option("Todos", "")
    );

    MESES.forEach(mes => {

        filtroMes.add(
            new Option(mes, mes)
        );

    });

    filtroMes.value = mesSelecionado;

}


/* ==========================================
   APLICAR FILTROS
========================================== */

function aplicarFiltros() {

    const pesquisa = normalizar(
        el("pesquisa").value.trim()
    );

    const ano = el("filtroAno").value;
    const mes = el("filtroMes").value;
    const situacao = el("filtroSituacao").value;

    contasFiltradas = contas.filter(conta => {

        const correspondeAno =
            !ano ||
            String(conta.ano) === ano;

        const correspondeMes =
            !mes ||
            normalizar(conta.mes) === normalizar(mes);

        const correspondeSituacao =
            !situacao ||
            normalizar(conta.situacao || "Pendente") ===
            normalizar(situacao);

        const textoPesquisa = normalizar([
            conta.tipo_conta,
            conta.parcela,
            conta.situacao,
            conta.id_conta
        ].join(" "));

        const correspondePesquisa =
            !pesquisa ||
            textoPesquisa.includes(pesquisa);

        return (
            correspondeAno &&
            correspondeMes &&
            correspondeSituacao &&
            correspondePesquisa
        );

    });


    /* ======================================
       RESUMOS FINANCEIROS
    ====================================== */

    const soma = lista =>
        lista.reduce(
            (total, conta) =>
                total + Number(conta.valor || 0),
            0
        );

    const contasPendentes = contasFiltradas.filter(
        conta => normalizar(conta.situacao) !== "pago"
    );

    const contasPagas = contasFiltradas.filter(
        conta => normalizar(conta.situacao) === "pago"
    );

    el("resumoTotal").textContent =
        moeda(soma(contasFiltradas));

    el("resumoPendente").textContent =
        moeda(soma(contasPendentes));

    el("resumoPago").textContent =
        moeda(soma(contasPagas));

    el("resumoQuantidade").textContent =
        String(contasFiltradas.length);


    /* ======================================
       PAGINAÇÃO
    ====================================== */

    const totalPaginas = Math.max(
        1,
        Math.ceil(
            contasFiltradas.length / ITENS_POR_PAGINA
        )
    );

    paginaAtual = Math.min(
        paginaAtual,
        totalPaginas
    );

    renderizarTabela();

}


/* ==========================================
   RENDERIZAR TABELA
========================================== */

function renderizarTabela() {

    const tbody = el("listaContas");

    tbody.replaceChildren();

    const total = contasFiltradas.length;

    const inicio =
        (paginaAtual - 1) * ITENS_POR_PAGINA;

    const itens = contasFiltradas.slice(
        inicio,
        inicio + ITENS_POR_PAGINA
    );


    /* ======================================
       TABELA VAZIA
    ====================================== */

    if (!itens.length) {

        const linha = tbody.insertRow();

        const coluna = linha.insertCell();

        coluna.colSpan = 7;

        coluna.className = "vazio";

        coluna.textContent =
            "Nenhuma conta encontrada.";

    }


    /* ======================================
       LISTAR CONTAS
    ====================================== */

    for (const conta of itens) {

        const linha = tbody.insertRow();

        const valores = [
            conta.id_conta,
            dataConta(conta),
            conta.tipo_conta,
            conta.parcela || "—",
            moeda(conta.valor)
        ];

        valores.forEach(valor => {

            const coluna = linha.insertCell();

            coluna.textContent = valor;

        });


        /* ==================================
           SITUAÇÃO
        ================================== */

        const colunaSituacao = linha.insertCell();

        const etiqueta = document.createElement("span");

        const pago =
            normalizar(conta.situacao) === "pago";

        etiqueta.className =
            "situacao " +
            (pago ? "pago" : "pendente");

        etiqueta.textContent =
            pago ? "Pago" : "Pendente";

        colunaSituacao.appendChild(etiqueta);


        /* ==================================
           BOTÕES DE AÇÕES
        ================================== */

        const colunaAcoes = linha.insertCell();

        colunaAcoes.className = "acoes";


        // PAGAR
        if (!pago) {

            colunaAcoes.appendChild(
                criarBotao(
                    "Pagar",
                    "btn-pagar",
                    () => marcarPago(conta)
                )
            );

        }


        // EDITAR
        colunaAcoes.appendChild(
            criarBotao(
                "Editar",
                "btn-editar",
                () => abrirFormulario(conta)
            )
        );


        // EXCLUIR
        colunaAcoes.appendChild(
            criarBotao(
                "Excluir",
                "btn-excluir",
                () => abrirExclusao(conta)
            )
        );

    }


    /* ======================================
       CONTROLE DA PAGINAÇÃO
    ====================================== */

    el("infoPagina").textContent = total
        ? (
            inicio + 1 +
            "–" +
            Math.min(
                inicio + ITENS_POR_PAGINA,
                total
            ) +
            " de " +
            total +
            " registros"
        )
        : "0 registros";

    el("paginaAnterior").disabled =
        paginaAtual === 1;

    el("paginaProxima").disabled =
        paginaAtual >= Math.ceil(
            total / ITENS_POR_PAGINA
        );

}


/* ==========================================
   CARREGAR CONTAS
========================================== */

async function carregarContas() {

    if (!estaAutenticado()) {

        definirStatus(
            "Faça login com Google."
        );

        return;
    }

    try {

        definirStatus(
            "Carregando contas..."
        );

        const retorno = await apiListarContas();

        contas = Array.isArray(retorno.dados)
            ? retorno.dados
            : [];

        popularFiltros();

        aplicarFiltros();

        el("btnNova").disabled = false;

        definirStatus(
            contas.length +
            " conta(s) carregada(s)."
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar contas:",
            erro
        );

        definirStatus(
            "Erro ao carregar contas: " +
            erro.message
        );

    }

}


/* ==========================================
   ABRIR FORMULÁRIO
========================================== */

function abrirFormulario(conta = null) {

    idEmEdicao = conta
        ? conta.id_conta
        : null;

    el("tituloModal").textContent = conta
        ? "Editar conta"
        : "Nova conta";

    el("formConta").reset();

    const hoje = new Date();

    el("ano").value =
        conta?.ano ?? hoje.getFullYear();

    el("mes").value =
        conta?.mes ?? MESES[hoje.getMonth()];

    el("dia").value =
        conta?.dia ?? hoje.getDate();

    el("tipo_conta").value =
        conta?.tipo_conta ?? "";

    el("parcela").value =
        conta?.parcela ?? "";

    el("valor").value =
        conta?.valor ?? "";

    el("situacao").value =
        conta?.situacao === "Pago"
            ? "Pago"
            : "Pendente";

    el("modalConta").hidden = false;

    el("tipo_conta").focus();

}


/* ==========================================
   FECHAR FORMULÁRIO
========================================== */

function fecharFormulario() {

    el("modalConta").hidden = true;

    idEmEdicao = null;

}


/* ==========================================
   SALVAR CONTA
========================================== */

async function salvarFormulario(evento) {

    evento.preventDefault();

    if (ocupado) return;

    const dados = {

        ano: Number(el("ano").value),

        mes: el("mes").value,

        dia: Number(el("dia").value),

        tipo_conta:
            el("tipo_conta").value.trim(),

        parcela:
            el("parcela").value.trim(),

        valor:
            Number(el("valor").value),

        situacao:
            el("situacao").value

    };


    /* ======================================
       VALIDAÇÃO
    ====================================== */

    if (
        !dados.tipo_conta ||
        !Number.isFinite(dados.valor) ||
        dados.valor < 0
    ) {

        definirStatus(
            "Confira os dados da conta."
        );

        return;

    }


    if (idEmEdicao !== null) {

        dados.id_conta = idEmEdicao;

    }


    ocupado = true;

    el("salvarConta").disabled = true;


    try {

        const resposta = idEmEdicao !== null
            ? await apiEditarConta(dados)
            : await apiCadastrarConta(dados);

        fecharFormulario();

        await carregarContas();

        definirStatus(
            resposta.mensagem ||
            "Conta salva com sucesso."
        );

    } catch (erro) {

        console.error(
            "Erro ao salvar conta:",
            erro
        );

        definirStatus(
            "Erro ao salvar: " +
            erro.message
        );

    } finally {

        ocupado = false;

        el("salvarConta").disabled = false;

    }

}


/* ==========================================
   ABRIR EXCLUSÃO
========================================== */

function abrirExclusao(conta) {

    idParaExcluir = conta.id_conta;

    el("descricaoExcluir").textContent =
        'Deseja excluir definitivamente a conta "' +
        conta.tipo_conta +
        '" (ID ' +
        conta.id_conta +
        ")?";

    el("modalExcluir").hidden = false;

}


/* ==========================================
   FECHAR EXCLUSÃO
========================================== */

function fecharExclusao() {

    idParaExcluir = null;

    el("modalExcluir").hidden = true;

}


/* ==========================================
   CONFIRMAR EXCLUSÃO
========================================== */

async function confirmarExclusao() {

    if (
        ocupado ||
        idParaExcluir === null
    ) {
        return;
    }

    ocupado = true;

    el("confirmarExcluir").disabled = true;

    try {

        const resposta = await apiExcluirConta(
            idParaExcluir
        );

        fecharExclusao();

        await carregarContas();

        definirStatus(
            resposta.mensagem ||
            "Conta excluída."
        );

    } catch (erro) {

        console.error(
            "Erro ao excluir conta:",
            erro
        );

        definirStatus(
            "Erro ao excluir: " +
            erro.message
        );

    } finally {

        ocupado = false;

        el("confirmarExcluir").disabled = false;

    }

}


/* ==========================================
   MARCAR CONTA COMO PAGA
========================================== */

async function marcarPago(conta) {

    if (ocupado) return;

    const confirmado = window.confirm(
        'Marcar "' +
        conta.tipo_conta +
        '" como paga?'
    );

    if (!confirmado) return;

    ocupado = true;

    try {

        const resposta = await apiEditarConta({

            ...conta,

            situacao: "Pago"

        });

        await carregarContas();

        definirStatus(
            resposta.mensagem ||
            "Pagamento registrado."
        );

    } catch (erro) {

        console.error(
            "Erro ao marcar pagamento:",
            erro
        );

        definirStatus(
            "Erro ao marcar pagamento: " +
            erro.message
        );

    } finally {

        ocupado = false;

    }

}


/* ==========================================
   NAVEGAÇÃO ENTRE MÓDULOS
========================================== */

function abrirPaginaCartoes() {

    // Navegar sem executar logout.
    window.location.href = "cartao.html";

}


/* ==========================================
   INICIALIZAR PÁGINA
========================================== */

window.addEventListener("load", () => {

    /* ======================================
       PREENCHER MESES
    ====================================== */

    MESES.forEach(mes => {

        el("mes").add(
            new Option(mes, mes)
        );

    });


    /* ======================================
       AUTENTICAÇÃO GOOGLE
    ====================================== */

    el("btnLogin").addEventListener(
        "click",
        entrarGoogle
    );

    el("btnSair").addEventListener(
        "click",
        () => {

            sairGoogle();

            contas = [];

            el("btnNova").disabled = true;

            popularFiltros();

            aplicarFiltros();

        }
    );


    /* ======================================
       BOTÃO CARTÕES
    ====================================== */

    el("btnCartoes")?.addEventListener(
        "click",
        abrirPaginaCartoes
    );


    /* ======================================
       NOVA CONTA
    ====================================== */

    el("btnNova").addEventListener(
        "click",
        () => abrirFormulario()
    );


    /* ======================================
       MODAL DE CADASTRO
    ====================================== */

    el("fecharConta").addEventListener(
        "click",
        fecharFormulario
    );

    el("cancelarConta").addEventListener(
        "click",
        fecharFormulario
    );

    el("formConta").addEventListener(
        "submit",
        salvarFormulario
    );


    /* ======================================
       MODAL DE EXCLUSÃO
    ====================================== */

    el("cancelarExcluir").addEventListener(
        "click",
        fecharExclusao
    );

    el("confirmarExcluir").addEventListener(
        "click",
        confirmarExclusao
    );


    /* ======================================
       PESQUISA E FILTROS
    ====================================== */

    const filtros = [
        "pesquisa",
        "filtroAno",
        "filtroMes",
        "filtroSituacao"
    ];

    filtros.forEach(id => {

        el(id).addEventListener(
            id === "pesquisa"
                ? "input"
                : "change",
            () => {

                paginaAtual = 1;

                aplicarFiltros();

            }
        );

    });


    /* ======================================
       PAGINAÇÃO
    ====================================== */

    el("paginaAnterior").addEventListener(
        "click",
        () => {

            paginaAtual--;

            renderizarTabela();

        }
    );

    el("paginaProxima").addEventListener(
        "click",
        () => {

            paginaAtual++;

            renderizarTabela();

        }
    );


    /* ======================================
       INICIAR AUTENTICAÇÃO
    ====================================== */

    try {

        iniciarAutenticacao();

    } catch (erro) {

        console.error(
            "Erro ao iniciar autenticação:",
            erro
        );

        definirStatus(
            erro.message
        );

    }

});
