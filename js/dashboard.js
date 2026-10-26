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

    tabela.replaceChildren();

    let totalPagas = 0;
    let totalRestantes = 0;

    compras.forEach(compra => {

      const pagas = Number(
        compra.parcelas_pagas || 0
      );

      const restantes = Number(
        compra.parcelas_restantes || 0
      );

      totalPagas += pagas;
      totalRestantes += restantes;

      const linha = tabela.insertRow();

      const valores = [
        compra.cartao,
        compra.descricao,
        compra.parcela_atual,
        compra.total_parcelas,
        pagas,
        restantes
      ];

      valores.forEach(valor => {

        const coluna = linha.insertCell();

        coluna.textContent = valor;

      });

    });

    elementoDashboard("totalCompras").textContent =
      compras.length;

    elementoDashboard("totalParcelasPagas").textContent =
      totalPagas;

    elementoDashboard("totalParcelasRestantes").textContent =
      totalRestantes;

    if (!compras.length) {

      const linha = tabela.insertRow();
      const coluna = linha.insertCell();

      coluna.colSpan = 6;
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

