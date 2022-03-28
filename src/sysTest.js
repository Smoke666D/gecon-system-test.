#!/usr/bin/env node
const log    = require( './log.js' ); 
const serial = require( './serial.js' ); 

function Asserts ( serial, modbus ) {
  var self   = this;
  var serial = serial;
  var modbus = modbus;

  function delay ( timeout ) {
    return new Promise( function ( resolve, reject ) {
      setTimeout( function () {
        resolve();
      }, timeout );
    });
  }

  this.serial = function ( request, expected ) {
    return new Promise( function ( resolve, reject ) {
      serial.assert( request, expected ).then( function () {
        resolve();
      }).catch( function ( error ) {
        reject( error );
      });
    });
  }
  this.read = function ( command, request, expected, timeout ) {
    return new Promise( function ( resolve, reject ) {
      modbus.write( command ).then( function () {
        delay( timeout ).then( function () {
          self.serial( request, expected ).then( function () {
            resolve();
          }).catch( function () {
            reject();
          })
        });
      });
    });
  }
  this.write = function ( command, request, expected, delay ) {
    return new Promise( function ( resolve, reject ) {
      self.serial( request, expected ).then( function () {
        delay( timeout ).then( function () {
          modbus.read( command ).then( function ( data ) {
            if ( data == expect ) {
              resolve();
            } else {
              reject();
            }
          }).catch( function () {
            resolve();
          });
        });
      }).catch( function () {
        reject();
      })
    });
  }
  return;
}