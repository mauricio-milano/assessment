/* eslint-disable max-len */
// /* eslint-disable no-undef */
'use strict';
const ObjectManipulation = require('../CoreUtils/ObjectManipulation');
const travaDeHorario = (ctx)=>{
  return new Promise((resolve, reject)=>{
    let horarioMinimo = 10;
    let horarioMaximo = 22;
    let erroMsg = 'Horário indisponível para reservas, tente agendar entre 10h e 22h';
    let erro = new Error(erroMsg);
    erro.statusCode = 422;
    erro.code = 'HORARIO_INVALIDO';
    ctx.inicioEm = new Date(ctx.inicioEm);
    ctx.fimEm = new Date(ctx.fimEm);
    if (ctx.inicioEm.getHours() < horarioMinimo &&
        ctx.inicioEm.getHours() > horarioMaximo &&
        ctx.fimEm.getHours() < horarioMinimo &&
        ctx.fimEm.getHours() > horarioMaximo) {
      reject(erro);
    } else {
      resolve(true);
    }
  });
};
const verificaHorasRedondas = (ctx)=>{
  return new Promise((resolve, reject)=>{
    let erroMsg = 'Horários só podem ser redondos, exemplo: 5h, 6h, 7h, 8h. Ajeite e tente novamente';
    let erro = new Error(erroMsg);
    erro.statusCode = 422;
    erro.code = 'HORÁRIO_INVÁLIDO';
    if (ctx.inicioEm.getMinutes() == 0 && ctx.fimEm.getMinutes() == 0) {
      resolve(true);
    } else {
      reject(erro);
    }
  });
};
const novosValores = (ctx)=>{
  return new Promise((resolve, reject)=>{
    ctx.criadoEm = new Date();
    if (!ctx.status) {
      ctx.status = 'ativa';
    }
    let minutos = ctx.fimEm - ctx.inicioEm;
    ctx.duracao = minutos / 60000;
    ctx.valorEmReais = parseFloat(ctx.duracao * 0.5);
    resolve(true);
  });
};
const verificaQuadra = (ctx)=>{
  return new Promise((resolve, reject)=>{
    if (ctx.duracao < 60) {
      let erro = new Error('Duração minima de 1h (60 minutos)');
      erro.statusCode = 422;
      reject(erro);
    } else {
      resolve(true);
    };
  });
};
const verificaDuracao = (ctx)=>{
  return new Promise((resolve, reject)=>{
    if (ctx.duracao < 60) {
      let erro = new Error('Duração minima de 1h (60 minutos)');
      erro.statusCode = 422;
      reject(erro);
    } else {
      resolve(true);
    }
  });
};
const verificaDisponibilidade = (ctx, Reserva, verbo)=>{
  return new Promise((resolve, reject)=>{
    let filtro = ObjectManipulation.criaFiltroDeintervalo(ctx);
    let erro =  new Error('O horário solicitado não está disponível, favor selecione um outro horário.');
    erro.code = 'HORARIO_INDISPONIVEL';
    erro.statusCode = 422;
    Reserva.find(filtro, (err, res)=>{
      if (verbo == 'post' &&  res.length > 0) {
        reject(erro);
      } else {
        if (verbo == 'put' && res.length > 1) {
          reject(erro);
        } else {
          if (res.length == 1 && res[0].id != ctx.id) {
            reject(erro);
          } else {
            resolve(true);
          }
        }
      }
    });
  });
};
const sugestaoHorarios = (data, quadras, Reserva, callback) => {
  let resultado = [];
  data.fimEm = new Date(data.fimEm);
  data.inicioEm = new Date(data.inicioEm);

  let dataUmaHoraAMais = ObjectManipulation.criaObjWhere(
    data.tipo,
    ObjectManipulation.alteraHora(data.inicioEm, 1),
    ObjectManipulation.alteraHora(data.fimEm, 1));

  let dataUmaHoraAMenos = ObjectManipulation.criaObjWhere(
    data.tipo,
    ObjectManipulation.alteraHora(data.inicioEm, -1),
    ObjectManipulation.alteraHora(data.fimEm, -1));

  let outrasQuadras = [
    ObjectManipulation.criaObjWhere(quadras[0], data.inicioEm, data.fimEm),
    ObjectManipulation.criaObjWhere(quadras[1], data.inicioEm, data.fimEm)];

  let dataUmaHoraAMaisQuadraDiferente = [
    ObjectManipulation.criaObjWhere(
      quadras[0],
      ObjectManipulation.alteraHora(data.inicioEm, 1),
      ObjectManipulation.alteraHora(data.fimEm, 1)),
    ObjectManipulation.criaObjWhere(
      quadras[1],
      ObjectManipulation.alteraHora(data.inicioEm, 1),
      ObjectManipulation.alteraHora(data.fimEm, 1)),
  ];
  let dataUmaHoraAMenosQuadraDiferente = [
    ObjectManipulation.criaObjWhere(
      quadras[0],
      ObjectManipulation.alteraHora(data.inicioEm, -1),
      ObjectManipulation.alteraHora(data.fimEm, -1)),
    ObjectManipulation.criaObjWhere(
      quadras[1],
      ObjectManipulation.alteraHora(data.inicioEm, -1),
      ObjectManipulation.alteraHora(data.fimEm, -1))];
  let obj = {
    dataUmaHoraAMais: dataUmaHoraAMais,
    dataUmaHoraAMenos: dataUmaHoraAMenos,
    outrasQuadras1: outrasQuadras[0],
    outrasQuadras2: outrasQuadras[1],
    dataUmaHoraAMaisQuadraDiferente1: dataUmaHoraAMaisQuadraDiferente[1],
    dataUmaHoraAMaisQuadraDiferente2: dataUmaHoraAMaisQuadraDiferente[0],
    dataUmaHoraAMenosQuadraDiferente1: dataUmaHoraAMenosQuadraDiferente[0],
    dataUmaHoraAMenosQuadraDiferente2: dataUmaHoraAMenosQuadraDiferente[1],
  };
  Object.keys(obj).forEach(key=>{
    let filtro = ObjectManipulation.criaFiltroDeIntervalo(obj[key]);
    Reserva.find(filtro, (erro, resp)=>{
      if (erro) {
        callback(erro);
      } else {
        if (resp.length == 0) {
          resultado.push(obj[key]);
        }
      }
    });
    setTimeout(()=>{
      // TODO fazer isso ser sincrono e nao por tempo
      callback(null, resultado);
    }, 5000);
  });
}

module.exports = {
  travaDeHorario,
  verificaHorasRedondas,
  novosValores,
  verificaQuadra,
  verificaDuracao,
  verificaDisponibilidade,
  sugestaoHorarios,
};
