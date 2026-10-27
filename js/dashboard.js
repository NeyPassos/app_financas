// Funcionalidades em desenvolvimento.

/* ==========================================
   APP FINANÇAS - DASHBOARD
========================================== */

const elementoDashboard = id =>
  document.getElementById(id);


/* ==========================================
   CONFIGURAÇÕES DA PAGINAÇÃO
========================================== */

const ITENS_POR_PAGINA_DASHBOARD = 10;

let comprasDashboard = [];

let paginaAtualDashboard = 1;


/* ==========================================
   CARREGAR DASHBOARD
========================================== */

async function carregarDashboard() {

    try {

        mostrarStatus("Carregando parcelamentos...");

        const resposta =
            await apiListarParcelamentosDashboard();

        comprasDashboard = Array.isArray(resposta.dados)
            ? resposta.dados
            : [];

        comprasDashboard.sort((a, b) => {

            const restantesA =
                Number(a.total_parcelas) -
                Number(a.parcela_atual);

            const restantesB =
                Number(b.total_parcelas) -
                Number(b.parcela_atual);

            return restantesA - restantesB;

        });

        paginaAtualDashboard = 1;

        renderizarDashboard();

        mostrarStatus(
            comprasDashboard.length +
            " compra(s) parcelada(s) encontrada(s)."
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar Dashboard:",
            erro
        );

        mostrarStatus(
            "Erro ao carregar Dashboard: " +
            erro.message
        );

    }

}


/* ==========================================
   RENDERIZAR DASHBOARD COM PAGINAÇÃO
========================================== */

function renderizarDashboard() {

    const tabela = elementoDashboard(
    "listaParcelamentos"
);

if (!tabela) {
    console.error(
        "Tabela listaParcelamentos não encontrada."
    );
    return;
}

tabela.replaceChildren();

    tabela.replaceChildren();

    const total = comprasDashboard.length;

    const totalPaginas = Math.max(
        1,
        Math.ceil(total / ITENS_POR_PAGINA_DASHBOARD)
    );

    paginaAtualDashboard = Math.max(
        1,
        Math.min(paginaAtualDashboard, totalPaginas)
    );

    const inicio =
        (paginaAtualDashboard - 1) *
        ITENS_POR_PAGINA_DASHBOARD;

    const itens = comprasDashboard.slice(
        inicio,
        inicio + ITENS_POR_PAGINA_DASHBOARD
    );

    /* ======================================
       LISTAR COMPRAS
    ====================================== */

    itens.forEach(compra => {

        const linha = tabela.insertRow();

        const cartao = String(
            compra.cartao || ""
        ).trim();

        const banco = cartao
            .split(/\s+-\s+/)[0]
            .trim();

        let descricao = String(
            compra.descricao || ""
        ).trim();

       
        /* ==================================
           LIMPAR DESCRIÇÃO
        ================================== */

        descricao = descricao.replace(
            /\s*[-–]?\s*parcela\s*\d+\s*\/\s*\d+\s*$/i,
            ""
        ).trim();

        
        /* ==================================
        PARCELA ATUAL E RESTANTES
        ================================== */

        const parcelaAtual = Number(
            compra.parcela_atual || 0
        );

        const totalParcelas = Number(
            compra.total_parcelas || 0
        );

        /* Calcular parcelas restantes */
        const restantes = Math.max(
            0,
            totalParcelas - parcelaAtual
        );

        /* Exibir parcela atual / total */
        const parcelas =
            `${parcelaAtual}/${totalParcelas}`;


        /* ==================================
           CRIAR AS QUATRO COLUNAS
        ================================== */

        const valores = [
            banco,
            descricao,
            parcelas,
            restantes
        ];

        valores.forEach(valor => {

            const coluna = linha.insertCell();

            coluna.textContent = valor;

        });

    });
 
    
    /* ======================================
       LISTA VAZIA
    ====================================== */

    if (!itens.length) {

        const linha = tabela.insertRow();

        const coluna = linha.insertCell();

        coluna.colSpan = 4;

        coluna.textContent =
            "Nenhuma compra parcelada encontrada.";

    }

    /* ======================================
       INFORMAÇÕES DA PAGINAÇÃO
    ====================================== */

    const primeiroRegistro = total
        ? inicio + 1
        : 0;

    const ultimoRegistro = Math.min(
        inicio + ITENS_POR_PAGINA_DASHBOARD,
        total
    );

    elementoDashboard(
        "infoPaginaDashboard"
    ).textContent =
        `${primeiroRegistro}–${ultimoRegistro} de ${total} registros`;

    elementoDashboard(
        "numeroPaginaDashboard"
    ).textContent =
        `Página ${paginaAtualDashboard} de ${totalPaginas}`;

    elementoDashboard(
        "paginaAnteriorDashboard"
    ).disabled =
        paginaAtualDashboard <= 1;

    elementoDashboard(
        "paginaProximaDashboard"
    ).disabled =
        paginaAtualDashboard >= totalPaginas;

}


/* ==========================================
   INICIALIZAR DASHBOARD
========================================== */

window.addEventListener("load", () => {

  const btnLogin = elementoDashboard("btnLogin");
  const btnSair = elementoDashboard("btnSair");

  btnLogin?.addEventListener(
    "click",
    entrarGoogle
  );

  btnSair?.addEventListener(
    "click",
    sairGoogle
  );

  
/* ==========================================
   BOTÃO PÁGINA ANTERIOR
========================================== */

elementoDashboard(
    "paginaAnteriorDashboard"
)?.addEventListener("click", () => {

    if (paginaAtualDashboard > 1) {

        paginaAtualDashboard--;

        renderizarDashboard();

    }

});


/* ==========================================
   BOTÃO PRÓXIMA PÁGINA
========================================== */

elementoDashboard(
    "paginaProximaDashboard"
)?.addEventListener("click", () => {

    const totalPaginas = Math.ceil(
        comprasDashboard.length /
        ITENS_POR_PAGINA_DASHBOARD
    );

    if (paginaAtualDashboard < totalPaginas) {

        paginaAtualDashboard++;

        renderizarDashboard();

    }

});


  try {

    iniciarAutenticacao();

  } catch (erro) {

    console.error(erro);
    mostrarStatus(erro.message);

  }

});

