#!/usr/bin/env node
const log   = require( './log.js' ); 
const gecon = require( './gecon.js' );

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
  this.serial  = function ( request, expected, name=null ) {
    return new Promise ( function ( resolve, reject ) {
      serial.write( request ).then( function() {
        serial.read().then( function ( data ) {
          if ( data == expected ) {
            if ( name != null ) {
              log.write( 'message', ( name + ' - Ok' ) );
            }
            resolve( 1 );
          } else {
            if ( name != null ) {
              log.write( 'warning', ( name + ' - Fail: await ' + expected + ' ,fact ' + data ) );
            }
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
          if ( data == gecon.serial.status.ok ) {
            delay( timeout ).then( function () {
              serial.write( get ).then( function() {
                serial.read().then( function ( data ) {
                  var counter = 0;
                  let buf1 = data;
                  let buf2 = expected;
                  for ( var i=0; i<5; i++ ) {
                    if ( parseInt( buf1 ) == parseInt( buf2 ) ) {
                      counter++;
                    }
                    buf1 = buf1.substring( data.indexOf('.') + 1 );
                    buf2 = buf2.substring( data.indexOf('.') + 1 );
                  }
                  if ( parseInt( buf1 ) > parseInt( buf2 ) ) {
                    counter++;
                  }
                  if ( counter == 6 ) {
                    log.write( 'message', ( name + ' - Ok' ) );
                    resolve( 1 );
                  } else {
                    log.write( 'warning', ( name + ' - Fail: await ' + expected + ' ,fact ' + data ) );
                    resolve( 0 );
                  }
                }).catch( function () { reject(); });
              });
            });
          } else {
            log.write( 'error', 'Error on CLI command: ' + set.substring( 0, set.indexOf( gecon.serial.postfix ) ) );
            reject();
          }
        }).catch( function () { reject(); });
      });
    });
  }
  this.compare = function ( dio, request, min, max, timeout, name ) {
    return new Promise ( function ( resolve, reject ) {
      isModbusSet( dio ).then( function () {
        delay( timeout ).then( function () {
          serial.write( request ).then( function() {
            serial.read().then( function ( data ) {
              data = parseInt( data );
              if ( ( data >= min ) && ( data <= max ) ) {
                log.write( 'message', ( name + ' - Ok' ) );
              } else {
                log.write( 'warning', ( name + ' - Fail: await between ' + min + ' and ' + max + ' ,fact ' + data ) );
              }
              resolve( data );
            }).catch( function () { reject(); });
          });
        });
      }).catch( function () { reject(); }); 
    });
  }
  this.read    = function ( dio, request, expected, timeout, name ) {
    return new Promise ( function ( resolve, reject ) {
      modbus.getOvenByID( dio.id ).then( function ( oven ) {
        oven.set( dio.bit, dio.state ).then( function () {
          delay( timeout ).then( function () {
            self.serial( request, expected, name ).then( function ( res ) {
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
  this.write   = function ( dio, request, expected, timeout, name ) {
    return new Promise ( function ( resolve, reject ) {
      self.serial( request, gecon.serial.status.ok ).then( function () {
        delay( timeout ).then( function () {
          modbus.getOvenByID( dio.id ).then( function ( oven ) {
            oven.get( dio.bit ).then( function ( data ) {
              if ( data == expected ) {
                log.write( 'message', ( name + ' - Ok' ) );
              } else {
                log.write( 'warning', ( name + ' - Fail: await ' + expected + ' fact ' + data ) );
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
      function loop () {
        setTimeout( function () {
          time += delay;
          if ( time < timeout ) {
            serial.write( request ).then( function() {
              serial.read( false ).then( function ( data ) {
                if ( data == expected ) {
                  log.write( 'message', ( name + ' - Ok' ) );
                  resolve( 1 );
                } else {
                  loop();
                }
              }).catch( function () { reject() });
            });
          } else {
            log.write( 'warning', ( name + ' - Fail: out of timeout for event' ) );
            resolve( 0 );
          }
        }, delay );
      }
      loop();
    });
  }
  this.input   = function ( request, name ) {
    return new Promise ( function ( resolve, reject ) {
      serial.write( request ).then( function() {
        serial.read().then( function ( data ) {
          if ( data == gecon.serial.status.ok ) {
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
      modbus.read( id, adr ).then( function ( data ) {
        if ( ( data >= min ) && ( data <= max ) ) {
          log.write( 'message', ( name + ' - Ok' ) );
          resolve( 1 );
        } else {
          log.write( 'warning', ( name + ' - Fail: await beetwen ' + min + ' and ' + max + ' ,fact ' + data ) );
          resolve( 0 );
        }
      }).catch( function () { reject(); });
    });
  }
  return;
}

module.exports.Assert = Assert;