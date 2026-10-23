
/* ==========================================
   APP FINANÇAS - CARTÕES DE CRÉDITO
========================================== */

let cartoesCadastrados = [];
let cartoesCarregados = false;
let salvandoCartao = false;

/* ==========================================
   CONTROLE DA IMPORTAÇÃO
========================================== */

let lancamentosImportacao = [];
let arquivoImportacao = null;

/* ==========================================
   INICIALIZAÇÃO
========================================== */

document.addEventListener("DOMContentLoaded", () => {

  configurarEventosCartao();

  preencherFiltrosFaturas();

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
   EVENTOS DOS CARTÕES
========================================== */

function configurarEventosCartao() {

  // NOVO CARTÃO
  document.getElementById("btnNovoCartao")
    .addEventListener("click", abrirNovoCartao);

  // FECHAR MODAL CARTÃO
  document.getElementById("btnFecharModalCartao")
    .addEventListener("click", fecharModalCartao);

  document.getElementById("btnCancelarCartao")
    .addEventListener("click", fecharModalCartao);

  // SALVAR CARTÃO
  document.getElementById("formCartao")
    .addEventListener("submit", salvarCartao);

  document.getElementById("btnAnalisarFatura")
  ?.addEventListener("click", analisarArquivoFatura);

  // SAIR
  document.getElementById("btnSair")
    .addEventListener("click", () => {

      if (typeof sairGoogle === "function") {
        sairGoogle();
      }

      window.location.href = "index.html";
    });

  // FECHAR MODAL CARTÃO AO CLICAR FORA
  document.getElementById("modalCartao")
    .addEventListener("click", evento => {

      if (evento.target.id === "modalCartao") {
        fecharModalCartao();
      }
    });

  /* ==========================================
     IMPORTAÇÃO DE FATURAS
  ========================================== */

  document.getElementById("btnImportarFatura")
    ?.addEventListener("click", abrirModalImportacao);

  document.getElementById("btnFecharImportacao")
    ?.addEventListener("click", fecharModalImportacao);

  document.getElementById("btnCancelarImportacao")
    ?.addEventListener("click", fecharModalImportacao);

  // FECHAR MODAL AO CLICAR FORA
  document.getElementById("modalImportarFatura")
    ?.addEventListener("click", evento => {

      if (evento.target.id === "modalImportarFatura") {
        fecharModalImportacao();
      }
    });

  /* ==========================================
     EXCLUSÃO DE CARTÕES
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

  /* ==========================================
     TECLA ESCAPE
  ========================================== */

  document.addEventListener("keydown", evento => {

    if (evento.key === "Escape") {

      fecharModalCartao();
      fecharExcluirCartao();
      fecharModalImportacao();

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


/* ==========================================
   ANALISAR ARQUIVO DA FATURA
========================================== */

async function analisarArquivoFatura(evento) {

  evento?.preventDefault();

  const idCartao = document.getElementById("importarCartao").value;
  const mes = Number(document.getElementById("importarMes").value);
  const ano = Number(document.getElementById("importarAno").value);
  const inputArquivo = document.getElementById("arquivoFatura");
  const arquivo = inputArquivo?.files[0];

  const btnConfirmar = document.getElementById(
    "btnConfirmarImportacao"
  );

  const btnAnalisar = document.getElementById(
    "btnAnalisarFatura"
  );

  lancamentosImportacao = [];
  arquivoImportacao = null;

  btnConfirmar.disabled = true;

  document.getElementById("resumoImportacao").hidden = true;

  if (!idCartao) {
    mostrarStatus("Selecione um cartão.");
    return;
  }

  if (!Number.isInteger(mes) || mes < 1 || mes > 12 ||
      !Number.isInteger(ano) || ano < 1900 || ano > 9999) {
    mostrarStatus("Informe o mês e ano da fatura.");
    return;
  }

  if (!arquivo) {
    mostrarStatus("Selecione o arquivo da fatura.");
    return;
  }

  if (!arquivo.name.toLowerCase().endsWith(".csv")) {
    mostrarStatus(
      "Nesta etapa, selecione um arquivo CSV. PDF será implementado depois."
    );
    return;
  }

  try {

    btnAnalisar.disabled = true;
    btnAnalisar.textContent = "Analisando...";

    const conteudo = await arquivo.text();

    const registros = lerCSVFatura(conteudo);

    if (!registros.length) {
      throw new Error("O CSV não possui lançamentos.");
    }

    lancamentosImportacao = registros;
    arquivoImportacao = arquivo;

    exibirPreviaFatura(registros);

    btnConfirmar.disabled = false;

    mostrarStatus(
      registros.length + " lançamento(s) identificado(s)."
    );

  } catch (erro) {

    console.error("Erro na análise:", erro);
    mostrarStatus("Erro ao analisar arquivo: " + erro.message);

  } finally {

    btnAnalisar.disabled = false;
    btnAnalisar.textContent = "Analisar arquivo";

  }
}

/* ==========================================
   LEITURA CSV COM ASPAS E VÍRGULAS
========================================== */

function separarLinhasCSV(texto) {

  const linhas = [];
  let linha = [];
  let campo = "";
  let entreAspas = false;

  texto = texto.replace(/^\uFEFF/, "");

  for (let i = 0; i < texto.length; i++) {

    const caractere = texto[i];

    if (caractere === '"') {

      if (entreAspas && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else {
        entreAspas = !entreAspas;
      }

    } else if (caractere === "," && !entreAspas) {

      linha.push(campo);
      campo = "";

    } else if (
      (caractere === "\n" || caractere === "\r") &&
      !entreAspas
    ) {

      if (caractere === "\r" && texto[i + 1] === "\n") {
        i++;
      }

      linha.push(campo);

      if (linha.some(valor => valor.trim() !== "")) {
        linhas.push(linha);
      }

      linha = [];
      campo = "";

    } else {

      campo += caractere;

    }
  }

  if (entreAspas) {
    throw new Error("CSV contém aspas não fechadas.");
  }

  linha.push(campo);

  if (linha.some(valor => valor.trim() !== "")) {
    linhas.push(linha);
  }

  return linhas;
}

/* ==========================================
   CONVERTER VALOR MONETÁRIO
========================================== */

function converterValorFatura(valor) {

  const texto = String(valor ?? "")
    .trim()
    .replace(/\s/g, "");

  if (!/^-?\d{1,3}(\.\d{3})*(,\d+)?$|^-?\d+(,\d+)?$/.test(texto)) {
    throw new Error("Valor monetário inválido: " + valor);
  }

  const numero = Number(
    texto.replace(/\./g, "").replace(",", ".")
  );

  if (!Number.isFinite(numero)) {
    throw new Error("Valor inválido: " + valor);
  }

  return numero;
}

/* ==========================================
   INTERPRETAR CSV DO NUBANK
========================================== */

function lerCSVFatura(conteudo) {

  const linhas = separarLinhasCSV(conteudo);

  const cabecalho = linhas.shift()
    .map(campo => campo.trim().toLowerCase());

  const indiceData = cabecalho.indexOf("date");
  const indiceDescricao = cabecalho.indexOf("title");
  const indiceValor = cabecalho.indexOf("amount");

  if (
    indiceData === -1 ||
    indiceDescricao === -1 ||
    indiceValor === -1
  ) {
    throw new Error(
      "Formato não reconhecido. Esperado: date,title,amount."
    );
  }

  return linhas.map((linha, indice) => {

    const data = String(linha[indiceData] || "").trim();
    const descricao = String(linha[indiceDescricao] || "").trim();

    const valor = converterValorFatura(
      linha[indiceValor]
    );

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) ||
        !descricao) {
      throw new Error(
        "Dados inválidos na linha " + (indice + 2)
      );
    }

    const [ano, mes, dia] = data.split("-").map(Number);

    const dataValidada = new Date(Date.UTC(ano, mes - 1, dia));

    if (
      dataValidada.getUTCFullYear() !== ano ||
      dataValidada.getUTCMonth() !== mes - 1 ||
      dataValidada.getUTCDate() !== dia
    ) {
      throw new Error(
        "Data inválida na linha " + (indice + 2)
      );
    }

    const parcela = descricao.match(
      /parcela\s+(\d+)\s*\/\s*(\d+)/i
    );

    const parcelaAtual = parcela ? Number(parcela[1]) : 1;
    const totalParcelas = parcela ? Number(parcela[2]) : 1;

    if (
      parcelaAtual < 1 ||
      totalParcelas < parcelaAtual
    ) {
      throw new Error(
        "Parcela inválida na linha " + (indice + 2)
      );
    }

    const tipoMovimento = valor < 0
      ? "Pagamento"
      : /(^|\s)iof(\s|$)/i.test(descricao)
        ? "Encargo"
        : "Compra";

    return {
      data_compra: data,
      descricao: descricao,
      parcela_atual: parcelaAtual,
      total_parcelas: totalParcelas,
      valor: valor,
      tipo_movimento: tipoMovimento
    };

  });
}

/* ==========================================
   EXIBIR PRÉVIA DA FATURA
========================================== */

function exibirPreviaFatura(lancamentos) {

  const lista = document.getElementById(
    "listaPreviaFatura"
  );

  const resumo = document.getElementById(
    "resumoImportacao"
  );

  lista.replaceChildren();

  let compras = 0;
  let pagamentos = 0;

  const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  lancamentos.forEach(item => {

    const linha = lista.insertRow();

    const valores = [
      item.data_compra.split("-").reverse().join("/"),
      item.descricao,
      item.parcela_atual + "/" + item.total_parcelas,
      moeda.format(item.valor),
      item.tipo_movimento
    ];

    valores.forEach(valor => {
      const celula = linha.insertCell();
      celula.textContent = valor;
    });

    if (item.valor >= 0) {
      compras += item.valor;
    } else {
      pagamentos += Math.abs(item.valor);
    }

  });

  resumo.hidden = false;

  // Exibe os totais sem depender de IDs adicionais no HTML.
  let totais = document.getElementById("totaisPreviaFatura");

  if (!totais) {
    totais = document.createElement("p");
    totais.id = "totaisPreviaFatura";
    resumo.appendChild(totais);
  }

  totais.textContent =
    "Lançamentos: " + lancamentos.length +
    " | Compras e encargos: " + moeda.format(compras) +
    " | Pagamentos: " + moeda.format(pagamentos) +
    " | Saldo líquido: " + moeda.format(compras - pagamentos);
}


/* ==========================================
   PREENCHER FILTROS DE MÊS E ANO
========================================== */

function preencherFiltrosFaturas() {

  const filtroMes = document.getElementById("filtroMes");
  const filtroAno = document.getElementById("filtroAno");

  if (!filtroMes || !filtroAno) return;

  const meses = [
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

  // Preservar seleções anteriores
  const mesSelecionado = filtroMes.value;
  const anoSelecionado = filtroAno.value;

  filtroMes.innerHTML = '<option value="">Todos</option>';

  meses.forEach((mes, indice) => {

    const option = document.createElement("option");

    option.value = String(indice + 1);
    option.textContent = mes;

    filtroMes.appendChild(option);

  });

  filtroAno.innerHTML = '<option value="">Todos</option>';

  const anoAtual = new Date().getFullYear();

  // Exibir anos anteriores e futuros
  for (let ano = anoAtual + 2; ano >= anoAtual - 5; ano--) {

    const option = document.createElement("option");

    option.value = String(ano);
    option.textContent = String(ano);

    filtroAno.appendChild(option);

  }

  // Restaurar seleção, se existir
  if ([...filtroMes.options].some(
    option => option.value === mesSelecionado
  )) {
    filtroMes.value = mesSelecionado;
  }

  if ([...filtroAno.options].some(
    option => option.value === anoSelecionado
  )) {
    filtroAno.value = anoSelecionado;
  }
}



