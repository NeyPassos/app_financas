
/* ==========================================
   APP FINANÇAS - CARTÕES DE CRÉDITO
========================================== */

let cartoesCadastrados = [];
let cartoesCarregados = false;
let salvandoCartao = false;

/* ==========================================
   INICIALIZAÇÃO
========================================== */

document.addEventListener("DOMContentLoaded", () => {

  configurarEventosCartao();
  iniciarPaginaCartoes();

});


async function iniciarPaginaCartoes() {

  const lista = document.getElementById("listaCartoes");

  lista.innerHTML = `
    <tr>
      <td colspan="8">
        Faça login com Google para carregar os cartões.
      </td>
    </tr>
  `;

  try {

    // Aguarda a biblioteca Google carregar.
    if (!window.google?.accounts?.oauth2) {
      mostrarStatus(
        "Aguardando biblioteca de autenticação Google."
      );
      return;
    }

    iniciarAutenticacao();
    atualizarBotoesAutenticacao();

    if (accessToken) {
      await carregarCartoes();
    }

  } catch (erro) {

    console.error("Erro na inicialização:", erro);
    mostrarStatus(erro.message);
  }
}

/* ==========================================
   EVENTOS
========================================== */

function configurarEventosCartao() {

  document.getElementById("btnNovoCartao")
    .addEventListener("click", abrirNovoCartao);

  document.getElementById("btnFecharModalCartao")
    .addEventListener("click", fecharModalCartao);

  document.getElementById("btnCancelarCartao")
    .addEventListener("click", fecharModalCartao);

  document.getElementById("formCartao")
    .addEventListener("submit", salvarCartao);

  document.getElementById("btnSair")
    .addEventListener("click", () => {

      if (typeof sairGoogle === "function") {
        sairGoogle();
      }

      window.location.href = "index.html";
    });

  document.getElementById("modalCartao")
    .addEventListener("click", evento => {

      if (evento.target.id === "modalCartao") {
        fecharModalCartao();
      }

    });

    document.addEventListener("keydown", evento => {

    if (evento.key === "Escape") {

      fecharModalCartao();
      fecharExcluirCartao();

    }

      /* ==========================================
     EVENTOS IMPORTAÇÃO
  ========================================== */

  document.getElementById("btnImportarFatura")
    .addEventListener("click", abrirModalImportacao);

  document.getElementById("btnFecharImportacao")
    .addEventListener("click", fecharModalImportacao);

  document.getElementById("btnCancelarImportacao")
    .addEventListener("click", fecharModalImportacao);

  document.getElementById("modalImportarFatura")
    .addEventListener("click", evento => {

      if (evento.target.id === "modalImportarFatura") {
        fecharModalImportacao();
      }

    });

  });

  /* ==========================================
     EVENTOS DE EXCLUSÃO
  ========================================== */

  document.getElementById("btnCancelarExclusao")
    .addEventListener("click", fecharExcluirCartao);

  document.getElementById("btnConfirmarExclusao")
    .addEventListener("click", confirmarExclusaoCartao);

  document.getElementById("modalExcluirCartao")
    .addEventListener("click", evento => {

      if (evento.target.id === "modalExcluirCartao") {
        fecharExcluirCartao();
      }

    });
}

/* ==========================================
   CARREGAR CARTÕES
========================================== */

async function carregarCartoes() {

  const lista = document.getElementById("listaCartoes");

  lista.innerHTML = `
    <tr>
      <td colspan="8">Carregando cartões...</td>
    </tr>
  `;

  try {

    const resposta = await apiListarCartoes();

    cartoesCadastrados = Array.isArray(resposta.dados)
      ? resposta.dados
      : [];

    cartoesCarregados = true;

    exibirCartoes();
    preencherFiltroCartoes();

    mostrarStatus(
      cartoesCadastrados.length +
      " cartão(ões) carregado(s)."
    );

  } catch (erro) {

    cartoesCarregados = false;

    console.error("Erro ao carregar cartões:", erro);

    lista.replaceChildren();

    const linha = lista.insertRow();
    const celula = linha.insertCell();

    celula.colSpan = 8;
    celula.textContent = "Erro ao carregar cartões: " + erro.message;

    mostrarStatus("Erro ao carregar cartões: " + erro.message);
  }
}

/* ==========================================
   EXIBIR CARTÕES
========================================== */

