const log       = require( './log.js' );
const ModbusRTU = require( 'modbus-serial' );

const maxTimeout     = 600; /* sec */
const minTimeout     = 1;   /* sec */
const defaultTimeout = 20;  /* sec */

const adrOvenMap = {
  'timeout' : 0x30,
  'output'  : 0x32,
  'input'   : 0x33
};

function Oven ( id, client, type ) {
  var self   = this;
  this.id     = id;
  this.input  = 0;
  this.output = 0;
  this.type   = type;

  const succesCode = 1;

  function read ( adr ) {
    return new Promise( function ( resolve, reject ) {
      client.setID( self.id );
      client.readInputRegisters( adr, 1 ).then( function ( val ) {
        resolve( val.data[0] );
      });
    });
  }
  function write ( adr, data ) {
    return new Promise( function ( resolve, reject ) {
      if ( typeof( data ) != 'object' ) {
        if ( typeof( data ) == 'number' ) {
          data = [ data ];
        } else {
          reject( 'Wrong data' );
        }
      }
      client.setID( self.id );
      client.writeRegisters( adr, data ).then( function ( data ) {
        resolve( data );
      });
    });
  }
  this.set = function ( bit, data ) {
    return new Promise( function ( resolve, reject ) {
      if ( self.type == 'dout' ) {
        read( adrOvenMap.output ).then( function ( value ) {
          if ( data > 0 ) {
            value &= 0x0001 << bit;
          } else {
            value |= ~(0x0001 << bit );
          }
          write( adrOvenMap.output, value ).then( function ( val ) {
            if ( val == succesCode ) {
              resolve();
            } else {
              log.write( 'error', ( 'Error on writing to modbus device with ID ' + self.id ) );
              reject();
            }
          });
        });
      } else {
        log.write( 'error', ( self.id + ' oven device is not din' ) );
        reject();
      }
    });
  }
  this.get = function ( bit ) {
    return new Promise( function ( resolve, reject ) {
      if ( self.type == 'din' ) {
        read( adrOvenMap.input ).then( function ( data ) {
          resolve( data & ( 0x0001 << bit ) );
        });
      } else {
        log.write( 'error', ( self.id + ' oven device is not din' ) );
        reject();
      }
    });
  }
  this.timeout = function ( data ) {
    return new Promise( function ( resolve, reject ) {
      if ( typeof( data ) == 'number' )
      {
        if ( ( data < maxTimeout ) && ( data > minTimeout ) ) {
          write( adrOvenMap.timeout, data ).then( function () {
            resolve();
          });
        } else {
          reject( 'Wrong timeout value' );
        }
      } else {
        reject( 'Wrong timeout type. It need to be number' );
      }
    });
  }
  this.getSuccesCode = function () {
    return succesCode;
  }

  return;
}

module.exports.Oven = Oven;