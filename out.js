const figlet = require('figlet');
const chalk = require ('chalk');

//dar color a un string
const colorize = (msg, color) =>{

	if (typeof color !== "undefined"){
		msg = chalk[color].bold(msg);
	}
	return msg;
};

//Pintar por pantalla
const log = (socket, msg, color) =>{

	socket.write(colorize(msg, color)+ "\r\n");
};

//Pintar por pantalla utilizando figlet
const biglog = (socket, msg, color) =>{

	log(socket, figlet.textSync(msg, { horizontalLayout: 'full'}) + "\r\n", color);
};

//pintar mensajes de error
const errorlog = (emsg) =>{

	socket.write(`${colorize("Error", "red")}: ${colorize(colorize(emsg, "red"), "bgYellowBright")}\n`);
};

exports = module.exports = {
	colorize,
	log,
	biglog,
	errorlog
};

