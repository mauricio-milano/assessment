/* eslint-disable max-len */
/* eslint-disable no-undef */
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
    if (ctx.instance.inicioEm.getHours() < horarioMinimo &&
        ctx.instance.inicioEm.getHours() > horarioMaximo &&
        ctx.instance.fimEm.getHours() < horarioMinimo &&
        ctx.instance.fimEm.getHours() > horarioMaximo) {
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
    if (ctx.instance.inicioEm.getMinutes() == 0 && ctx.instance.fimEm.getMinutes() == 0) {
      resolve(true);
    } else {
      reject(erro);
    }
  });
};
const novosValores = (ctx)=>{
  return new Promise((resolve, reject)=>{
    ctx.instance.criadoEm = new Date();
    if (!ctx.instance.status) {
      ctx.instance.status = 'ativa';
    }
    let minutos = ctx.instance.fimEm - ctx.instance.inicioEm;
    ctx.instance.duracao = minutos / 60000;
    ctx.instance.valorEmReais = parseFloat(ctx.instance.duracao * 0.5);
    resolve(true);
  });
};
const verificaQuadra = (ctx)=>{
  return new Promise((resolve, reject)=>{
    if (ctx.instance.duracao < 60) {
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
    if (ctx.instance.duracao < 60) {
      let erro = new Error('Duração minima de 1h (60 minutos)');
      erro.statusCode = 422;
      reject(erro);
    } else {
      resolve(true);
    }
  });
};
const verificaDisponibilidade = (ctx, Reserva)=>{
  return new Promise((resolve, reject)=>{
    let filtro = ObjectManipulation.criaFiltroDeintervalo(ctx.instance);
    let erro =  new Error('O horário solicitado não está disponível, favor selecione um outro horário.');
    erro.code = 'HORARIO_INDISPONIVEL';
    erro.statusCode = 422;
    Reserva.find(filtro, (err, res)=>{
      if (ctx.isNewInstance &&  res.length > 0) {
        reject(erro);
      } else {
        if (!ctx.isNewInstance && res.length > 1) {
          reject(erro);
        } else {
          if (res.length == 1 && res[0].id == ctx.instance.id) {
            reject(erro);
          } else {
            resolve(true);
          }
        }
      }
    });
  });
};
const sugestaoHorarios = (data, quadras, callback) => {
  // eslint-disable-next-line no-undef
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
    let filtro = object.criaFiltroDeIntervalo(obj[key]);
    Reserva.find(filtro, (erro, resp)=>{
      if (erro) {
        callback(erro);
      } else {
        if (resp.length == 0){
          // eslint-disable-next-line no-undef
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
