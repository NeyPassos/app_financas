
/* ==========================================
   APP FINANÇAS - CARTÕES DE CRÉDITO
========================================== */

let cartoesCadastrados = [];
let cartoesCarregados = false;
let salvandoCartao = false;
let lancamentosImportacao = [];
let arquivoImportacao = null;
let importandoFatura = false;
let faturasCadastradas = [];
let faturasCarregadas = false;
let dadosOficiaisImportacao = null;

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

  document.getElementById("btnConfirmarImportacao")
  .addEventListener(
    "click",
    confirmarImportacaoFatura
  );

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
      EVENTOS CONSULTAR FATURA
    ========================================== */

    document.getElementById("btnFecharConsultaFatura")
      ?.addEventListener("click", fecharConsultaFatura);

    document.getElementById("btnFecharConsultaRodape")
      ?.addEventListener("click", fecharConsultaFatura);

    document.getElementById("modalConsultarFatura")
      ?.addEventListener("click", evento => {

        if (evento.target.id === "modalConsultarFatura") {
          fecharConsultaFatura();
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
      fecharConsultaFatura();

    }
  });

   /* ==========================================
    FILTROS DAS FATURAS
  ========================================== */

  ["filtroCartao", "filtroMes", "filtroAno"].forEach(id => {

    document.getElementById(id)
      ?.addEventListener("change", exibirFaturas);

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

    await carregarFaturas();

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

  // Limpar dados da importação anterior
  lancamentosImportacao = [];
  arquivoImportacao = null;

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

  dadosOficiaisImportacao = null;

  document.getElementById(
    "modalImportarFatura"
  ).hidden = true;

}


/* ==========================================
   ANALISAR FATURA CSV OU PDF
========================================== */

async function analisarArquivoFatura(evento) {

  dadosOficiaisImportacao = null;

  evento?.preventDefault();

  const idCartao = document.getElementById("importarCartao").value;
  const mes = Number(document.getElementById("importarMes").value);
  const ano = Number(document.getElementById("importarAno").value);
  const arquivo = document.getElementById("arquivoFatura")?.files[0];

  const btnConfirmar = document.getElementById("btnConfirmarImportacao");
  const btnAnalisar = document.getElementById("btnAnalisarFatura");

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
    mostrarStatus("Informe mês e ano válidos.");
    return;
  }

  if (!arquivo) {
    mostrarStatus("Selecione um arquivo CSV ou PDF.");
    return;
  }

  const extensao = arquivo.name.split(".").pop().toLowerCase();

  if (!["csv", "pdf"].includes(extensao)) {
    mostrarStatus("Formato não permitido. Utilize CSV ou PDF.");
    return;
  }

  try {

    btnAnalisar.disabled = true;
    btnAnalisar.textContent = "Analisando...";

    let registros;

    if (extensao === "csv") {

      const conteudo = await arquivo.text();
      registros = lerCSVFatura(conteudo);

    } else {

      const resultadoPDF = await lerPDFFaturaNubank(arquivo);

      dadosOficiaisImportacao = {
      vencimento: resultadoPDF.vencimento,
      valor_oficial: resultadoPDF.valorOficial
    };

      if (resultadoPDF.mes !== mes || resultadoPDF.ano !== ano) {
        throw new Error(
          "O PDF pertence à fatura " +
          String(resultadoPDF.mes).padStart(2, "0") +
          "/" + resultadoPDF.ano +
          ". Corrija o mês e ano selecionados."
        );
      }

      registros = resultadoPDF.lancamentos;

      console.log("Resumo do PDF:", {
        vencimento: resultadoPDF.vencimento,
        valorOficial: resultadoPDF.valorOficial,
        movimentos: registros.length
      });

    }

    if (!registros.length) {
      throw new Error("Nenhum lançamento encontrado.");
    }

    lancamentosImportacao = registros;
    arquivoImportacao = arquivo;

    exibirPreviaFatura(registros);

    btnConfirmar.disabled = false;

    mostrarStatus(
      registros.length +
      " lançamento(s) identificado(s) no " +
      extensao.toUpperCase() + "."
    );

  } catch (erro) {

    console.error("Erro ao analisar fatura:", erro);
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
   EXTRAIR LINHAS DE TEXTO DO PDF
========================================== */

async function extrairLinhasPDF(arquivo) {

  if (!window.pdfjsLib) {
    throw new Error(
      "PDF.js não carregado. Verifique o script no cartao.html."
    );
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const bytes = new Uint8Array(await arquivo.arrayBuffer());

  const documento = await pdfjsLib.getDocument({
    data: bytes
  }).promise;

  const paginas = [];

  try {

    for (let numero = 1; numero <= documento.numPages; numero++) {

      const pagina = await documento.getPage(numero);
      const conteudo = await pagina.getTextContent();

      const itens = conteudo.items
        .filter(item => item.str && item.str.trim())
        .map(item => ({
          texto: item.str.trim(),
          x: item.transform[4],
          y: item.transform[5]
        }))
        .sort((a, b) => b.y - a.y || a.x - b.x);

      const linhas = [];

      for (const item of itens) {

        // Agrupa textos que estão na mesma altura da página.
        let linha = linhas.find(
          atual => Math.abs(atual.y - item.y) <= 2.5
        );

        if (!linha) {
          linha = { y: item.y, itens: [] };
          linhas.push(linha);
        }

        linha.itens.push(item);
      }

      paginas.push(
        linhas
          .sort((a, b) => b.y - a.y)
          .map(linha =>
            linha.itens
              .sort((a, b) => a.x - b.x)
              .map(item => item.texto)
              .join(" ")
              .replace(/\s+/g, " ")
              .trim()
          )
      );

    }

    return paginas;

  } finally {

    await documento.destroy();

  }
}


/* ==========================================
   LER PDF DE FATURA NUBANK
========================================== */

async function lerPDFFaturaNubank(arquivo) {

  const paginas = await extrairLinhasPDF(arquivo);

  const textoGeral = paginas.flat().join("\n");

  const meses = {
    JAN: 1, FEV: 2, MAR: 3, ABR: 4,
    MAI: 5, JUN: 6, JUL: 7, AGO: 8,
    SET: 9, OUT: 10, NOV: 11, DEZ: 12
  };

  const cabecalho = textoGeral.match(
    /FATURA\s+(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(\d{4})/i
  );

  if (!cabecalho) {
    throw new Error(
      "Não foi possível identificar a referência da fatura Nubank."
    );
  }

  const diaVencimento = Number(cabecalho[1]);
  const mes = meses[cabecalho[2].toUpperCase()];
  const ano = Number(cabecalho[3]);

  const vencimento =
    ano + "-" +
    String(mes).padStart(2, "0") + "-" +
    String(diaVencimento).padStart(2, "0");

  const resumo = textoGeral.match(
    /Total a pagar\s+R\$\s*([\d.,]+)/i
  );

  const valorOficial = resumo
    ? converterValorFatura(resumo[1])
    : null;

  const paginaTransacoes = paginas.find(pagina =>
    pagina.some(linha => /^TRANSAÇÕES\b/i.test(linha))
  );

  if (!paginaTransacoes) {
    throw new Error(
      "A seção TRANSAÇÕES não foi encontrada no PDF."
    );
  }

  const lancamentos = [];

  let naSecaoTransacoes = false;
  let naSecaoPagamentos = false;

  const padraoTransacao =
    /^(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(?:(?:[•*·]{2,4})\s*\d{4}\s+)?(.+?)\s+([−-]?\s*R\$\s*[\d.,]+)$/i;

  for (const linhaOriginal of paginaTransacoes) {

    const linha = linhaOriginal
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (/^TRANSAÇÕES\b/i.test(linha)) {
      naSecaoTransacoes = true;
      continue;
    }

    if (!naSecaoTransacoes) continue;

    if (/^Pagamentos\b/i.test(linha)) {
      naSecaoPagamentos = true;
      continue;
    }

    if (/^Em cumprimento/i.test(linha)) {
      break;
    }

    const resultado = linha.match(padraoTransacao);

    if (!resultado) continue;

    const diaCompra = Number(resultado[1]);
    const mesCompra = meses[resultado[2].toUpperCase()];
    const descricao = resultado[3].trim();

    const valorTexto = resultado[4]
      .replace(/\s/g, "")
      .replace("R$", "")
      .replace("−", "-");

    const valor = converterValorFatura(valorTexto);

    // Compras podem pertencer ao ano anterior à referência.
    let anoCompra = ano;

    if (mesCompra > mes) {
      anoCompra--;
    }

    const dataValidada = new Date(
      Date.UTC(anoCompra, mesCompra - 1, diaCompra)
    );

    if (
      dataValidada.getUTCFullYear() !== anoCompra ||
      dataValidada.getUTCMonth() !== mesCompra - 1 ||
      dataValidada.getUTCDate() !== diaCompra
    ) {
      throw new Error("Data inválida no PDF: " + linha);
    }

    const dataCompra =
      anoCompra + "-" +
      String(mesCompra).padStart(2, "0") + "-" +
      String(diaCompra).padStart(2, "0");

    const parcela = descricao.match(
      /parcela\s+(\d+)\s*\/\s*(\d+)/i
    );

    const parcelaAtual = parcela ? Number(parcela[1]) : 1;
    const totalParcelas = parcela ? Number(parcela[2]) : 1;

    if (
      parcelaAtual < 1 ||
      totalParcelas < parcelaAtual
    ) {
      throw new Error("Parcelamento inválido: " + descricao);
    }

    const tipoMovimento =
      naSecaoPagamentos || valor < 0
        ? "Pagamento"
        : /\bIOF\b|juros|multa/i.test(descricao)
          ? "Encargo"
          : "Compra";

    lancamentos.push({
      data_compra: dataCompra,
      descricao,
      parcela_atual: parcelaAtual,
      total_parcelas: totalParcelas,
      valor: tipoMovimento === "Pagamento"
        ? -Math.abs(valor)
        : valor,
      tipo_movimento: tipoMovimento
    });

  }

  if (!lancamentos.length) {
    throw new Error(
      "Nenhuma transação reconhecida. Verifique o formato do PDF."
    );
  }

  return {
    mes,
    ano,
    vencimento,
    valorOficial,
    lancamentos
  };
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


/* ==========================================
   CONFIRMAR IMPORTAÇÃO DA FATURA
========================================== */

async function confirmarImportacaoFatura() {

  if (importandoFatura) return;

  const idCartao = document.getElementById(
    "importarCartao"
  ).value;

  const mes = Number(
    document.getElementById("importarMes").value
  );

  const ano = Number(
    document.getElementById("importarAno").value
  );

  const botao = document.getElementById(
    "btnConfirmarImportacao"
  );

  if (!idCartao ||
      !Number.isInteger(mes) ||
      mes < 1 || mes > 12 ||
      !Number.isInteger(ano) ||
      ano < 1900 || ano > 9999) {

    mostrarStatus("Informe cartão, mês e ano válidos.");
    return;
  }

  if (!arquivoImportacao) {
    mostrarStatus("Selecione e analise um arquivo.");
    return;
  }

  if (!lancamentosImportacao.length) {
    mostrarStatus("Nenhum lançamento analisado.");
    return;
  }

  
const dados = {
  id_cartao: idCartao,
  mes: mes,
  ano: ano,

  arquivo_origem: arquivoImportacao.name,

  origem: arquivoImportacao.name
    .toLowerCase()
    .endsWith(".pdf")
      ? "PDF"
      : "CSV",

  vencimento:
    dadosOficiaisImportacao?.vencimento || "",

  valor_oficial:
    dadosOficiaisImportacao?.valor_oficial ?? null,

  lancamentos: lancamentosImportacao
};


  try {

    importandoFatura = true;

    botao.disabled = true;
    botao.textContent = "Importando...";

    const resposta =
      await apiImportarLancamentosCartao(dados);

    if (!resposta ||
        resposta.sucesso === false ||
        resposta.erro) {

      throw new Error(
        resposta?.mensagem ||
        resposta?.erro ||
        "Falha ao importar a fatura."
      );
    }

    const resultado = resposta.dados;

    if (!resultado ||
        !Number.isFinite(Number(resultado.importados)) ||
        !Number.isFinite(Number(resultado.duplicados))) {

      throw new Error(
        "A API retornou uma resposta inesperada."
      );
    }

    const mensagem =
      "Importação concluída! " +
      resultado.importados +
      " lançamento(s) importado(s), " +
      resultado.duplicados +
      " duplicado(s).";

    // Limpar dados temporários
    lancamentosImportacao = [];
    arquivoImportacao = null;

    // Fechar modal
    fecharModalImportacao();

    // Atualizar filtros e listagem
    document.getElementById(
      "filtroCartao"
    ).value = String(idCartao);

    document.getElementById(
      "filtroMes"
    ).value = String(mes);

    document.getElementById(
      "filtroAno"
    ).value = String(ano);

    if (typeof carregarFaturas === "function") {
      await carregarFaturas();
    }

    mostrarStatus(mensagem);

  } catch (erro) {

    console.error(
      "Erro ao importar fatura:",
      erro
    );

    mostrarStatus(
      "Erro ao importar fatura: " +
      erro.message
    );

  } finally {

    importandoFatura = false;

    botao.disabled = false;
    botao.textContent = "Confirmar importação";

  }
}


/* ==========================================
   CARREGAR FATURAS
========================================== */

async function carregarFaturas() {

  const lista = document.getElementById("listaFaturas");

  lista.replaceChildren();

  const linha = lista.insertRow();
  const celula = linha.insertCell();

  celula.colSpan = 7;
  celula.textContent = "Carregando faturas...";

  try {

    const resposta = await apiListarFaturas();

    faturasCadastradas = Array.isArray(resposta.dados)
      ? resposta.dados
      : [];

    faturasCarregadas = true;

    exibirFaturas();

  } catch (erro) {

    console.error("Erro ao carregar faturas:", erro);

    faturasCarregadas = false;

    lista.replaceChildren();

    const linhaErro = lista.insertRow();
    const celulaErro = linhaErro.insertCell();

    celulaErro.colSpan = 7;
    celulaErro.textContent =
      "Erro ao carregar faturas: " + erro.message;

    mostrarStatus(
      "Erro ao carregar faturas: " + erro.message
    );

  }
}


/* ==========================================
   EXIBIR FATURAS COM FILTROS
========================================== */

function exibirFaturas() {

  const lista = document.getElementById("listaFaturas");

  const idCartao = document.getElementById(
    "filtroCartao"
  ).value;

  const mes = document.getElementById(
    "filtroMes"
  ).value;

  const ano = document.getElementById(
    "filtroAno"
  ).value;

  lista.replaceChildren();

  if (!idCartao) {

    const linha = lista.insertRow();
    const celula = linha.insertCell();

    celula.colSpan = 7;
    celula.textContent =
      "Selecione um cartão para consultar.";

    return;
  }

  const faturasFiltradas = faturasCadastradas.filter(
    fatura => {

      return (
        String(fatura.id_cartao) === String(idCartao) &&
        (!mes || Number(fatura.mes) === Number(mes)) &&
        (!ano || Number(fatura.ano) === Number(ano))
      );

    }
  );

  faturasFiltradas.sort((a, b) =>
    Number(b.ano) - Number(a.ano) ||
    Number(b.mes) - Number(a.mes)
  );

  if (!faturasFiltradas.length) {

    const linha = lista.insertRow();
    const celula = linha.insertCell();

    celula.colSpan = 7;
    celula.textContent =
      "Nenhuma fatura encontrada.";

    return;
  }

  const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  faturasFiltradas.forEach(fatura => {

    const cartao = cartoesCadastrados.find(
      item =>
        String(item.id_cartao) ===
        String(fatura.id_cartao)
    );

    const nomeCartao = cartao
      ? cartao.banco + " - " + cartao.nome_cartao
      : "Cartão " + fatura.id_cartao;

    const referencia =
      String(fatura.mes).padStart(2, "0") +
      "/" + fatura.ano;

    const linha = lista.insertRow();

    const valores = [
      fatura.id_fatura,
      nomeCartao,
      referencia,
      fatura.vencimento || "-",
      formatarValorFatura(
      fatura.valor_oficial !== "" &&
      fatura.valor_oficial !== null &&
      fatura.valor_oficial !== undefined
        ? fatura.valor_oficial
        : fatura.valor_total,
      moeda
    ),
      fatura.situacao || "-"
    ];

    valores.forEach(valor => {

      const celula = linha.insertCell();
      celula.textContent = valor;

    });

    const acoes = linha.insertCell();

    const btnConsultar = document.createElement("button");

    btnConsultar.type = "button";
    btnConsultar.textContent = "Consultar";
    btnConsultar.className = "btn-editar";

    btnConsultar.addEventListener("click", () => {
      consultarFatura(fatura.id_fatura);
    });

    acoes.appendChild(btnConsultar);

  });
}


/* ==========================================
   FORMATAR VALOR DA FATURA
========================================== */

function formatarValorFatura(valor, moeda) {

  if (typeof valor === "number") {
    return moeda.format(valor);
  }

  let texto = String(valor ?? "").trim()
    .replace(/R\$\s?/g, "")
    .replace(/\s/g, "");

  if (texto.includes(",")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  }

  const numero = Number(texto);

  return Number.isFinite(numero)
    ? moeda.format(numero)
    : "-";
}


/* ==========================================
   CONSULTAR LANÇAMENTOS DA FATURA
========================================== */

async function consultarFatura(idFatura) {

  const modal = document.getElementById(
    "modalConsultarFatura"
  );

  const lista = document.getElementById(
    "listaConsultaFatura"
  );

  const titulo = document.getElementById(
    "tituloConsultarFatura"
  );

  const informacoes = document.getElementById(
    "informacoesConsultaFatura"
  );

  const totalElemento = document.getElementById(
    "totalConsultaFatura"
  );

  const fatura = faturasCadastradas.find(
    item => String(item.id_fatura) === String(idFatura)
  );

  if (!fatura) {
    mostrarStatus("Fatura não encontrada.");
    return;
  }

  const cartao = cartoesCadastrados.find(
    item =>
      String(item.id_cartao) === String(fatura.id_cartao)
  );

  const nomeCartao = cartao
    ? cartao.banco + " - " + cartao.nome_cartao
    : "Cartão " + fatura.id_cartao;

  const referencia =
    String(fatura.mes).padStart(2, "0") +
    "/" + fatura.ano;

  titulo.textContent = "Consultar fatura";

  informacoes.textContent =
    nomeCartao + " | Referência: " + referencia;

  lista.replaceChildren();

  const linhaCarregando = lista.insertRow();
  const celulaCarregando = linhaCarregando.insertCell();

  celulaCarregando.colSpan = 5;
  celulaCarregando.textContent = "Carregando lançamentos...";

  totalElemento.textContent = "";

  modal.hidden = false;

  try {

    const resposta =
      await apiListarLancamentosCartao(idFatura);

    const lancamentos = Array.isArray(resposta.dados)
      ? resposta.dados
      : [];

    lista.replaceChildren();

    if (!lancamentos.length) {

      const linha = lista.insertRow();
      const celula = linha.insertCell();

      celula.colSpan = 5;
      celula.textContent =
        "Nenhum lançamento encontrado.";

      return;
    }

    const moeda = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

    let total = 0;

    lancamentos.forEach(item => {

      const linha = lista.insertRow();

      const data = String(item.data_compra || "");

      const dataFormatada =
        /^\d{4}-\d{2}-\d{2}$/.test(data)
          ? data.split("-").reverse().join("/")
          : data;

      const parcela =
        item.parcela_atual + "/" + item.total_parcelas;

      const textoValor = String(item.valor ?? "")
        .replace(/R\$\s?/g, "")
        .trim();

      const valor = Number(
        textoValor.includes(",")
          ? textoValor.replace(/\./g, "").replace(",", ".")
          : textoValor
      );

      const valorValido = Number.isFinite(valor)
        ? valor
        : 0;

      total += valorValido;

      const valores = [
        dataFormatada,
        item.descricao || "",
        parcela,
        moeda.format(valorValido),
        item.tipo_movimento || ""
      ];

      valores.forEach(valorCelula => {

        const celula = linha.insertCell();
        celula.textContent = valorCelula;

      });

    });

    totalElemento.textContent =
      "Lançamentos: " + lancamentos.length +
      " | Saldo líquido: " + moeda.format(total);

  } catch (erro) {

    console.error("Erro ao consultar fatura:", erro);

    lista.replaceChildren();

    const linha = lista.insertRow();
    const celula = linha.insertCell();

    celula.colSpan = 5;
    celula.textContent =
      "Erro ao carregar lançamentos: " + erro.message;

  }
}

function fecharConsultaFatura() {

  document.getElementById(
    "modalConsultarFatura"
  ).hidden = true;

}
