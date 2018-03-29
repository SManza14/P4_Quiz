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
const log = (msg, color) =>{

	console.log(colorize(msg, color));
};

//Pintar por pantalla utilizando figlet
const biglog = (msg, color) =>{

	log(figlet.textSync(msg, { horizontalLayout: 'full'}), color);
};

//pintar mensajes de error
const errorlog = (emsg) =>{

	console.log(`${colorize("Error", "red")}: ${colorize(colorize(emsg, "red"), "bgYellowBright")}`);
};

exports = module.exports = {
	colorize,
	log,
	biglog,
	errorlog
};

