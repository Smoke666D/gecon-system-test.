#!/usr/bin/env node
const SerialPort = require( 'serialport' );
const log        = require( './log.js' );
const fs         = require( 'fs' );
const gecon      = require( './gecon.js' );

const readTimeout = 5000; /* ms */
const readIterat  = 50;

function SerialEnv () {
  var self = this;
  
  this.scan = function () {
    return new Promise( function ( resolve, reject ) {
      SerialPort.list().then( function( ports, err ) {
        if ( err ) {
          log.write( 'error', 'Serial ports scanning fail');
        } else {
          if ( ports.length == 0 ) {
            log.write( 'error', 'No devices on serial pots available');
          } else {
            resolve( ports );
          }
        } 
      });
    });
  }
  this.print = function () {
    return new Promise( function ( resolve, reject ) {
      self.scan().then( function ( ports ) {
        log.write( 'message', ( 'There are ' + ports.length + ' connected devices:' ) );
        ports.forEach( function ( port ) {
          log.write( 'message', ( port.path + ': VID-' + port.vendorId + ' PID-' + port.productId ) );
        });
        resolve( null );
      })
    });
  }

  this.get = function ( fileName, target ) {
    return new Promise( function ( resolve, reject ) {
      fs.readFile( fileName, 'utf8', function ( error, data ) {
        if ( error ) {
          log.write( 'error', 'Error on reading serial setup file, need to setup ' + target + '...' );
          reject();
        } else {
          if ( data.indexOf( '\n' ) == -1 ) {
            log.write( 'message', ( 'Path name "' + data + '" has been read from ' + target + ' setup file.' ) );
            resolve( data );
          } else {
            log.write( 'error', 'Wrong data in ' + target + ' setup file' );
          }
        }
      });
    });
  }

  this.set = function ( fileName, target ) {
    return new Promise( function ( resolve, reject ) {
      log.read( 'Which path is serial debug port?  ' ).then( function ( path ) {
        if ( path.startsWith( 'com' ) || path.startsWith( 'Com' ) || path.startsWith( 'COm' ) ) {
          path = 'COM' + path.substring( 3 );
        }
        checkPath( path ).then( function () {
          log.write( 'message', ( path + ' set as serial port' ) );
          fs.writeFile( fileName, path, function ( error ) {
            if ( error ) {
              log.write( 'error', ( 'Error on writing path to ' + fileName ) );
              reject();
            } else {
              log.write( 'message', ( path + ' saved in ' + target + ' setup file ' + fileName + ' as default port' ) );
              resolve( path );
            }
          });
        }).catch( function () {
          log.write( 'error', ( 'There is no ' + path ) );
          reject();
        });
      });
    });
  }

  this.init = function ( fileName, target ) {
    return new Promise( function ( resolve, reject ) {
      self.get( fileName, target ).then( function ( path ) {
        resolve( path );
      }).catch( function () {
        self.print().then( function () {
          self.set( fileName, target ).then( function ( path ) {
            resolve( path );
          }).catch( function () {
            reject();
          }); 
        });
      });
    });
  }

  return;
}
function checkPath ( path ) {
  return new Promise( function ( resolve, reject ) {
    var result = false;
    SerialPort.list().then( function ( ports ) {
      ports.forEach(  function( port ) {
        if ( port.path == path ) {
          result = true;
          resolve();
        }
      });
      if ( result == false ) {
        reject();
      }
    });
  });
}
function Serial () {
  var self     = this;
  var port     = null;
  var input    = '';
  var inFinish = true;

  function isInputFinish () {
    //console.log( input )
    if ( input.indexOf( gecon.serial.postfix ) > 0 ) {
      inFinish = true;
    }
    return inFinish;
  }

  function handler ( data ) {
    let buf = data.toString();
    input   += buf;
    isInputFinish();
    return;
  }
  this.init = function ( path, speed ) {
    return new Promise( function ( resolve, reject ) {
      checkPath( path ).then( function () {
        port = new SerialPort( path, { baudRate: speed } );
        port.on( 'data', function ( data ) {
          handler( data );
          return;
        });
        port.open( function () {
          log.write( 'message', ( path + ' has opened as serial port' ) );
          resolve();
        });
      }).catch( function () {
        log.write( 'error', 'Error on serial port opening' );
        reject();
      });
    });
  }
  this.close = function () {
    return new Promise( function ( resolve, reject ) {
      if ( port != null ) {
        port.close( function ( error ) {
          if ( error ) {
            log.write( 'error', 'Error on serial port closing')
            reject();
          } else {
            log.write( 'message', 'Close serial port')
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
  this.read = function () {
    return new Promise( function ( resolve, reject ) {
      const delay = readTimeout / readIterat;
      var counter = 0;
      function loop ( onError ) {
        setTimeout( function () { 
          counter++;
          isInputFinish();
          if ( inFinish == true ) {
            resolve( input.substring( 0, input.indexOf( gecon.serial.postfix ) ) );
          } else if ( counter < readIterat ) {
            loop( onError );
          } else {
            onError();
          }
          return; 
        }, delay );
      }
      loop( function () {
        log.write( 'error', 'Serial port read timeout' );
        reject();
      });
    });
  }
  this.write = function ( text ) {
    return new Promise( function ( resolve, reject ) {
      if ( inFinish == true ) {
        inFinish = false;
        input    = '';
        port.write( text );
        resolve();
      } else {
        reject();
      }
    });
  }
  return;
}

module.exports.Serial    = Serial;
module.exports.SerialEnv = SerialEnv;
module.exports.checkPath = checkPath;