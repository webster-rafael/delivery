document.addEventListener("DOMContentLoaded", function (event) {
  app.event.init();
  item.event.init();
});

var item = {};

var ITEM_ID = 0;
var PRODUTO = {};
var VALIDACOES = [];
var OPCIONAIS = [];
var OPCIONAIS_SELECIONADOS = [];
var QUANTIDADE_SELECIONADA = 1;

item.event = {
  init: () => {
    let url = new URL(window.location.href);
    var p = url.searchParams.get("p");

    if (p != null && p.trim() != "" && !isNaN(p)) {
      ITEM_ID = p;
      item.method.obterDadosProduto();
      item.method.obterOpcionaisProduto();
    } else {
      window.location.href = "/index.html";
    }
  },
};

item.method = {
  // obtem os dados do produto
  obterDadosProduto: () => {
    app.method.loading(true);
    PRODUTO = {};

    app.method.get(
      "/produto/" + ITEM_ID,
      (response) => {
        console.log(response);
        app.method.loading(false);

        if (response.status == "error") {
          app.method.mensagem(response.message);
          return;
        }

        let produto = response.data[0];
        PRODUTO = produto;

        // carrega as informações do produto

        if (produto.imagem != null) {
          document.getElementById(
            "img-produto"
          ).style.backgroundImage = `url('../public/images/${produto.imagem}')`;
          document.getElementById("img-produto").style.backgroundSize = "cover";
        } else {
          document.getElementById(
            "img-produto"
          ).style.backgroundImage = `url('../public/images/default.jpg')`;
          document.getElementById("img-produto").style.backgroundSize = "cover";
        }

        document.getElementById("titulo-produto").innerText = produto.nome;
        document.getElementById("descricao-produto").innerText =
          produto.descricao;

        let preco = parseFloat(produto.valor); // Tente converter para número
        if (!isNaN(preco)) {
          document.getElementById("preco-produto").innerText = `R$ ${preco
            .toFixed(2)
            .replace(".", ",")}`;
          document.getElementById("btn-preco-produto").innerText = `R$ ${preco
            .toFixed(2)
            .replace(".", ",")}`;
        } else {
          console.error("O valor do produto não é numérico:", produto.valor);
          document.getElementById("preco-produto").innerText =
            "Preço indisponível";
          document.getElementById("btn-preco-produto").innerText =
            "Preço indisponível";
        }
      },
      (error) => {
        app.method.loading(false);
        console.log("error", error);
      },
      true
    );
  },

  // obtem os opcinais do produto
  obterOpcionaisProduto: () => {
    app.method.get(
      "/opcional/produto/" + ITEM_ID,
      (response) => {
        console.log(response);

        if (response.status == "error") {
          app.method.mensagem(response.message);
          return;
        }

        OPCIONAIS = response.data;

        item.method.carregarOpcionais(response.data);
        item.method.carregarOpcionaisSimples(response.data);
      },
      (error) => {
        console.log("error", error);
      },
      true
    );
  },

  carregarOpcionais: (lista) => {
    document.querySelector("#listaOpcionais").innerHTML = "";

    if (lista.length > 0) {
      // agrupa pelo tipo selecao (opcionais de selecao)
      let listaSelecao = lista.filter((elem) => {
        return elem.tiposimples == 0;
      });

      let listaAgrupada = listaSelecao.reduce(function (obj, item) {
        obj[item.idopcional] = obj[item.idopcional] || [];
        obj[item.idopcional].push(item);
        return obj;
      }, {});

      console.log("listaAgrupada", listaAgrupada);

      Object.entries(listaAgrupada).forEach((e, i) => {
        let opcional = e[1];

        let obrigatorio = "";
        let subtitulo = "";
        let itens = "";

        // valida se é obrigatorio ou não e altera o subtitulo
        let minimo = opcional[0].minimo;
        let maximo = opcional[0].maximo;

        if (minimo == maximo) {
          if (minimo > 1) {
            subtitulo = `Escolha ${minimo} opções`;
            obrigatorio = `<span class="badge" id="badge-obrigatorio-${e[0]}">Obrigatório</span>`;
            VALIDACOES.push({ idopcional: e[0] }); // ja deixa o id do opcional na variavel global pra saber que precisa ser validada
          } else {
            subtitulo = `Escolha 1 opção`;
            obrigatorio = `<span class="badge" id="badge-obrigatorio-${e[0]}">Obrigatório</span>`;
            VALIDACOES.push({ idopcional: e[0] }); // ja deixa o id do opcional na variavel global pra saber que precisa ser validada
          }
        }

        if (minimo < maximo) {
          if (minimo > 0) {
            subtitulo = `Escolha de ${minimo} até ${maximo} opções`;
            obrigatorio = `<span class="badge" id="badge-obrigatorio-${e[0]}">Obrigatório</span>`;
            VALIDACOES.push({ idopcional: e[0] }); // ja deixa o id do opcional na variavel global pra saber que precisa ser validada
          } else {
            if (maximo > 1) {
              subtitulo = `Escolha até ${maximo} opções`;
            } else {
              subtitulo = `Escolha até 1 opção`;
            }
          }
        }

        // monta a lista de itens
        for (let index = 0; index < opcional.length; index++) {
          let element = opcional[index];

          let valor = "";

          if (element.valoropcional > 0) {
            valor = `+ R$ ${element.valoropcional
              .toFixed(2)
              .replace(".", ",")}`;
          }

          itens += item.template.opcionalItem
            .replace(/\${idopcionalitem}/g, element.idopcionalitem)
            .replace(/\${nome}/g, element.nomeopcional)
            .replace(/\${valor}/g, valor)
            .replace(/\${idopcional}/g, e[0]);
        }

        let temp = item.template.opcional
          .replace(/\${idopcional}/g, e[0])
          .replace(/\${obrigatorio}/g, obrigatorio)
          .replace(/\${titulo}/g, opcional[0].titulo)
          .replace(/\${sub-titulo}/g, subtitulo)
          .replace(/\${minimo}/g, minimo)
          .replace(/\${maximo}/g, maximo)
          .replace(/\${itens}/g, itens);

        document.querySelector("#listaOpcionais").innerHTML += temp;
      });
    }
  },

  carregarOpcionaisSimples: (lista) => {
    let listaSimples = lista.filter((elem) => {
      return elem.tiposimples == 1;
    });

    document.querySelector("#listaOpcionaisSimples").innerHTML = "";

    if (listaSimples.length > 0) {
      document
        .querySelector("#containerOpcionaisSimples")
        .classList.remove("hidden");

      listaSimples.forEach((e, i) => {
        let valor = "";
        let valorOpcional = parseFloat(e.valoropcional); // Certifique-se de que o valor é numérico
        if (!isNaN(valorOpcional) && valorOpcional > 0) {
          valor = `+ R$ ${valorOpcional.toFixed(2).replace(".", ",")}`;
        } else {
          valor = ""; // Se o valor não for válido, não adicionar nada
        }
        console.log(`Item ${i}: ${valor}`);

        let temp = item.template.opcionalItemSimples
          .replace(/\${idopcionalitem}/g, e.idopcionalitem)
          .replace(/\${nome}/g, e.nomeopcional)
          .replace(/\${valor}/g, valor);

        document.querySelector("#listaOpcionaisSimples").innerHTML += temp;
      });
    } else {
      document.querySelector("#containerOpcionaisSimples").remove();
    }
  },

  // seleciona o opcional
  selecionarOpcional: (idopcionalitem, idopcional) => {
    let selecionado = document.querySelector(
      "#check-opcional-" + idopcionalitem
    ).checked;
    let inputSelecao = document.getElementsByClassName(
      "paiopcional-" + idopcional
    );
    let opcional = OPCIONAIS.filter((e) => {
      return e.idopcionalitem == idopcionalitem;
    });

    console.log("selecionado", selecionado);
    console.log("inputSelecao", inputSelecao);
    console.log("opcional", opcional);

    // faz as validações
    if (opcional[0].minimo === opcional[0].maximo) {
      if (opcional[0].minimo > 1) {
        // +1 opção && obrigatorio (Escolha 'minimo' opções)
        item.method.validacaoCheckMaisdeUmaOpcao(
          opcional,
          selecionado,
          idopcional,
          idopcionalitem,
          true
        );
      } else {
        // 1 opção && obrigatorio (Escolha 1 opção)
        item.method.validacaoCheckUmaOpcao(
          opcional,
          selecionado,
          idopcional,
          idopcionalitem,
          inputSelecao,
          true
        );
      }
    }

    if (opcional[0].minimo < opcional[0].maximo) {
      if (opcional[0].minimo > 0) {
        // de +1 até + 2 opções && obrigatorio (Escolha de 'minimo' até 'maximo' opções)
        item.method.validacaoCheckMaisdeUmaOpcao(
          opcional,
          selecionado,
          idopcional,
          idopcionalitem,
          true
        );
      } else {
        if (opcional[0].maximo > 1) {
          // +1 opção && NÃO obrigatorio (Escolha até 'maximo' opções)
          item.method.validacaoCheckMaisdeUmaOpcao(
            opcional,
            selecionado,
            idopcional,
            idopcionalitem
          );
        } else {
          // 1 opção && NÃO obrigatorio (Escolha até 1 opção)
          item.method.validacaoCheckUmaOpcao(
            opcional,
            selecionado,
            idopcional,
            idopcionalitem,
            inputSelecao
          );
        }
      }
    }
  },

  // método para validar os checks de +1 opção e Obrigatorio
  validacaoCheckMaisdeUmaOpcao: (
    opcional,
    selecionado,
    idopcional,
    idopcionalitem,
    obrigatorio = false
  ) => {
    // obtem quantas opções já tem na lista
    let filtro = OPCIONAIS_SELECIONADOS.filter((e) => {
      return e.idopcional == idopcional;
    });

    // se chegou no máximo, trava a seleção de mais opções
    if (filtro.length >= opcional[0].maximo) {
      if (selecionado) {
        // Se for para selecionar, remove o check do atual e não adiciona
        document.querySelector(
          "#check-opcional-" + idopcionalitem
        ).checked = false;
        app.method.mensagem(`Limite de ${opcional[0].maximo} opções atingido.`);
      } else {
        // Se não estiver selecionado, então remove o item da lista
        let outros = OPCIONAIS_SELECIONADOS.filter((e) => {
          return e.idopcionalitem != idopcionalitem;
        });
        OPCIONAIS_SELECIONADOS = outros;
      }
    } else {
      // não atingiu o limite das opções selecionadas

      if (selecionado) {
        // Se for para selecionar, adiciona na lista
        OPCIONAIS_SELECIONADOS.push(opcional[0]);
      } else {
        // Se não estiver selecionado, então remove o item da lista
        let outros = OPCIONAIS_SELECIONADOS.filter((e) => {
          return e.idopcionalitem != idopcionalitem;
        });
        OPCIONAIS_SELECIONADOS = outros;
      }
    }

    if (obrigatorio) {
      // valida quantos opcionais foram selecionados
      let filtroOpcionais = OPCIONAIS_SELECIONADOS.filter((e) => {
        return e.idopcional == idopcional;
      });

      if (filtroOpcionais.length >= opcional[0].maximo) {
        // remove as validações
        let filtroValidacoes = VALIDACOES.filter((e) => {
          return e.idopcional != idopcional;
        });
        VALIDACOES = filtroValidacoes;
        document.querySelector("#badge-obrigatorio-" + idopcional).innerHTML =
          '<i class="fas fa-check"></i>';
      } else {
        VALIDACOES.push({ idopcional: idopcional });
        document.querySelector("#badge-obrigatorio-" + idopcional).innerHTML =
          "Obrigatório";
      }
    }

    item.method.atualizarSacola();
  },

  validacaoCheckUmaOpcao: (
    opcional,
    selecionado,
    idopcional,
    idopcionalitem,
    inputSelecao,
    obrigatorio = false
  ) => {
    // remove o check de todos
    Array.from(inputSelecao).forEach((e) => {
      e.checked = false;
    });

    // remove todos dos opcionais selecionados
    let filtro = OPCIONAIS_SELECIONADOS.filter((e) => {
      return e.idopcional != idopcional;
    });
    OPCIONAIS_SELECIONADOS = filtro;

    if (selecionado) {
      // adicona o check no atual e adiciona ele nos opcionais selecionados
      document.querySelector(
        "#check-opcional-" + idopcionalitem
      ).checked = true;
      OPCIONAIS_SELECIONADOS.push(opcional[0]);

      if (obrigatorio) {
        let filtroValidacoes = VALIDACOES.filter((e) => {
          return e.idopcional != idopcional;
        });
        VALIDACOES = filtroValidacoes;
        document.querySelector("#badge-obrigatorio-" + idopcional).innerHTML =
          '<i class="fas fa-check"></i>';
      }
    } else {
      if (obrigatorio) {
        // adiciona para validação
        VALIDACOES.push({ idopcional: idopcional });
        document.querySelector("#badge-obrigatorio-" + idopcional).innerHTML =
          "Obrigatório";
      }
    }

    item.method.atualizarSacola();
  },

  // seleciona o opcional clicado (simples)
  selecionarOpcionalSimples: (idopcionalitem) => {
    let selecionado = document.querySelector(
      "#check-opcional-" + idopcionalitem
    ).checked;
    let opcional = OPCIONAIS.filter((e) => {
      return e.idopcionalitem == idopcionalitem;
    });

    if (selecionado) {
      // adiciona
      let filtro = OPCIONAIS_SELECIONADOS.filter((e) => {
        return e.idopcionalitem == opcional[0].idopcionalitem;
      });

      if (filtro.length <= 0) {
        OPCIONAIS_SELECIONADOS.push(opcional[0]);
      }
    } else {
      // remove
      let filtro = OPCIONAIS_SELECIONADOS.filter((e) => {
        return e.idopcionalitem != opcional[0].idopcionalitem;
      });
      OPCIONAIS_SELECIONADOS = filtro;
    }

    item.method.atualizarSacola();
  },

  // atualiza o valor total da sacola
  atualizarSacola: () => {
    // Garantir que PRODUTO.valor seja um número válido
    let valorTotal = parseFloat(PRODUTO.valor) || 0;
  
    // Verificar se OPCIONAIS_SELECIONADOS é um array
    if (Array.isArray(OPCIONAIS_SELECIONADOS)) {
      OPCIONAIS_SELECIONADOS.forEach(element => {
        // Garantir que o valor do opcional seja um número válido
        if (element.valoropcional > 0) {
          valorTotal += parseFloat(element.valoropcional) || 0;
        }
      });
    }
  
    // Calcular o valor total multiplicando pela quantidade selecionada
    valorTotal *= QUANTIDADE_SELECIONADA || 1;
  
    // Atualizar o preço no botão
    const precoFormatado = valorTotal.toFixed(2).replace('.', ',');
    const btnPrecoProduto = document.getElementById("btn-preco-produto");
    if (btnPrecoProduto) {
      btnPrecoProduto.innerText = `R$ ${precoFormatado}`;
    }
  },  

  // diminui a quantidade selecionada
  diminuirQuantidade: () => {
    if (QUANTIDADE_SELECIONADA == 1) {
      return;
    }

    QUANTIDADE_SELECIONADA -= 1;
    document.querySelector("#qntd-carrinho").innerText = QUANTIDADE_SELECIONADA;
    item.method.atualizarSacola();
  },

  // aumenta a quantidade selecionada
  aumentarQuantidade: () => {
    QUANTIDADE_SELECIONADA += 1;
    document.querySelector("#qntd-carrinho").innerText = QUANTIDADE_SELECIONADA;
    item.method.atualizarSacola();
  },

  adicionarAoCarrinho: () => {
    let observacao = document.querySelector("#txtObservacao").value.trim();

    // valida os campos
    if (VALIDACOES.length > 0) {
      app.method.mensagem("Selecione os campos obrigatórios.");
      return;
    }

    // primeiro, pego o carrinho que já existe no local
    let carrinho = app.method.obterValorSessao("cart");

    // inicia um carrinho
    let cart = {
      itens: [],
    };

    if (carrinho != undefined) {
      cart = JSON.parse(carrinho);
    }

    let guid = app.method.criarGuid();

    cart.itens.push({
      guid: guid,
      idproduto: PRODUTO.idproduto,
      nome: PRODUTO.nome,
      imagem: PRODUTO.imagem,
      valor: PRODUTO.valor,
      quantidade: QUANTIDADE_SELECIONADA,
      observacao: observacao,
      opcionais: OPCIONAIS_SELECIONADOS,
    });

    // seta o produto no localstorage
    app.method.gravarValorSessao(JSON.stringify(cart), "cart");

    app.method.mensagem("Item adicionado ao carrinho.", "green");

    setTimeout(() => {
      window.location.href = "/index.html";
    }, 1500);
  },
};

