// Cliente da API: será implementado após configurar a implantação.


/* ==========================================
   APP FINANÇAS - COMUNICAÇÃO COM API
========================================== */

async function executarAPI(funcao, parametros = []) {

  const token = obterToken();

  const url =
    CONFIG.API_URL +
    encodeURIComponent(CONFIG.DEPLOYMENT_ID) +
    ":run";

  const resposta = await fetch(url, {

    method: "POST",

    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      function: funcao,
      parameters: parametros,
      devMode: false
    })

  });

  const resultado = await resposta.json();

  if (!resposta.ok) {

    if (resposta.status === 401) {
      throw new Error(
        "Autorização expirada. Faça login novamente."
      );
    }

    throw new Error(
      resultado.error?.message ||
      "Erro HTTP " + resposta.status
    );
  }

  if (resultado.error) {

    const mensagem =
      resultado.error.message ||
      "Erro ao executar a função.";

    if (
      mensagem.includes("Acesso negado") ||
      mensagem.includes("Usuário não autorizado")
    ) {
      throw new Error(
        "Acesso negado. Esta conta Google não possui autorização para utilizar o App Finanças."
      );
    }

    throw new Error(mensagem);
  }

  const retorno = resultado.response?.result;

  if (!retorno) {
    throw new Error("A API não retornou dados.");
  }

  if (retorno.sucesso === false) {
    throw new Error(retorno.mensagem);
  }

  return retorno;
}

/* ==========================================
   OPERAÇÕES DE CONTAS
========================================== */

async function apiListarContas() {
  return executarAPI("listarContas");
}

async function apiBuscarConta(id) {
  return executarAPI("buscarConta", [id]);
}

async function apiCadastrarConta(dados) {
  return executarAPI("cadastrarConta", [dados]);
}

async function apiEditarConta(dados) {
  return executarAPI("editarConta", [dados]);
}

async function apiExcluirConta(id) {
  return executarAPI("excluirConta", [id]);
}


/* ==========================================
   APP FINANÇAS - API DE CARTÕES
========================================== */

async function apiListarCartoes() {
  return executarAPI("listarCartoes");
}

async function apiCadastrarCartao(dados) {
  return executarAPI("cadastrarCartao", [dados]);
}

async function apiListarFaturas() {
  return executarAPI("listarFaturas");
}

/* ==========================================
   EDITAR FATURA
========================================== */

async function apiEditarFatura(dados) {

  return executarAPI(
    "editarFatura",
    [dados]
  );

}

async function apiListarLancamentosCartao(idFatura) {
  return executarAPI(
    "listarLancamentosCartao",
    [idFatura]
  );
}

async function apiImportarLancamentosCartao(dados) {
  return executarAPI(
    "importarLancamentosCartao",
    [dados]
  );
}

/* ==========================================
   EXCLUIR CARTÃO
========================================== */

async function apiExcluirCartao(idCartao) {

  return executarAPI(
    "excluirCartao",
    [idCartao]
  );

}


/* ==========================================
   DASHBOARD - PARCELAMENTOS
========================================== */

async function apiListarParcelamentosDashboard() {

  return executarAPI(
    "listarParcelamentosDashboard"
  );

}




