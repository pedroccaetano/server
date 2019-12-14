const request = require("request-promise");
const cheerio = require("cheerio");
const moment = require("moment");
const nanoid = require("nanoid");
moment.locale("pt-BR");

const {
  regexProduto,
  regexNome,
  regexQuantidade,
  regexPrecoUnitario,
  regexPrecoTotal,
  regexCNPJ,
  regexCep,
  regexTelefone,
  regexEndereco,
  regexMunicipio,
  regexDataEmisao,
  regexRemoveMascara
} = require("../utils/regex");

const { isSafe, baseRequestOptions } = require("../utils");

class Tocantins {
  async scraper(url, email) {
    return new Promise(async (resolve, reject) => {
      await request(baseRequestOptions(url))
        .then(async html => {
          let $ = cheerio.load(html);
          let nome_razao = $("label#j_id_19\\:j_id_1u").text();
          let cnpj = $("label#j_id_19\\:j_id_1v")
            .text()
            .match(regexCNPJ)[0]
            .replace(regexRemoveMascara, "");
          let escricao_estadual = $("label#j_id_19\\:j_id_1w")
            .text()
            .replace(regexRemoveMascara, "");
          let dadosEmitente = $("label#j_id_19\\:j_id_1x").text();
          let cep = dadosEmitente.match(regexCep)[0];

          let telefone = "";
          try {
            telefone = dadosEmitente.match(regexTelefone);
          } catch (e) {
            console.log("Emitente sem telefone.");
          }

          let endereco = dadosEmitente.match(regexEndereco)[0];
          let municipio = dadosEmitente.match(regexMunicipio)[0];
          let versao = $("label#j_id_19\\:j_id_2o\\:j_id_34").text();
          let chave = $(
            "tr:contains('Chave de acesso:') td:nth-of-type(2)"
          ).text();
          let serie = $("tr:contains('Série:') td:nth-of-type(2)").text();
          let numero = $("tr:contains('Número:') td:nth-of-type(2)").text();
          let data_emissao = $("tr:contains('Emissão:') td:nth-of-type(2)")
            .text()
            .match(regexDataEmisao)[0];
          let data_emissao_formatada = moment(
            data_emissao,
            "DD-MM-YYYY"
          ).format("LL");
          let valor_nota = $(
            "div.ui-g:nth-of-type(2) div:nth-of-type(2)"
          ).text();

          let temPaginacao = $(
            "div.ui-paginator-bottom span.ui-paginator-pages"
          )
            .text()
            .replace(regexRemoveMascara, "")
            .split("")
            .map(elem => parseInt(elem));

          let produtos = [];
          if (temPaginacao.length) {
            while (temPaginacao.length) {
              if (temPaginacao[0] === 1) {
                var produtosHtml = $("tbody.ui-widget-content tr td");

                produtos = produtos.concat(this.buscarProdutos(produtosHtml));
              } else {
                await request(baseRequestOptions(url, true, temPaginacao[0]))
                  .then(html => {
                    let $ = cheerio.load(html);

                    var produtosHtml = $("tbody.ui-widget-content tr td");

                    produtos = produtos.concat(
                      this.buscarProdutos(produtosHtml)
                    );
                  })
                  .catch(error => {
                    reject(error);
                  });
              }
              temPaginacao.splice(0, 1);
            }
          } else {
            var produtosHtml = $("tbody.ui-widget-content tr td");

            produtos = this.buscarProdutos(produtosHtml);
          }

          data_emissao = data_emissao.split("/");
          data_emissao = new Date(
            data_emissao[2],
            data_emissao[1] - 1,
            data_emissao[0]
          ).toISOString();

          let nota = {
            user: {
              email
            },
            nfce: {
              url: isSafe(() => url, null),
              versao: isSafe(() => versao, null),
              chave: isSafe(() => chave, null),
              modelo: isSafe(() => "", null),
              serie: isSafe(() => serie, null),
              numero: isSafe(() => numero, null),
              data_emissao: isSafe(() => data_emissao, null),
              data_emissao_formatada: isSafe(
                () => data_emissao_formatada,
                null
              ),
              valor_produto: isSafe(
                () => valor_nota.replace(/,/, ".").substr(3),
                null
              ),
              valor_nota: isSafe(
                () => valor_nota.replace(/,/, ".").substr(3),
                null
              )
            },
            emitente: {
              nome_razao: isSafe(() => nome_razao, null),
              nome_fantasia: isSafe(() => nome_razao, null),
              cnpj: isSafe(() => cnpj, null),
              escricao_estadual: isSafe(() => escricao_estadual, null),
              endereco: isSafe(() => endereco, null),
              bairro_distrito: isSafe(() => "", null),
              cep: isSafe(() => cep, null),
              municipio: isSafe(() => municipio, null),
              telefone: isSafe(() => telefone, null),
              uf: isSafe(() => "TO", null)
            },
            produtos
          };

          resolve(nota);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  buscarProdutos = html => {
    let $ = cheerio.load(html);

    let produtos = [];
    let produto = {};

    $(html).each(function(i, elem) {
      let texto = $(this)
        .text()
        .trim();

      if (texto.match(regexProduto)) {
        produto.codigo = nanoid();
      }

      if (texto.match(regexProduto)) {
        produto.codigo_produto = texto.match(regexProduto)[0];
      }

      if (texto.match(regexNome)) {
        produto.nome = texto.match(regexNome)[0];
      }

      if (texto.match(regexQuantidade)) {
        produto.quantidade = texto.match(regexQuantidade)[0];
      }

      if (texto.match(regexQuantidade)) {
        produto.quantidade = texto.match(regexQuantidade)[0];
      }

      if (texto.match(regexPrecoUnitario)) {
        produto.preco_unitario = texto
          .match(regexPrecoUnitario)[0]
          .replace(/,/, ".");
      }

      if (texto.match(regexPrecoTotal)) {
        produto.preco_total = texto.match(regexPrecoTotal)[0].replace(/,/, ".");

        produtos.push(produto);

        produto = {};
      }
    });

    return produtos;
  };
}

module.exports = new Tocantins();
