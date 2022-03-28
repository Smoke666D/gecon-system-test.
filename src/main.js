#!/usr/bin/env node
const log      = require( './log.js' ); 
const Serial   = require( './serial.js' ).Serial;
const Envir    = require( './serial.js' ).SerialEnv;
const Modbus   = require( './modbus.js' ).Modbus;
const ethernet = require( './ethernet.js' );
const StLink   = require( './st-link.js' ).StLink;

let serial = new Serial();
let envir  = new Envir();
let modbus = new Modbus();
let stlink = new StLink();

const setupSerialFile = 'serial.txt';
const setupModbusFile = 'modbus.txt';

const serialSpeed = 115200;
const modbusSpeed = 115200;

function modbusInit () {
  return new Promise( function ( resolve, reject ) {
    envir.init( setupModbusFile, 'modbus' ).then( function ( path ) {
      modbus.init( path, modbusSpeed ).then( function () {
        resolve();
      });
    });
  });
}

function serialInit () {
  return new Promise( function ( resolve, reject ) {
    envir.init( setupSerialFile, 'serial port' ).then( function ( path ) {
      serial.init( path, serialSpeed ).then( function () {
        log.read( 'Press any key to start system test: ').then( function ( data ) {
          resolve();
        });
      }).catch( function () {
        reject();
      })
    }).catch( function () {
      reject();
    });
  });
}

log.write( 'message', 'Start...' );
stlink.check().then( function () {
  
}).catch( function () {

});
/*
ethernet.test( 'ya.ru' ).then( function () {
  log.write( 'message', 'Ethernet - Ok!' );
}).catch( function ( error ) {
  log.write( 'warning', ( 'Ethernet - Fail! (' + error + ')' ) );
})
*/
/*
modbusInit().then( function () {
  log.write( 'message', 'Finish!' );
}).catch( function () {
  log.write( 'error', 'Finish with error!' );
});
*/