#!/usr/bin/env node
const log  = require( './log.js' ); 

function Assert ( serial, modbus ) {
  var self   = this;
  var serial = serial;
  var modbus = modbus;

  function delay ( timeout ) {
    return new Promise ( function ( resolve ) {
      setTimeout( function () {
        resolve();
      }, timeout );
    });
  }
  function isModbusSet ( dio ) {
    return new Promise ( function ( resolve, reject ) {
      if ( dio == null ) {
        resolve();
      } else {
        modbus.getOvenByID( dio.id ).then( function ( oven ) {
          oven.set( dio.bit, dio.state ).then( function () {
            resolve();
          }).catch( function () {
            reject();
          });
        });
      }
    });
  }
  this.serial  = function ( request, expected, name ) {
    return new Promise ( function ( resolve, reject ) {
      serial.write( request ).then( function() {
        serial.read().then( function ( data ) {
          if ( data == expected ) {
            log.write( 'message', ( name + ' - Ok' ) );
            resolve( 1 );
          } else {
            log.write( 'warning', ( name + ' - Fail' ) );
            resolve( 0 );
          }
        }).catch( function () { reject(); });
      });
    });
  }
  this.charge  = function ( set, get, timeout, expected, name ) {
    return new Promise ( function ( resolve, reject ) {
      serial.write( set ).then( function() {
        serial.read().then( function ( data ) {
          if ( data == serial.getSuccesCode ) {
            delay( timeout ).then( function () {
              serial.write( get ).then( function() {
                serial.read().then( function ( data ) {
                  if ( parseInt( data ) > parseInt( expected ) ) {
                    log.write( 'message', ( name + ' - Ok' ) );
                    resolve( 1 );
                  } else {
                    log.write( 'warning', ( name + ' - Fail' ) );
                    resolve( 0 );
                  }
                }).catch( function () { reject(); });
              });
            });
          } else {
            reject();
          }
        }).catch( function () { reject(); });
      });
    });
  }
  this.compare = function ( dio = null, request, min, max, timeout, name ) {
    return new Promise ( function ( resolve, reject ) {
      isModbusSet( dio ).then( function () {
        delay( timeout ).then( function () {
          self.serial( request, expected ).then( function ( res ) {
            if ( ( res > min ) && ( res < max ) ) {
              log.write( 'message', ( name + ' - Ok' ) );
            } else {
              log.write( 'warning', ( name + ' - Fail' ) );
            }
            resolve( res );
          }).catch( function () {
            reject();
          });
        });
      }).catch( function () {
        reject();
      }); 
    });
  }
  this.read    = function ( dio, request, expected, timeout, name ) {
    return new Promise ( function ( resolve, reject ) {
      modbus.getOvenByID( dio.id ).then( function ( oven ) {
        oven.set( dio.bit, dio.state ).then( function () {
          delay( timeout ).then( function () {
            self.serial( request, expected ).then( function ( res ) {
              if ( res > 0 ) {
                log.write( 'message', ( name + ' - Ok' ) );
              } else {
                log.write( 'warning', ( name + ' - Fail' ) );
              }
              resolve( res );
            }).catch( function () {
              reject();
            });  
          });  
        }).catch( function () {
          reject();
        });
      });
    });
  }
  this.write   = function ( dio, request, expected, delay, name ) {
    return new Promise ( function ( resolve, reject ) {
      self.serial( request, self.serial.getSuccesCode() ).then( function () {
        delay( timeout ).then( function () {
          modbus.getOvenByID( dio.id ).then( function ( oven ) {
            oven.get( dio.bit ).then( function ( data ) {
              if ( data == expected ) {
                log.write( 'message', ( name + ' - Ok' ) );
              } else {
                log.write( 'warning', ( name + ' - Fail' ) );
              }
              resolve( data );
            }).catch( function () {
              reject();
            });
          });
        });
      }).catch( function () {
        reject();
      });
    });
  }
  this.event   = function ( request, expected, delay, timeout, name ) {
    return new Promise ( function ( resolve, reject ) {
      let time = 0;
      log.write( 'task', 'Please, ' + name );
      while ( time < timeout ) {
        setTimeout( function () {
          time += delay;
          serial.write( request ).then( function() {
            serial.read().then( function ( data ) {
              if ( data == expected ) {
                log.write( 'message', ( name + ' - Ok' ) );
                resolve( 1 );
              }
            }).catch( function () { reject() });
          });   
        }, delay );
      }
      if ( time > timeout ) {
        log.write( 'warning', ( name + ' - Fail' ) );
        resolve( 0 );
      }
    });
  }
  this.input   = function ( request, name ) {
    return new Promise ( function ( resolve, reject ) {
      serial.write( request ).then( function() {
        serial.read().then( function ( data ) {
          if ( data == serial.getSuccesCode() ) {
            log.read( 'Is ' + name + '? (y/n) ').then( function ( input ) {
              if ( input == 'y' ) {
                log.write( 'message', ( name + ' - Ok' ) );
                resolve( 1 );
              } else {
                log.write( 'warning', ( name + ' - Fail' ) );
                resolve( 0 );
              }
            });
          } else {
            log.write( 'error', ( 'Serial request wrong: ' + data ) )
            reject();
          }
        }).catch( function () { reject() });
      });
    });
  }
  this.modbus  = function ( id, adr, min, max, name ) {
    return new Promise ( function ( resolve, reject ) {
      modbus.red( id, adr ).then( function ( data ) {
        if ( ( data >= min ) && ( data <= max ) ) {
          log.write( 'message', ( name + ' - Ok' ) );
          resolve( 1 );
        } else {
          log.write( 'warning', ( name + ' - Fail' ) );
          resolve( 0 );
        }
      });
    });
  }
  return;
}

module.exports.Assert = Assert;