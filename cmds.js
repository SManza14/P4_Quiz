//Comandos

const Sequelize = require('sequelize');
const {models} = require('./model');
const {log, biglog, errorlog, colorize} = require('./out');


const validateId = id =>{

  return new Sequelize.Promise((resolve, reject) =>{
      if (typeof id === "undefined"){
    reject(new Error(`Falta el parámetro <id>.`));
  } else {
      id = parseInt(id);
      if (Number.isNaN(id)){
        reject(new Error(`El valor del parámetro <id> no es un número.`));
      } else {
        resolve(id);
      }
  }
});
};

const makeQuestion = (rl, text) =>{

  return new Promise((resolve, reject) =>{
    rl.question(colorize(text, 'red'), answer => {
      resolve(answer.trim());
    });
  });

};

exports.helpCmd = (socket, rl) => {

      log(socket, '  Commandos:');
      log(socket, '  h/help - Muestra este menú de ayuda.');
      log(socket, '  list - Listar los quizzes existentes.');
      log(socket, '  show <id> - Muestra la pregunta y la respuesta del quiz indicado');
      log(socket, '  add - Añadir un nuevo quiz interactivamente.');
      log(socket, '  delete <id> - Borrar el Quiz indicado.');
      log(socket, '  edit <id> - Editar el quiz indicado.');
      log(socket, '  test <id> - Probar el Quiz indicado.');
      log(socket, '  p/play - Jugar a preguntar aleatoriamente todos los quizzes.');
      log(socket, '  credits - Créditos.');
      log(socket, '  q/quit - Salir del programa.');
      rl.prompt();
};

exports.listCmd = (socket, rl) => {

  models.quiz.findAll()
  .each(quiz => {
       log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() =>{
    rl.prompt();
  });

};


exports.showCmd = (socket, rl, id) => {

  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz =>{
    if(!quiz){
      throw new Error(`No existe el quiz asociado al id=${id}.`);
    }
    log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() => {
    rl.prompt();
  });
};


exports.addCmd = (socket, rl) => {

  makeQuestion(rl, 'Introduzca una pregunta: ')
  .then(q => {
    return makeQuestion(rl, 'Introduzca una respuesta: ')
    .then(a=> {
      return {question: q, answer: a};
    });
  })
  .then(quiz => {
    return models.quiz.create(quiz);
  })
  .then((quiz) => {
    log(socket, ` ${colorize('se ha añadido', 'magenta')}: ${quiz.question} ${colorize(' => ', 'magenta')} ${quiz.answer}`);
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog(socket, 'El quiz es erróneo:');
    error.errors.forEach(({message}) => errorlog(socket, message));
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() =>{
    rl.prompt();
  });

};

exports.deleteCmd = (socket, rl, id) => {

  validateId(id)
  .then(id => models.quiz.destroy({where:{id}}))
  .catch(error =>{
    errorlog(socket, error.message);
  })
  .then(() => {
    rl.prompt();
  });

};

exports.editCmd = (socket, rl, id) => {

  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz){
      throw new Error(`No existe el Quiz asociado al id = ${id}.`)
    };

    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
    return makeQuestion(rl, 'Introduzca la pregunta: ')
    .then(q => {
        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
        return makeQuestion(rl, 'Introduzca la respuesta: ')
        .then(a=> {
          quiz.question = q;
          quiz.answer = a;
          return quiz;
        });
    });
  })
  .then(quiz => {
    return quiz.save();
  })
  .then(quiz => {
    log(socket, ` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog(socket, 'El quiz es erróneo:');
    error.errors.forEach(({message}) => errorlog(message));
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() =>{
    rl.prompt();
  });

};



exports.testCmd = (socket, rl, id) => {

  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz){
      throw new Error(`No existe el Quiz asociado al id = ${id}.`)
    };
    return makeQuestion(rl, `${quiz.question}  =>  `)
    .then(a =>{
      if(quiz.answer.toLowerCase() === a.toLowerCase().trim()){
              log(socket, 'Su respuesta es: ');
              log(socket, 'Correcta', 'green');
      } else {
              log(socket, 'Su respuesta es: ');
              log(socket, 'Incorrecta', 'red');
      }
    })
  })
    .catch(Sequelize.ValidationError, error => {
    errorlog(socket, 'El quiz es erróneo:');
    error.errors.forEach(({message}) => errorlog(socket, message));
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() =>{
    rl.prompt();
  });

};


exports.playCmd = (socket, rl) => {
  
  let score = 0;
  let toBeAnswered = [];
  models.quiz.findAll()
  .each(quiz => {
      toBeAnswered.push(quiz);
  })
  .then(playOne = () =>{
      if(toBeAnswered.length === 0){

      log('Fin del test.')
      log('Número de aciertos: ');
      log(score, 'green');
      rl.prompt();
    } else {
      let id = Math.floor(Math.random() * toBeAnswered.length);
      let quiz = toBeAnswered[id];
      toBeAnswered.splice(id, 1);

      rl.question(quiz.question + ` ${colorize('=>', 'magenta')} `, answer => {
        if(quiz.answer.toLowerCase() === answer.toLowerCase().trim()){
          
          score += 1;
          log(socket, `Correcto! Lleva ${colorize(score, 'green')} aciertos.`);
          playOne();

        } else {
          log(socket, 'Incorrecto');
          log(socket, `${colorize(score, 'red')} aciertos.`);
          log(socket, 'fin del test.');
          rl.prompt();

        }
      }
    )

    }
  })
   .catch(Sequelize.ValidationError, error => {
    errorlog(socket, 'El quiz es erróneo:');
    error.errors.forEach(({message}) => errorlog(message));
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() =>{
    rl.prompt();
  });

};


exports.creditsCmd = (socket, rl) => {
  log(socket, '  Autor de la práctica:');
  	log(socket, '  Sergio Manzanero', 'green');
  	rl.prompt();

};

exports.quitCmd = (socket, rl) => {
  rl.close();
  socket.end();
};