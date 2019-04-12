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
        reservaModel.sugestaoHorarios(data, quadras, Reserva, callback);
      }
    });
  };
 

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
        res[0].save(salvo=>{
          callback(null, res[0]);
        });
      }
    });
  };
};
