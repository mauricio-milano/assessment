  /* eslint-disable max-len */
'use strict';

module.exports = function(Reserva) {
  const object = require('../models/CoreUtils/ObjectManipulation');
  const reservaModel = require('../models/CoreUtils/reservaUtils');
  // Fazendo hooks das requisições POST e PUT
  Reserva.observe('before save', function verifica(ctx, next) {
    reservaModel.travaDeHorario(ctx).then(()=>{
      reservaModel.verificaHorasRedondas(ctx).then(()=>{
        reservaModel.novosValores(ctx).then(()=>{
          reservaModel.verificaQuadra(ctx).then(()=>{
            reservaModel.verificaDuracao(ctx).then(()=>{
              reservaModel.verificaDisponibilidade(ctx, Reserva).then(()=>{
                next();
              }, erro => {
                next(erro);
              });
            }, erro => {
              next(erro);
            });
          }, erro=>{
            next(erro);
          });
        }, erro=>{
          next(erro);
        });
      }, erro => {
        next(erro);
      });
    }, erro => {
      next(erro);
    });
  });
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
    let dataUmaHoraAMais = object.criaObjWhere(data.tipo, object.alteraHora(data.inicioEm, 1), object.alteraHora(data.fimEm, 1));
    let dataUmaHoraAMenos = object.criaObjWhere(data.tipo, object.alteraHora(data.inicioEm, -1), object.alteraHora(data.fimEm, -1));
    let outrasQuadras = [object.criaObjWhere(quadras[0], data.inicioEm, data.fimEm), object.criaObjWhere(quadras[1], data.inicioEm, data.fimEm)];
    let dataUmaHoraAMaisQuadraDiferente = [
      object.criaObjWhere(quadras[0], object.alteraHora(data.inicioEm, 1), object.alteraHora(data.fimEm, 1)),
      object.criaObjWhere(quadras[1], object.alteraHora(data.inicioEm, 1), object.alteraHora(data.fimEm, 1))];
    let dataUmaHoraAMenosQuadraDiferente = [
      object.criaObjWhere(quadras[0], object.alteraHora(data.inicioEm, -1), object.alteraHora(data.fimEm, -1)),
      object.criaObjWhere(quadras[1], object.alteraHora(data.inicioEm, -1), object.alteraHora(data.fimEm, -1))];
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
