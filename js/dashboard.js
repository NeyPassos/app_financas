// Funcionalidades em desenvolvimento.

/* ==========================================
   APP FINANÇAS - DASHBOARD
========================================== */

const elementoDashboard = id =>
  document.getElementById(id);



/* ==========================================
   CARREGAR DASHBOARD
========================================== */

async function carregarDashboard() {

    const tabela = document.getElementById(
        "listaParcelamentos"
    );

    try {

        mostrarStatus("Carregando parcelamentos...");

        const resposta =
            await apiListarParcelamentosDashboard();

        const compras = Array.isArray(resposta.dados)
            ? resposta.dados
            : [];

        // Ordenar pela menor quantidade restante.
        compras.sort((a, b) =>
            Number(a.parcelas_restantes) -
            Number(b.parcelas_restantes)
        );

        tabela.replaceChildren();

        compras.forEach(compra => {

            const linha = tabela.insertRow();

            /* ==================================
               CARTÃO - SOMENTE BANCO
            ================================== */

            const cartao = String(
                compra.cartao || ""
            ).trim();

            const banco = cartao
                .split(/\s+-\s+/)[0]
                .trim();

            /* ==================================
               DESCRIÇÃO SEM TEXTO DA PARCELA
            ================================== */

            let descricao = String(
                compra.descricao || ""
            ).trim();

            descricao = descricao.replace(
                /\s*[-–]?\s*parcela\s*\d+\s*\/\s*\d+\s*$/i,
                ""
            ).trim();

            /* ==================================
               TOTAL / PARCELAS RESTANTES
            ================================== */

            const total = Number(
                compra.total_parcelas || 0
            );

            const restantes = Number(
                compra.parcelas_restantes || 0
            );

            const parcelas = `${total}/${restantes}`;

            /* ==================================
               CRIAR SOMENTE TRÊS COLUNAS
            ================================== */

            const colunaCartao = linha.insertCell();
            colunaCartao.textContent = banco;

            const colunaDescricao = linha.insertCell();
            colunaDescricao.textContent = descricao;

            const colunaParcelas = linha.insertCell();
            colunaParcelas.textContent = parcelas;

        });

        /* ======================================
           NENHUMA COMPRA ENCONTRADA
        ====================================== */

        if (!compras.length) {

            const linha = tabela.insertRow();

            const coluna = linha.insertCell();

            coluna.colSpan = 3;

            coluna.textContent =
                "Nenhuma compra parcelada encontrada.";

        }

        mostrarStatus(
            compras.length +
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

  try {

    iniciarAutenticacao();

  } catch (erro) {

    console.error(erro);
    mostrarStatus(erro.message);

  }

});

