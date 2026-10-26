
/* ==========================================
   APP FINANÇAS - AUTENTICAÇÃO GOOGLE
   COMPARTILHADA ENTRE OS MÓDULOS
========================================== */

let tokenClient = null;
let accessToken = null;
let autenticacaoInicializada = false;

const CHAVE_SESSAO_GOOGLE = "app_financas_sessao_google";

function salvarSessaoGoogle(resposta) {

  const duracao = Number(resposta.expires_in);

  const expiracao = Date.now() +
    (Number.isFinite(duracao) && duracao > 0
      ? duracao * 1000
      : 0);

  sessionStorage.setItem(
    CHAVE_SESSAO_GOOGLE,
    JSON.stringify({
      token: resposta.access_token,
      expiracao
    })
  );
}

function recuperarSessaoGoogle() {

  const sessaoSalva = sessionStorage.getItem(
    CHAVE_SESSAO_GOOGLE
  );

  if (!sessaoSalva) return false;

  try {

    const sessao = JSON.parse(sessaoSalva);

    // Margem de segurança de 60 segundos.
    if (
      !sessao.token ||
      !Number.isFinite(sessao.expiracao) ||
      Date.now() >= sessao.expiracao - 60000
    ) {
      sessionStorage.removeItem(CHAVE_SESSAO_GOOGLE);
      return false;
    }

    accessToken = sessao.token;

    return true;

  } catch (erro) {

    sessionStorage.removeItem(CHAVE_SESSAO_GOOGLE);
    return false;

  }
}

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

      salvarSessaoGoogle(resposta);

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

      console.error("Erro OAuth:", erro);

      // A recuperação silenciosa pode não funcionar
      // dependendo das condições da sessão Google.
      // Nesse caso, manter o botão de login disponível.
      atualizarBotoesAutenticacao();

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

  if (recuperarSessaoGoogle()) {

    atualizarBotoesAutenticacao();

    carregarModuloAtual().catch(erro => {
      console.error("Erro ao recuperar sessão:", erro);
      mostrarStatus(erro.message);
    });

  }
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

    const sessaoSalva = sessionStorage.getItem(
      CHAVE_SESSAO_GOOGLE
    );

    if (!sessaoSalva) {
      accessToken = null;
      throw new Error("Sessão encerrada. Faça login novamente.");
    }

    let sessao;

    try {
      sessao = JSON.parse(sessaoSalva);
    } catch {
      sessao = null;
    }

    if (
      !sessao ||
      !Number.isFinite(sessao.expiracao) ||
      Date.now() >= sessao.expiracao - 60000
    ) {
      accessToken = null;
      sessionStorage.removeItem(CHAVE_SESSAO_GOOGLE);
      atualizarBotoesAutenticacao();

      throw new Error(
        "Sua sessão expirou. Faça login novamente."
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

  accessToken = null;

  sessionStorage.removeItem(CHAVE_SESSAO_GOOGLE);

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
