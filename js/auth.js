
/* ==========================================
   APP FINANÇAS - AUTENTICAÇÃO GOOGLE
   COMPARTILHADA ENTRE OS MÓDULOS
========================================== */

let tokenClient = null;
let accessToken = null;
let autenticacaoInicializada = false;

/* ==========================================
   IDENTIFICAR MÓDULO ATUAL
========================================== */

function identificarModulo() {

  if (document.getElementById("listaCartoes")) {
    return "cartoes";
  }

  if (document.getElementById("listaContas")) {
    return "contas";
  }

  return "outro";
}

/* ==========================================
   INICIAR AUTENTICAÇÃO
========================================== */

function iniciarAutenticacao() {

  if (autenticacaoInicializada) {
    return;
  }

  if (!window.google?.accounts?.oauth2) {
    throw new Error(
      "Biblioteca Google Identity Services não carregada."
    );
  }

  tokenClient = google.accounts.oauth2.initTokenClient({

    client_id: CONFIG.CLIENT_ID,
    scope: CONFIG.SCOPES,

    callback: async resposta => {

      if (resposta.error) {

        console.error("Erro OAuth:", resposta);

        mostrarStatus("Falha na autenticação.");
        return;
      }

      accessToken = resposta.access_token;

      atualizarBotoesAutenticacao();

      mostrarStatus("Autenticado com Google.");

      try {
        await carregarModuloAtual();
      } catch (erro) {
        console.error("Erro ao carregar módulo:", erro);
        mostrarStatus(erro.message);
      }
    },

    error_callback: erro => {

      console.error("Erro no login:", erro);

      mostrarStatus(
        "Não foi possível concluir o login."
      );
    }
  });

  autenticacaoInicializada = true;
}

/* ==========================================
   ENTRAR COM GOOGLE
========================================== */

function entrarGoogle() {

  if (!tokenClient) {

    mostrarStatus(
      "Autenticação não inicializada."
    );

    return;
  }

  tokenClient.requestAccessToken({
    prompt: "consent"
  });
}

/* ==========================================
   OBTER TOKEN
========================================== */

function obterToken() {

  if (!accessToken) {

    throw new Error(
      "Sessão não autenticada. Faça login novamente."
    );
  }

  return accessToken;
}

/* ==========================================
   ATUALIZAR BOTÕES
========================================== */

function atualizarBotoesAutenticacao() {

  const btnLogin = document.getElementById("btnLogin");
  const btnSair = document.getElementById("btnSair");

  if (btnLogin) {
    btnLogin.hidden = Boolean(accessToken);
  }

  if (btnSair) {
    btnSair.hidden = !accessToken;
  }
}

/* ==========================================
   CARREGAR MÓDULO ATUAL
========================================== */

async function carregarModuloAtual() {

  const modulo = identificarModulo();

  if (modulo === "contas") {

    if (typeof carregarContas === "function") {
      await carregarContas();
    }

  } else if (modulo === "cartoes") {

    if (typeof carregarCartoes === "function") {
      await carregarCartoes();
    }
  }
}

/* ==========================================
   SAIR DO GOOGLE
========================================== */

function sairGoogle() {

  if (accessToken && window.google?.accounts?.oauth2) {

    google.accounts.oauth2.revoke(accessToken);
  }

  accessToken = null;

  atualizarBotoesAutenticacao();

  const listaContas = document.getElementById("listaContas");

  if (listaContas) {
    listaContas.replaceChildren();
  }

  const listaCartoes = document.getElementById("listaCartoes");

  if (listaCartoes) {
    listaCartoes.replaceChildren();
  }

  mostrarStatus("Sessão encerrada.");
}

/* ==========================================
   MOSTRAR STATUS
========================================== */

function mostrarStatus(mensagem) {

  const elemento = document.getElementById("status");

  if (elemento) {
    elemento.textContent = mensagem;
  }
}
