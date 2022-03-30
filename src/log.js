#!/usr/bin/env node
const chalk    = require( 'chalk' ); 
const readline = require( 'readline' );
const fs       = require( 'fs' );

const typeFildLength = 7;
const logFile        = 'log.txt';

function read ( text ) {
  return new Promise( function ( resolve, reject ) {
    var rl = readline.createInterface( process.stdin, process.stdout );
    rl.question( chalk.greenBright( text ), function ( answer ) {
      rl.close();
      resolve( answer );
    })
  });
}
function getDate () {
  var today = new Date();
  return today.getFullYear() + '-' + 
         ( ( "0" + ( today.getMonth() + 1 ) ).slice(-2) ) + '-' + 
         ( "0" + today.getDate() ).slice(-2) + ' ' +
         ( "0" + today.getHours() ).slice(-2) + ":" + 
         ( "0" + today.getMinutes() ).slice(-2) + ":" + 
         ( "0" + today.getSeconds() ).slice(-2); 
}
function write ( type, text ) {
  var mark      = null;
  var seporator = '';
  var date      = getDate();
  for ( var i=0; i<( typeFildLength - type.length ); i++ ) {
    seporator += ' ';
  }
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
    case 'task':
      mark = chalk.magentaBright( '[' + type.toUpperCase() + ']' );
      break;
    default:
      mark = '[' + type.toUpperCase() + ']';
      break;
  }
  fs.appendFile( logFile, ( date + ' [' + type.toUpperCase() + ']' + seporator + ' ' + text + '\n' ), function ( error ) {
    if ( error > 0 ) {
      console.log( error );
    }
  });
  text = chalk.blue( text );
  console.log( "%s %s%s %s", 
               chalk.cyan( date ), 
               mark, 
               seporator, 
               text );
  return;
}

module.exports.write   = write;
module.exports.read    = read;
module.exports.getDate = getDate;