item.template = {
  opcional: `
        <div class="container-group mb-5" data-minimo="\${minimo}" data-maximo="\${maximo}" id="opcional-\${idopcional}">
            \${obrigatorio}
            <p class="title-categoria mb-0"><b>\${titulo}</b></p>
            <span class="sub-title-categoria">\${sub-titulo}</span>
            \${itens}
        </div>
    `,

  opcionalItem: `
        <div class="card card-opcionais mt-2">
            <div class="infos-produto-opcional">
                <p class="name mb-0"><b>\${nome}</b></p>
                <p class="price mb-0"><b>\${valor}</b></p>
            </div>
            <div class="checks">
                <label class="container-check">
                    <input id="check-opcional-\${idopcionalitem}" type="checkbox" class="paiopcional-\${idopcional}" onchange="item.method.selecionarOpcional('\${idopcionalitem}', \${idopcional})" />
                    <span class="checkmark"></span>
                </label>
            </div>
        </div>
    `,

  opcionalItemSimples: `
        <div class="card card-opcionais mt-2">
            <div class="infos-produto-opcional">
                <p class="name mb-0"><b>\${nome}</b></p>
                <p class="price mb-0"><b>\${valor}</b></p>
            </div>
            <div class="checks">
                <label class="container-check">
                    <input id="check-opcional-\${idopcionalitem}" type="checkbox" onchange="item.method.selecionarOpcionalSimples('\${idopcionalitem}')" />
                    <span class="checkmark"></span>
                </label>
            </div>
        </div>
    `,
};