function exibirCartoes() {

  const lista = document.getElementById("listaCartoes");

  lista.replaceChildren();

  if (!cartoesCadastrados.length) {

    const linha = lista.insertRow();
    const celula = linha.insertCell();

    celula.colSpan = 8;
    celula.textContent = "Nenhum cartão cadastrado.";

    return;
  }

  cartoesCadastrados.forEach(cartao => {

    const linha = lista.insertRow();

    const valores = [
      cartao.id_cartao,
      cartao.banco,
      cartao.nome_cartao,
      cartao.final_cartao,
      cartao.dia_fechamento,
      cartao.dia_vencimento,
      cartao.ativo === "Sim" ? "Ativo" : "Inativo"
    ];

    valores.forEach(valor => {

      const celula = linha.insertCell();
      celula.textContent = valor ?? "";

    });

    const acoes = linha.insertCell();

    const btnEditar = document.createElement("button");

    btnEditar.type = "button";
    btnEditar.textContent = "Editar";
    btnEditar.className = "btn-editar";

    btnEditar.addEventListener("click", () => {
      abrirEditarCartao(cartao.id_cartao);
    });

        acoes.appendChild(btnEditar);

    // BOTÃO EXCLUIR
    const btnExcluir = document.createElement("button");

    btnExcluir.type = "button";
    btnExcluir.textContent = "Excluir";
    btnExcluir.className = "btn-excluir";

    btnExcluir.addEventListener("click", () => {
      abrirExcluirCartao(cartao.id_cartao);
    });

    acoes.appendChild(btnExcluir);

  });
}
 
/* ==========================================
   FILTRO DE CARTÕES
========================================== */

function preencherFiltroCartoes() {

  const select = document.getElementById("filtroCartao");

  const valorAnterior = select.value;

  select.replaceChildren();

  const inicial = document.createElement("option");

  inicial.value = "";
  inicial.textContent = "Selecione um cartão";

  select.appendChild(inicial);

  cartoesCadastrados.forEach(cartao => {

    const option = document.createElement("option");

    option.value = cartao.id_cartao;

    option.textContent =
      cartao.banco + " - " +
      cartao.nome_cartao + " (" +
      cartao.final_cartao + ")";

    select.appendChild(option);
  });

  if (
    [...select.options].some(
      option => option.value === valorAnterior
    )
  ) {
    select.value = valorAnterior;
  }

    /* ==========================================
     HABILITAR IMPORTAÇÃO
  ========================================== */

  const btnImportar = document.getElementById(
    "btnImportarFatura"
  );

  btnImportar.disabled =
    !cartoesCarregados ||
    !cartoesCadastrados.length;

}

/* ==========================================
   ABRIR NOVO CARTÃO
========================================== */

function abrirNovoCartao() {

  document.getElementById("formCartao").reset();

  document.getElementById("idCartao").value = "";

  document.getElementById("cartaoAtivo").value = "Sim";

  document.getElementById("tituloModalCartao")
    .textContent = "Novo cartão";

  document.getElementById("modalCartao").hidden = false;

  document.getElementById("banco").focus();
}

/* ==========================================
   ABRIR EDIÇÃO
========================================== */

function abrirEditarCartao(id) {

  const cartao = cartoesCadastrados.find(
    item => String(item.id_cartao) === String(id)
  );

  if (!cartao) {
    mostrarStatus("Cartão não encontrado.");
    return;
  }

  document.getElementById("idCartao").value =
    cartao.id_cartao;

  document.getElementById("banco").value =
    cartao.banco || "";

  document.getElementById("nomeCartao").value =
    cartao.nome_cartao || "";

  document.getElementById("finalCartao").value =
    cartao.final_cartao || "";

  document.getElementById("diaFechamento").value =
    cartao.dia_fechamento || "";

  document.getElementById("diaVencimento").value =
    cartao.dia_vencimento || "";

  document.getElementById("cartaoAtivo").value =
    cartao.ativo || "Sim";

  document.getElementById("tituloModalCartao")
    .textContent = "Editar cartão";

  document.getElementById("modalCartao").hidden = false;
}

/* ==========================================
   FECHAR MODAL
========================================== */

function fecharModalCartao() {

  if (salvandoCartao) return;

  document.getElementById("modalCartao").hidden = true;
}

/* ==========================================
   SALVAR CARTÃO
========================================== */

