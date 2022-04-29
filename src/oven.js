const log       = require( './log.js' );
const ModbusRTU = require( 'modbus-serial' );

const maxTimeout     = 600;  /* sec  */
const minTimeout     = 1;    /* sec  */
const defaultTimeout = 20;   /* sec  */
const setValue       = 1000; /* 0.1% */
const resetValue     = 0;    /* 0.1% */

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
    return new Promise( function ( resolve ) {
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
        let value = resetValue;
        if ( data > 0 ) {
          value = setValue;
        }
        write( bit, value ).then( function ( out ) {
          if ( ( out.address == bit ) && ( out.length == 1 ) ) {
            log.write( 'message', ( 'Set Oven ID ' + self.id + '@0x' + bit.toString( 16 ) + '.' + bit + '=' + value ) );
            resolve();
          } else {
            log.write( 'error', ( 'Error on writing to Oven with ID ' + self.id ) );
            reject();
          }
        });
      } else {
        log.write( 'error', ( self.id + ' Oven device is not din' ) );
        reject();
      }
    });
  }
  this.get = function ( bit ) {
    return new Promise( function ( resolve, reject ) {
      if ( self.type == 'din' ) {
        read( adrOvenMap.input ).then( function ( data ) {
          log.write( 'message', ( 'Get Oven ID ' + self.id + '@0x' + adrOvenMap.input.toString( 16 ) + '.' + bit + '=' + ( data & ( 0x0001 << bit ) ) ) );
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