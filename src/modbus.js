const log       = require( './log.js' );
const serial    = require( './serial.js' )
const ModbusRTU = require( 'modbus-serial' );
const Oven      = require( './oven.js' ).Oven;

const ovenNumber = 2;
const ovenID     = [ 1, 2 ];
const ovenType   = [ 'dout', 'din' ];

const readTimeout = 1000; /* ms */
const readIterat  = 10;

var dinMap = [
  new MbDIO( ovenID[1], 0 ),
  new MbDIO( ovenID[1], 1 ),
  new MbDIO( ovenID[1], 2 ),
  new MbDIO( ovenID[1], 3 ),
  new MbDIO( ovenID[1], 4 ),
  new MbDIO( ovenID[1], 5 ),
  new MbDIO( ovenID[1], 6 ),
  new MbDIO( ovenID[1], 7 ),
  new MbDIO( ovenID[1], 8 ),
  new MbDIO( ovenID[1], 9 ),
];
var doutMap = [
  new MbDIO( ovenID[0], 12 ),
  new MbDIO( ovenID[0], 13 ),
  new MbDIO( ovenID[0], 14 ),
  new MbDIO( ovenID[0], 15 ),
];
var generatorMap = [
  new MbDIO( ovenID[0], 0 ),
  new MbDIO( ovenID[0], 1 ),
  new MbDIO( ovenID[0], 2 ),
];
var mainsMap = [
  new MbDIO( ovenID[0], 3 ),
  new MbDIO( ovenID[0], 4 ),
  new MbDIO( ovenID[0], 5 ),
];
var currentMap = [
  new MbDIO( ovenID[0], 8 ),
  new MbDIO( ovenID[0], 9 ),
  new MbDIO( ovenID[0], 10 ),
];
var speedMap = [
  new MbDIO( ovenID[1], 10 ),
];

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
        self.client.connectRTU( path, { baudRate: speed, parity: 'even' }, function () {
          log.write( 'message', ( path + ' has opened as modbus' ) );
          initOven().then( function () {
            log.write( 'message', ( 'Declared ' + ovenNumber + ' Oven device on ModBus' ) );
            resolve();
          })
        });
      }).catch( function () {
        log.write( 'error', 'Wrong path ' + path + ' for ModBus' );
      });
    });
  }
  this.getOvenByID = function ( id ) {
    return new Promise( function ( resolve, reject ) {
      self.ovens.forEach( function ( oven, i ) {
        if ( oven.id == id ) {
          resolve( oven );
        }
      });
      reject();
    });
  }
  this.read = function ( id, adr, type="input" ) {
    return new Promise( function ( resolve, reject ) {
      const delay = readTimeout / readIterat;
      var counter = 0;
      var ready = false;
      self.client.setID( id );
      function loop () {
        setTimeout ( function () {
          counter++;
          if ( type == "input" ) {
            self.client.readInputRegisters( adr, 1 ).then( function ( val ) {
              ready = true;
              resolve( val.data[0] );
            }).catch( function ( error ) {
              console.log( error )
              reject();
            });
          } else if ( type == "holding" ) {
            self.client.readHoldingRegisters( adr, 1 ).then( function ( val ) {
              ready = true;
              resolve( val.data[0] );
            }).catch( function ( error ) {
              console.log( error )
              reject();
            });
          } else {
            log.write( 'error', 'ModBus read wrong register type' ); 
            reject();
          }
          
          if ( counter < readIterat ) {
            loop(); 
          } else {
            if ( ready == false ) {
              log.write( 'error', 'ModBus read timeout' );
            }
            reject();
          }
        }, delay );
      }
      loop();
    });
  }
  this.close = function () {
    return new Promise( function ( resolve ) {
      if ( self.client._port != undefined )
      {
        self.client.close( function () {
          log.write( 'message', 'Close ModBus' );
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
  return;
}

function MbDIO ( id, bit, state = false ) {
  this.id    = id;
  this.bit   = bit;
  this.state = state;
  return;
}

module.exports.Modbus       = Modbus;
module.exports.MbDIO        = MbDIO;
module.exports.doutMap      = doutMap;
module.exports.dinMap       = dinMap;
module.exports.generatorMap = generatorMap;
module.exports.currentMap   = currentMap;
module.exports.mainsMap     = mainsMap;
module.exports.speedMap     = speedMap;
