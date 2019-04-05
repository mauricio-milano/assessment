  /* eslint-disable max-len */
'use strict';

module.exports = function(Reserva) {
  // Fazendo hooks das requisições POST e PUT
  Reserva.observe('before save', function verifica(ctx, next) {
    travaDeHorario(ctx, next);
  });
  function travaDeHorario(ctx, next) {
    let horarioMinimo = 10;
    let horarioMaximo = 22;
    let erro = new Error('Horário indisponível para reservas, tente agendar entre 10h e 22h');
    erro.statusCode = 403;
    erro.code = 'HORARIO_INVALIDO';
    if (ctx.instance.inicioEm.getHours() < horarioMinimo &&
        ctx.instance.inicioEm.getHours() > horarioMaximo &&
        ctx.instance.fimEm.getHours() < horarioMinimo &&
        ctx.instance.fimEm.getHours() > horarioMaximo) {
      next(erro);
    } else {
      verificaHorasRedondas(ctx, next);
    }
  }
  function verificaHorasRedondas(ctx, next) {
    let erro = new Error('Horários só podem ser redondos, exemplo: 5h, 6h, 7h, 8h. Ajeite e tente novamente');
    erro.statusCode = 422;
    erro.code = 'HORÁRIO_INVÁLIDO';
    if (ctx.instance.inicioEm.getMinutes() == 0 && ctx.instance.fimEm.getMinutes() == 0) {
      verificaDisponibilidade(ctx, next);
    } else {
      next(erro);
    }
  }
  function verificaDisponibilidade(ctx, next) {
    let intervaloDeHora = [ctx.instance.inicioEm, ctx.instance.fimEm];
    let filtro = {where: {
      or:
      [{inicioEm: {between: intervaloDeHora}},
          {fimEm: {between: intervaloDeHora}}],
    }};
    let erro =  new Error('O horário solicitado não está disponível, favor selecione um outro horário.');
    erro.code = 'HORARIO_INDISPONIVEL';
    erro.statusCode = 401;
    Reserva.find(filtro, (err, res)=>{
      if (ctx.isNewInstance &&  res.length > 0) {
        next(erro);
      } else {
        if (!ctx.isNewInstance && res.length > 1) {
          next(erro);
        } else {
          if (res.length == 1 && res[0].id == ctx.instance.id){
            next(erro);
          } else {
            novosValores(ctx, next);
          }
        }
      }
    });
  }
  function novosValores(ctx, next) {
    ctx.instance.criadoEm = new Date();
    if (!ctx.instance.status) {
      ctx.instance.status = 'ativa';
    }
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
      next();
    }
  }
  // fazendo hook das requisições delete
  Reserva.observe('before delete', (ctx, next)=>{
    
  });
};
