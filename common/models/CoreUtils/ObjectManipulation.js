'use strict';
const criaObjWhere = (tipo, inicioEm, fimEm)=> {
  let resp = {
    inicioEm: inicioEm,
    fimEm: fimEm,
    tipo: tipo,
  };
  return resp;
};
const alteraHora = (hora, qtd) => {
  return hora.setHours(hora.getHours() + qtd);
};
const criaFiltroDeintervalo = (data) => {
  let intervaloDeHora = [data.inicioEm, data.fimEm];
  return {where: {
    tipo: data.tipo.toLowerCase(),
    or:
    [{inicioEm: {between: intervaloDeHora}},
      {fimEm: {between: intervaloDeHora}},
      {and: [
        {inicioEm: {lte: data.inicioEm}},
        {fimEm: {gte: data.fimEm},
        }]},
    ]}};
};
module.exports = {
  criaObjWhere,
  alteraHora,
  criaFiltroDeintervalo,
};