async function salvarCartao(evento) {

  evento.preventDefault();

  if (salvandoCartao) return;

  const id = document.getElementById("idCartao").value;

  const dados = {

    banco: document.getElementById("banco")
      .value.trim(),

    nome_cartao: document.getElementById("nomeCartao")
      .value.trim(),

    final_cartao: document.getElementById("finalCartao")
      .value.trim(),

    dia_fechamento: Number(
      document.getElementById("diaFechamento").value
    ),

    dia_vencimento: Number(
      document.getElementById("diaVencimento").value
    ),

    ativo: document.getElementById("cartaoAtivo").value

  };

  const botao = document.getElementById("btnSalvarCartao");

  try {

    salvandoCartao = true;

    botao.disabled = true;
    botao.textContent = "Salvando...";

    let resposta;

    if (id) {

      if (typeof apiEditarCartao !== "function") {
        throw new Error(
          "A API de edição ainda não foi implementada."
        );
      }

      resposta = await apiEditarCartao({
        id_cartao: id,
        ...dados
      });

    } else {

      resposta = await apiCadastrarCartao(dados);

    }

    mostrarStatus(resposta.mensagem || "Cartão salvo.");

    document.getElementById("modalCartao").hidden = true;

    await carregarCartoes();

  } catch (erro) {

    console.error("Erro ao salvar cartão:", erro);

    mostrarStatus("Erro ao salvar cartão: " + erro.message);

  } finally {

    salvandoCartao = false;

    botao.disabled = false;
    botao.textContent = "Salvar";

  }
}

/* ==========================================
   EXCLUSÃO DE CARTÕES
========================================== */

let idCartaoExcluir = null;
let excluindoCartao = false;


/* ==========================================
   ABRIR MODAL DE EXCLUSÃO
========================================== */

function abrirExcluirCartao(id) {

  const cartao = cartoesCadastrados.find(
    item => String(item.id_cartao) === String(id)
  );

  if (!cartao) {
    mostrarStatus("Cartão não encontrado.");
    return;
  }

  idCartaoExcluir = cartao.id_cartao;

  document.getElementById("nomeCartaoExcluir")
    .textContent =
      cartao.banco + " - " + cartao.nome_cartao;

  document.getElementById("modalExcluirCartao")
    .hidden = false;

}


/* ==========================================
   FECHAR MODAL DE EXCLUSÃO
========================================== */

function fecharExcluirCartao() {

  if (excluindoCartao) return;

  document.getElementById("modalExcluirCartao")
    .hidden = true;

  idCartaoExcluir = null;

}


/* ==========================================
   CONFIRMAR EXCLUSÃO
========================================== */

async function confirmarExclusaoCartao() {

  if (!idCartaoExcluir || excluindoCartao) {
    return;
  }

  const botao = document.getElementById(
    "btnConfirmarExclusao"
  );

  try {

    excluindoCartao = true;

    botao.disabled = true;
    botao.textContent = "Excluindo...";

    const resposta = await apiExcluirCartao(
      idCartaoExcluir
    );

    mostrarStatus(
      resposta.mensagem ||
      "Cartão excluído com sucesso."
    );

    document.getElementById("modalExcluirCartao")
      .hidden = true;

    idCartaoExcluir = null;

    await carregarCartoes();

  } catch (erro) {

    console.error(
      "Erro ao excluir cartão:",
      erro
    );

    mostrarStatus(
      "Erro ao excluir cartão: " + erro.message
    );

  } finally {

    excluindoCartao = false;

    botao.disabled = false;
    botao.textContent = "Excluir";

  }
}

/* ==========================================
   MODAL IMPORTAÇÃO DE FATURAS
========================================== */

function abrirModalImportacao() {

  const modal = document.getElementById(
    "modalImportarFatura"
  );

  const select = document.getElementById(
    "importarCartao"
  );

  const filtroCartao = document.getElementById(
    "filtroCartao"
  );

  document.getElementById(
    "formImportarFatura"
  ).reset();

  document.getElementById(
    "resumoImportacao"
  ).hidden = true;

  document.getElementById(
    "btnConfirmarImportacao"
  ).disabled = true;

  document.getElementById(
    "listaPreviaFatura"
  ).replaceChildren();

  select.replaceChildren();

  const inicial = document.createElement("option");
  inicial.value = "";
  inicial.textContent = "Selecione um cartão";

  select.appendChild(inicial);

  cartoesCadastrados.forEach(cartao => {

    const option = document.createElement("option");

    option.value = cartao.id_cartao;

    option.textContent =
      cartao.banco + " - " +
      cartao.nome_cartao + " (" +
      cartao.final_cartao + ")";

    select.appendChild(option);

  });

  if (filtroCartao.value) {
    select.value = filtroCartao.value;
  }

  document.getElementById(
    "importarAno"
  ).value = new Date().getFullYear();

  modal.hidden = false;

}


function fecharModalImportacao() {

  document.getElementById(
    "modalImportarFatura"
  ).hidden = true;

}



