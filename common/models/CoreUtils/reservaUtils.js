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

module.exports = {
  travaDeHorario,
  verificaHorasRedondas,
  novosValores,
  verificaQuadra,
  verificaDuracao,
  verificaDisponibilidade,
};
