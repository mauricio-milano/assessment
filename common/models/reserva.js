/* eslint-disable max-len */
'use strict';

module.exports = function(Reserva) {
  Reserva.observe('before save', function verifica(ctx, next) {
    novosValores(ctx, next);
  });
  function novosValores(ctx, next) {
    ctx.instance.criadoEm = new Date();
    ctx.instance.ativa = 'ativa';
    let minutos = ctx.instance.fimEm - ctx.instance.inicioEm;
    ctx.instance.duracao = minutos / 60000;
    ctx.instance.valorEmReais = parseFloat(ctx.instance.duracao * 0.5);
    verificaQuadra(ctx, next);
  }
  function verificaQuadra(ctx, next) {
    let tipo = ctx.instance.tipo.toLowerCase();
    if (tipo == 'saibro' || tipo == 'grama' || tipo == 'concreto') {
      verificaDuracao(ctx, next);
    } else {
      let erro =  new Error('Quadra não permitida');
      erro.statusCode = 401;
      next(erro);
    }
  }
  function verificaDuracao(ctx, next) {
    if (ctx.instance.duracao < 60) {
      let erro = new Error('Duração minima de 1h (60 minutos)');
      erro.statusCode = 422;
      next(erro);
    } else {
      verificaDisponibilidade(ctx, next);
    }
  }
  function verificaDisponibilidade(ctx, next) {
    let filtro = {where: {
      or:
      [{inicioEm: {between: [ctx.instance.inicioEm, ctx.instance.fimEm]}},
          {fimEm: {between: [ctx.instance.inicioEm, ctx.instance.fimEm]}}],
    }};
    Reserva.find(filtro, (err, res)=>{
      if (res.length > 0) {
        let erro =  new Error('O horário solicitado não está disponível, favor selecione um outro horário.');
        erro.code = 'HORARIO_INDISPONIVEL';
        erro.statusCode = 401;
        next(erro);
      } else {
        next();
      }
    });
  }
};

