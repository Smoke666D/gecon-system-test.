#!/usr/bin/env node
const chalk = require( 'chalk' ); 

const typeFildLength = 7;

function write ( type, text ) {
  var today     = new Date();
  var date      = today.getFullYear() + '-' + (today.getMonth()+1)+'-'+today.getDate()+' '+ today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds(); 
  var mark      = null;
  var seporator = '';

  for ( var i=0; i<( typeFildLength - type.length ); i++ ) {
    seporator += ' ';
  }

  text = chalk.blue( text );
  switch ( type ) {
    case 'error':
      mark = chalk.redBright( '[' + type.toUpperCase() + ']' );
      break;
    case 'warning':
      mark = chalk.yellowBright( '[' + type.toUpperCase() + ']' );
      break;
    case 'message':
      mark = chalk.greenBright( '[' + type.toUpperCase() + ']' );
      break;
    default:
      mark = '[' + type.toUpperCase() + ']';
      break;
  }

  
  console.log( "%s %s%s %s", 
               chalk.cyan( date ), 
               mark, 
               seporator, 
               text );
}

module.exports.write = write;