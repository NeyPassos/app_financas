// Funcionalidades em desenvolvimento.

/* ==========================================
   APP FINANÇAS - DASHBOARD
========================================== */

const elementoDashboard = id =>
  document.getElementById(id);


/* ==========================================
   CARREGAR PARCELAMENTOS
========================================== */

async function carregarDashboard() {

    const tabela = elementoDashboard(
        "listaParcelamentos"
    );

    try {

        mostrarStatus("Carregando parcelamentos...");

        const resposta =
            await apiListarParcelamentosDashboard();

        const compras = Array.isArray(resposta.dados)
            ? resposta.dados
            : [];

        // Ordenar das que menos faltam
        // para as que mais faltam.
        compras.sort((a, b) =>
            Number(a.parcelas_restantes) -
            Number(b.parcelas_restantes)
        );

        tabela.replaceChildren();

        compras.forEach(compra => {

            const linha = tabela.insertRow();

            /* ==================================
               NOME DO BANCO
            ================================== */

            const nomeCompleto = String(
                compra.cartao || ""
            ).trim();

            const banco = nomeCompleto
                .split(" - ")[0]
                .trim();

            /* ==================================
               DESCRIÇÃO SEM PARCELAMENTO
            ================================== */

            const descricao = String(
                compra.descricao || ""
            )
            .replace(
                /\s*[-–]?\s*parcela\s+\d+\s*\/\s*\d+\s*$/i,
                ""
            )
            .trim();

            /* ==================================
               PARCELAS
               TOTAL / RESTANTES
            ================================== */

            const total = Number(
                compra.total_parcelas || 0
            );

            const restantes = Number(
                compra.parcelas_restantes || 0
            );

            const parcelas = total + "/" + restantes;

            /* ==================================
               PREENCHER TABELA
            ================================== */

            const valores = [
                banco,
                descricao,
                parcelas
            ];

            valores.forEach(valor => {

                const coluna = linha.insertCell();

                coluna.textContent = valor;

            });

        });

        /* ======================================
           TABELA VAZIA
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

