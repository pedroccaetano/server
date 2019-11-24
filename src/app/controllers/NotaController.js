const Nota = require("../models/Nota");

class NotaController {
  async store(req, res) {
    const { nota } = req;

    await Nota.create(nota)
      .then(response => {
        return res.json({
          houve_erro: false,
          mensagem: "Nota salva com sucesso.",
          nota: response
        });
      })
      .catch(error => {
        return res.json({
          houve_erro: true,
          mensagem: "Operação cancelada.",
          mensage_error: error
        });
      });
  }

  async find(req, res) {
    console.log("aquiiiiii");
    let { productName, organization, initDate, finalDate, state } = req.params;

    const { email } = req;

    const arrayDateInit = initDate.split("-");
    const arrayDateFinal = finalDate.split("-");

    if (productName == '""') {
      productName = "";
    }

    if (organization == '""') {
      organization = "";
    }

    if (state == '""') {
      state = "";
    }

    console.log(new Date(arrayDateInit[0], arrayDateInit[1], arrayDateInit[2]));

    // console.log(
    //   "user.email",
    //   email,
    //   "emitente.uf",
    //   new RegExp(state, "i"),
    //   "emitente.nome_razao",
    //   new RegExp(organization, "i"),
    //   "produtos.nome",
    //   new RegExp(productName, "i"),
    //   "nfe.data_emissao",
    //   {
    //     $gte: new Date(arrayDateInit[0], arrayDateInit[1], arrayDateInit[2]),
    //     $lte: new Date(arrayDateFinal[0], arrayDateFinal[1], arrayDateFinal[2])
    //   }
    // );

    await Nota.find({
      "user.email": email,
      "emitente.uf": new RegExp(state, "i"),
      "emitente.nome_razao": new RegExp(organization, "i"),
      "produtos.nome": new RegExp(productName, "i"),
      "nfe.data_emissao": {
        $gte: new Date(arrayDateInit[0], arrayDateInit[1], arrayDateInit[2]),
        $lte: new Date(arrayDateFinal[0], arrayDateFinal[1], arrayDateFinal[2])
      }
    })
      .select("produtos emitente")
      .then(response => {
        console.log("Produtos ->", response);
        let notas = [];

        response.map(resposta => {
          let { produtos, emitente } = resposta;

          produtos.map(produto => {
            if (
              produto.nome.toUpperCase().includes(productName.toUpperCase())
            ) {
              notas.push({
                emitente: emitente,
                produto: produto,
                id: Math.floor(Math.random() * 10000)
              });
            }
          });
        });

        return res.json({
          houve_erro: false,
          nota: notas
        });
      })
      .catch(error => {
        return res.json({
          houve_erro: true,
          mensagem: "Não foi possível fazer a busca."
        });
      });
  }

  async findByDate(req, res) {
    const { dateString } = req.params;
    const { email } = req;

    const date_split = dateString.split("-");

    await Nota.find({
      "user.email": email,
      "nfe.data_emissao": {
        $gte: new Date(parseInt(date_split[0]), parseInt(date_split[1]), 1),
        $lte: new Date(parseInt(date_split[0]), parseInt(date_split[1]) + 1, 0)
      }
    })
      .then(response => {
        return res.json({
          houve_erro: false,
          nota: response
        });
      })
      .catch(() => {
        return res.json({
          houve_erro: true,
          mensagem: "Não foi possível fazer a busca."
        });
      });
  }
}
module.exports = new NotaController();
