const log       = require( './log.js' );
const serial    = require( './serial.js' )
const ModbusRTU = require( 'modbus-serial' );
const Oven      = require( './oven.js' ).Oven;

const ovenNumber = 2;
const ovenID     = [ 0, 1 ];
const ovenType   = [ 'din', 'dout' ];

function Modbus () {
  var self    = this;
  this.client = new ModbusRTU();
  this.ovens  = [];

  function initOven () {
    return new Promise( function ( resolve, reject ) {
      for ( var i=0; i<ovenNumber; i++ ) {
        self.ovens.push( new Oven( ovenID[i], self.client, ovenType[i] ) );
      }
      resolve();
    });
  }

  this.init = function ( path, speed ) {
    return new Promise( function ( resolve, reject ) {
      serial.checkPath( path ).then( function () {
        self.client.connectRTU( path, { baudRate: speed }, function () {
          log.write( 'message', ( path + 'has opened as modbus' ) );
          initOven().then( function () {
            log.write( 'message', ( 'There are ' + ovenNumber + ' Oven device on ModBus' ) );
            resolve();
          })
        });
      }).catch( function () {
        log.write( 'error', 'Wrong path ' + path + ' for ModBus' );
      });
    });
  }
  return;
}

module.exports.Modbus = Modbus;