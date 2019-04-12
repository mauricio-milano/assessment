'use strict';
const criaObjWhere = (tipo, inicioEm, fimEm)=> {
  let resp = {
    inicioEm: inicioEm,
    fimEm: fimEm,
    tipo: tipo,
  };
  return resp;
};
const criaFiltroComId = (id)=> {
  let filtro = {
    where: {id: id},
  };
};
const alteraHora = (hora, qtd) => {
  return hora.setHours(hora.getHours() + qtd);
};
const criaFiltroDeintervalo = (data) => {
  let fim = new Date(data.fimEm);
  let inicio = new Date(data.inicioEm);
  fim.setSeconds(59);
  fim.setMinutes(59);
  fim.setHours(fim.getHours() - 1);
  inicio.setSeconds(1);
  let intervaloDeHora = [inicio, fim];
  return {where: {
    tipo: data.tipo.toLowerCase(),
    or:
    [{inicioEm: {between: intervaloDeHora}},
      {fimEm: {between: intervaloDeHora}},
      {and: [
        {inicioEm: {lt: inicio}},
        {fimEm: {gt: fim},
        }]},
    ]}};
};
module.exports = {
  criaObjWhere,
  alteraHora,
  criaFiltroComId,
  criaFiltroDeintervalo,
};
