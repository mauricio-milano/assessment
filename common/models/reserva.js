  /* eslint-disable max-len */
'use strict';

module.exports = function(Reserva) {
  const object = require('../models/CoreUtils/ObjectManipulation');
  const reservaModel = require('../models/CoreUtils/reservaUtils');
  /**
   * Funçao que busca todos as reservas
   * @param {Function(Error, array)} callback
   */
  Reserva.get = (callback) => {
    Reserva.find((erro, resultado)=>{
      if (erro) {
        callback(erro);
      }
      callback(null, resultado);
    });
  };
  /**
   * Funçao que busca todos as reservas
   * @param {string} id  id que vai ser utilizado para consulta
   * @param {Function(Error, array)} callback
   */
  Reserva.getById = (id, callback) => {
    Reserva.findById(id, (erro, resultado)=>{
      if (erro) {
        callback(erro);
      }
      callback(null, resultado);
    });
  };
  /**
   * cadastra reservas no sistema
   * @param {object} data objeto que vai ser cadastrado
   * @param {Function(Error, array)} callback
   */
  Reserva.post = (data, callback) =>{
    reservaModel.travaDeHorario(data).then(()=>{
      reservaModel.verificaHorasRedondas(data).then(()=>{
        reservaModel.novosValores(data).then(()=>{
          reservaModel.verificaQuadra(data).then(()=>{
            reservaModel.verificaDuracao(data).then(()=>{
              reservaModel.verificaDisponibilidade(data, Reserva, 'post').then(()=>{
                Reserva.create(data, ()=>{
                  callback(null, data);
                });
              }, erro => {
                callback(erro);
              });
            }, erro => {
              callback(erro);
            });
          }, erro=>{
            callback(erro);
          });
        }, erro=>{
          callback(erro);
        });
      }, erro => {
        callback(erro);
      });
    }, erro => {
      callback(erro);
    });
  };
  /**
   * atualiza reserva no sistema
   * @param {object} data objeto que vai ser alterado
   * @param {Function(Error, array)} callback
   */
  Reserva.put = (data, callback) => {
    reservaModel.travaDeHorario(data).then(()=>{
      reservaModel.verificaHorasRedondas(data).then(()=>{
        reservaModel.novosValores(data).then(()=>{
          reservaModel.verificaQuadra(data).then(()=>{
            reservaModel.verificaDuracao(data).then(()=>{
              reservaModel.verificaDisponibilidade(data, Reserva, 'put').then(()=>{
                delete data['id'];
                data.alteradaEm = new Date();
                Reserva.replaceOrCreate(data, ()=>{
                  callback(null, data);
                });
              }, erro => {
                callback(erro);
              });
            }, erro => {
              callback(erro);
            });
          }, erro=>{
            callback(erro);
          });
        }, erro=>{
          callback(erro);
        });
      }, erro => {
        callback(erro);
      });
    }, erro => {
      callback(erro);
    });
  };



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
