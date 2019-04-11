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
    erro.statusCode = 422;
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
      novosValores(ctx, next);
    } else {
      next(erro);
    }
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
    if (tipo == 'saibro' || tipo == 'grama' || tipo == 'hardc') {
      verificaDuracao(ctx, next);
    } else {
      let erro =  new Error('Quadra não permitida');
      erro.statusCode = 422;
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
    let intervaloDeHora = [ctx.instance.inicioEm, ctx.instance.fimEm];
    let filtro = {where: {tipo: ctx.instance.tipo.toLowerCase(),
      or:
      [{inicioEm: {between: intervaloDeHora}},
        {fimEm: {between: intervaloDeHora}},
        {and: [
          {inicioEm: {lte: ctx.instance.inicioEm}},
          {fimEm: {gte: ctx.instance.fimEm},
          }]},
      ]}};
    let erro =  new Error('O horário solicitado não está disponível, favor selecione um outro horário.');
    erro.code = 'HORARIO_INDISPONIVEL';
    erro.statusCode = 422;
    Reserva.find(filtro, (err, res)=>{
      if (ctx.isNewInstance &&  res.length > 0) {
        next(erro);
      } else {
        if (!ctx.isNewInstance && res.length > 1) {
          next(erro);
        } else {
          if (res.length == 1 && res[0].id == ctx.instance.id) {
            next(erro);
          } else {
            next();
          }
        }
      }
    });
  }
  /**
   * Verifica a disponibilidade
   * @param {object} data objeto que vai ser utilizado para consulta
   * @param {Function(Error, array)} callback
   */

  Reserva.verificaDisponibilidade = function(data, callback) {
    var filtro = {where: {
      inicioEm: data.inicioEm,
      fimEm: data.fimEm,
      tipo: data.tipo.toLowerCase(),
    }};
    let quadras = ['saibro', 'hard', 'grama'];
    var index = quadras.indexOf(data.tipo);
    if (index > -1) {
      quadras.splice(index, 1);
    }
    Reserva.find(filtro, (erro, resultado)=>{
      if (erro) {
        callback(erro);
      }
      if (resultado.length == 0) {
        callback(null, [data]);
      } else {
        sugestaoHorarios(data, quadras, callback);
      }
    });
  };
  function sugestaoHorarios(data, quadras, callback) {
    // eslint-disable-next-line no-undef
    let resultado = [];
    data.fimEm = new Date(data.fimEm);
    data.inicioEm = new Date(data.inicioEm);
    let dataUmaHoraAMais = criaObjWhere(data.tipo, data.inicioEm.setHours(data.inicioEm.getHours() + 1), data.fimEm.setHours(data.fimEm.getHours() + 1));
    let dataUmaHoraAMenos = criaObjWhere(data.tipo, data.inicioEm.setHours(data.inicioEm.getHours() - 1), data.fimEm.setHours(data.fimEm.getHours() - 1));
    let outrasQuadras = [criaObjWhere(quadras[0], data.inicioEm, data.fimEm), criaObjWhere(quadras[1], data.inicioEm, data.fimEm)];
    let dataUmaHoraAMaisQuadraDiferente = [
      criaObjWhere(quadras[0], data.inicioEm.setHours(data.inicioEm.getHours() + 1), data.fimEm.setHours(data.fimEm.getHours() + 1)),
      criaObjWhere(quadras[1], data.inicioEm.setHours(data.inicioEm.getHours() + 1), data.fimEm.setHours(data.fimEm.getHours() + 1))];
    let dataUmaHoraAMenosQuadraDiferente = [
      criaObjWhere(quadras[0], data.inicioEm.setHours(data.inicioEm.getHours() - 1), data.fimEm.setHours(data.fimEm.getHours() - 1)),
      criaObjWhere(quadras[1], data.inicioEm.setHours(data.inicioEm.getHours() - 1), data.fimEm.setHours(data.fimEm.getHours() - 1))];
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
      Reserva.find({where: obj[key]}, async (erro, resp)=>{
        if (erro) {
          callback(erro);
        } else {
          if (resp.length == 0){
            // eslint-disable-next-line no-undef
          await resultado.push(obj[key]);
          }
        }
      });
      setTimeout(()=>{
        // TODO fazer isso ser sincrono e nao por tempo
        callback(null, resultado);
      },5000);
    });
  }
  function criaObjWhere(tipo, inicioEm, fimEm){
    let resp = {
      inicioEm: inicioEm,
      fimEm: fimEm,
      tipo: tipo,
    };
    return resp;
  }

  /**
   * Verifica a disponibilidade
   * @param {object} id objeto que vai ser utilizado para consulta
   * @param {Function(Error, array)} callback
   */
  Reserva.deletar = (id, callback)=>{
    
    Reserva.find({where: {id: id}}, (erro, res)=>{
      if (erro) {
        callback(erro);
      } else {
        res[0].status = 'cancelada';
        res[0].canceladaEm = new Date();
        // eslint-disable-next-line no-undef
        res[0].save(salvo=>{
          callback(null, res[0]);
        });
      }
    });
  };
};
