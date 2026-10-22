
/* ==========================================
   APP FINANÇAS - AUTENTICAÇÃO GOOGLE
========================================== */

let tokenClient = null;
let accessToken = null;

function iniciarAutenticacao() {

  if (!window.google?.accounts?.oauth2) {
    throw new Error(
      "Biblioteca Google Identity Services não carregada."
    );
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.CLIENT_ID,
    scope: CONFIG.SCOPES,

    callback: resposta => {

      if (resposta.error) {
        console.error("Erro OAuth:", resposta);
        mostrarStatus("Falha na autenticação.");
        return;
      }

      accessToken = resposta.access_token;

      mostrarStatus("Autenticado com Google.");

      document.getElementById("btnLogin").hidden = true;
      document.getElementById("btnSair").hidden = false;

      carregarContas();
    },

    error_callback: erro => {
      console.error("Erro no login:", erro);
      mostrarStatus("Não foi possível concluir o login.");
    }
  });
}

function entrarGoogle() {

  if (!tokenClient) {
    mostrarStatus("Autenticação não inicializada.");
    return;
  }

  tokenClient.requestAccessToken({
    prompt: "consent"
  });
}

function obterToken() {

  if (!accessToken) {
    throw new Error(
      "Sessão não autenticada. Faça login novamente."
    );
  }

  return accessToken;
}

function sairGoogle() {

  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken);
  }

  accessToken = null;

  document.getElementById("btnLogin").hidden = false;
  document.getElementById("btnSair").hidden = true;

  document.getElementById("listaContas").replaceChildren();

  mostrarStatus("Sessão encerrada.");
}

function mostrarStatus(mensagem) {

  const elemento = document.getElementById("status");

  if (elemento) {
    elemento.textContent = mensagem;
  }
}
