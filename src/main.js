#!/usr/bin/env node
const log      = require( './log.js' ); 
const Serial   = require( './serial.js' ).Serial;
const Envir    = require( './serial.js' ).SerialEnv;
const Modbus   = require( './modbus.js' ).Modbus;
const ethernet = require( './ethernet.js' );
const StLink   = require( './st-link.js' ).StLink;
const Assert   = require( './asserts.js').Assert;
const gecon    = require( './gecon.js');

var doutMap      = require( './modbus.js' ).doutMap;
var dinMap       = require( './modbus.js' ).dinMap;
var generatorMap = require( './modbus.js' ).generatorMap;
var mainsMap     = require( './modbus.js' ).mainsMap;
var currentMap   = require( './modbus.js' ).currentMap;
var speedMap     = require( './modbus.js' ).speedMap;

let serial = new Serial();
let envir  = new Envir();
let modbus = new Modbus();
let stlink = new StLink();
let assert = new Assert( serial, modbus );

let id  = '';
let ip  = '';
let mac = '';

const setupSerialFile = 'serial.txt';
const setupModbusFile = 'modbus.txt';

const serialSpeed  = 115200;
const modbusSpeed  = 115200;
const resetTimeout = 10000;  /* ms */

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
        resolve();
      }).catch( function () {
        reject();
      })
    }).catch( function () {
      reject();
    });
  });
}
function start () {
  return new Promise( function ( resolve ) {
    log.write( 'message', 'Start...' );
    resolve();
  });
}
function error () {
  log.write( 'error', 'Finish with error!' );
  return;
}
function finish () {
  log.write( 'message', 'Finish!' );
  return;
}
function init () {
  return new Promise( function ( resolve, reject ) {
    stlink.check().then( function () {
      serialInit().then( function () {
        modbusInit().then( function () {
          resolve();
        }).catch( function () {
          reject();
        });
      }).catch( function () {
        reject();
      });
    }).catch( function () {
      reject();
    });    
  });
}
function getDeviceData ( target, length ) {
  return new Promise( function ( resolve, reject ) {
    serial.write( makeSerialRequest( gecon.serial.command.get, target ) ).then( function () {
      serial.read().then( function ( data ) {
        if ( data.length >= length ) {
          resolve( data );
        } else {
          reject();
        }
      }).catch( function () {
        reject();
       });
    });
  });
}
function getData () {
  return new Promise ( function ( resolve, reject ) {
    getDeviceData( gecon.serial.target.id, 10 ).then( function ( data ) {
      id = data;
      log.write( 'message', ( 'ID: ' + id ) );
      getDeviceData( gecon.serial.target.ip, 10 ).then( function ( data ) {
        ip = data;
        log.write( 'message', ( 'IP: ' + ip ) );
        getDeviceData( gecon.serial.target.mac, 12 ).then( function ( data ) {
          mac = data;
          log.write( 'message', ( 'MAC: ' + mac ) );
          resolve();
        }).catch( function () {
          log.write( 'error', 'Error on MAC address reading' );
          reject();
        });
      }).catch( function () {
        log.write( 'error', 'Error on IP address reading' );
        reject();
      });
    }).catch( function () {
      log.write( 'error', 'Error on ID reading' );
      reject();
    });
  });
}
function delay ( timeout ) {
  return new Promise ( function ( resolve ) {
    log.write( 'message', ( 'Waiting ' + timeout + ' ms for restart controller' ) );
    setTimeout( function () {
      resolve();
    }, timeout );
  });
}
function waitForTest () {
  return new Promise( function ( resolve ) {
    log.read( 'Press any key to start system test: ').then( function ( data ) {
      resolve();
    });
  });
}
function systemTest () {
  return new Promise( function ( resolve, reject ) {
    let testLength = 1;
    let testSecces = 0;

    function makeSerialRequest ( cmd, target, data = null ) {
      let request = cmd + gecon.serial.separator + target;
      if ( data != null ) {
        request += gecon.serial.separator + data;
      }
      request += gecon.serial.postfix;
      return request;
    }
    function testStorage () {
      return new Promise( function ( resolve, reject ) {
        assert.serial( makeSerialRequest( gecon.serial.command.get, gecon.serial.target.storage ), 
                       gecon.serial.status.ok, 
                       'Storage' ).then( function ( res ) {
          resolve( res );
        }).catch( function () {
          reject();
        });
      });
    }
    function testBattery () {
      return new Promise( function ( resolve, reject ) {
        assert.compare( null, 
                        makeSerialRequest( gecon.serial.command.get, gecon.serial.target.battery ), 
                        gecon.normal.battery.min, 
                        gecon.normal.battery.max, 
                        0, 
                        'Battery' ).then( function ( res ) {
          resolve( res );
        }).catch( function () {
          reject();
        });
      });
    }
    function testFuel () {
      return new Promise( function ( resolve, reject ) {
        assert.compare( null, 
                        makeSerialRequest( gecon.serial.command.get, gecon.serial.target.fuel ), 
                        gecon.normal.fuel.min, 
                        gecon.normal.fuel.max, 
                        0, 
                        'Fuel sensor' ).then( function ( res ) {
          resolve( res );
        }).catch( function () {
          reject();
        });
      });
    }
    function testCoolant () {
      return new Promise( function ( resolve, reject ) {
        assert.compare( null, 
                        makeSerialRequest( gecon.serial.command.get, gecon.serial.target.coolant ), 
                        gecon.normal.coolant.min, 
                        gecon.normal.coolant.max, 
                        0, 
                        'Coolant sensor' ).then( function ( res ) {
          resolve( res );
        }).catch( function () {
          reject();
        });
      });
    }
    function testOil () {
      return new Promise( function ( resolve, reject ) {
        assert.compare( null, 
                        makeSerialRequest( gecon.serial.command.get, gecon.serial.target.oil ), 
                        gecon.normal.oil.min, 
                        gecon.normal.oil.max, 
                        0, 
                        'Oil sensor' ).then( function ( res ) {
          resolve( res );
        }).catch( function () {
          reject();
        });
      });
    }
    function testCharger () {
      return new Promise( function ( resolve, reject ) {
        assert.compare( null, 
                        makeSerialRequest( gecon.serial.command.get, gecon.serial.target.charger ), 
                        gecon.normal.charger.min, 
                        gecon.normal.charger.max, 
                        0, 
                        'Charger' ).then( function ( res ) {
          resolve( res );
        }).catch( function () {
          reject();
        });
      });
    }
    function testDout ( n ) {
      return new Promise( function ( resolve, reject ) {
        let result = 0;
        assert.write( doutMap[n],
                      makeSerialRequest( gecon.serial.command.set, gecon.serial.target.dout, n ),
                      gecon.state.ok,
                      gecon.normal.doutTimeout.on,
                      ( 'DOUT ' + n ) ).then( function ( res ) {
          result += res;
          assert.write( doutMap[n],
            makeSerialRequest( gecon.serial.command.reset, gecon.serial.target.dout, n ),
            gecon.state.ok,
            gecon.normal.doutTimeout.on,
            ( 'DOUT ' + n ) ).then( function ( res ) {
            resolve( result + res );
          }).catch( function () { reject() });
        }).catch( function () { reject() });
      });
    }
    function testDin ( n ) {
      return new Promise( function ( resolve, reject ) {
        dinMap[n].state = true;
        let result = 0;
        assert.read( dinMap[n],
                     makeSerialRequest( gecon.serial.command.get, gecon.serial.target.din, n ),
                     gecon.state.on,
                     gecon.normal.dinTimeout.on,
                     ( 'DIN ' + n ) ).then( function ( res ) {
          result += res;
          dinMap[n].state = false;
          assert.read( dinMap[n],
                      makeSerialRequest( gecon.serial.command.get, gecon.serial.target.din, n ),
                      gecon.state.off,
                      gecon.normal.dinTimeout.off,
                      ( 'DIN ' + n ) ).then( function ( res ) {
            resolve( result + res );
          }).catch( function () { reject() });
        }).catch( function () { reject() });
      });
    }
    function testGeneratorVoltage ( n ) {
      return new Promise( function ( resolve, reject ) {
        generatorMap[n].state = true;
        let result = 0;
        assert.compare( generatorMap[n],
                        makeSerialRequest( gecon.serial.command.get, gecon.serial.target.generator, n ),
                        gecon.normal.generator.min,
                        gecon.normal.generator.max,
                        gecon.normal.generator.timeout,
                        ( 'Generator on ' + n ) ).then( function ( res ) {
          result += res;
          generatorMap[n].state = false;
          assert.read( generatorMap[n],
                      makeSerialRequest( gecon.serial.command.get, gecon.serial.target.generator, n ),
                      0,
                      gecon.normal.generator.timeout,
                      ( 'Generator off ' + n ) ).then( function ( res ) {
            resolve( result + res );
          }).catch( function () { reject() });
        }).catch( function () { reject() });
      });
    }
    function testMainsVoltage ( n ) {
      return new Promise( function ( resolve, reject ) {
        mainsMap[n].state = true;
        let result = 0;
        assert.compare( mainsMap[n],
                        makeSerialRequest( gecon.serial.command.get, gecon.serial.target.mains, n ),
                        gecon.normal.mains.min,
                        gecon.normal.mains.max,
                        gecon.normal.mains.timeout,
                        ( 'Mains on ' + n ) ).then( function ( res ) {
          result += res;
          mainsMap[n].state = false;
          assert.read( mainsMap[n],
                      makeSerialRequest( gecon.serial.command.get, gecon.serial.target.mains, n ),
                      0,
                      gecon.normal.mains.timeout,
                      ( 'Mains off ' + n ) ).then( function ( res ) {
            resolve( result + res );
          }).catch( function () { reject() });
        }).catch( function () { reject() });
      });
    }
    function testCurrent ( n ) {
      return new Promise( function ( resolve, reject ) {
        currentMap[n].state = true;
        let result = 0;
        assert.compare( currentMap[n],
                        makeSerialRequest( gecon.serial.command.get, gecon.serial.target.current, n ),
                        gecon.normal.current.min,
                        gecon.normal.current.max,
                        gecon.normal.current.timeout,
                        ( 'Current on ' + n ) ).then( function ( res ) {
          result += res;
          currentMap[n].state = false;
          assert.read( currentMap[n],
                      makeSerialRequest( gecon.serial.command.get, gecon.serial.target.current, n ),
                      0,
                      gecon.normal.current.timeout,
                      ( 'Current off ' + n ) ).then( function ( res ) {
            resolve( result + res );
          }).catch( function () { reject() });
        }).catch( function () { reject() });
      });
    }
    function testFrequency ( n ) {
      return new Promise( function ( resolve, reject ) {
        let dio    = generatorMap[0];
        let string = 'generator'; 
        if ( n == 0 ) {
          dio    = mainsMap[0];
          string = 'mains';
        }
        dio.state = true;
        let result = 0;
        assert.compare( dio,
                        makeSerialRequest( gecon.serial.command.get, gecon.serial.target.frequency, n ),
                        gecon.normal.frequency.min,
                        gecon.normal.frequency.max,
                        gecon.normal.frequency.timeout,
                        ( 'frequency ' + string + 'on' ) ).then( function ( res ) {
          result += res;
          dio.state = false;
          assert.read( dio,
                      makeSerialRequest( gecon.serial.command.get, gecon.serial.target.frequency, n ),
                      0,
                      gecon.normal.frequency.timeout,
                      ( 'frequency ' + string + 'off' ) ).then( function ( res ) {
            resolve( result + res );
          }).catch( function () { reject() });
        }).catch( function () { reject() });
      });
    }
    function testSpeed () {
      return new Promise( function ( resolve, reject ) {
        let result = 0;
        assert.compare( speedMap[0],
                        makeSerialRequest( gecon.serial.command.get, gecon.serial.target.speed ),
                        gecon.normal.speed.min,
                        gecon.normal.speed.max,
                        gecon.normal.speed.timeout,
                        'Speed  hight' ).then( function ( res ) {
          result += res;
          assert.write( speedMap[0],
            makeSerialRequest( gecon.serial.command.get, gecon.serial.target.speed ),
            0,
            gecon.normal.speed.timeout,
            'Speed low' ).then( function ( res ) {
            resolve( result + res );
          }).catch( function () { reject() });
        }).catch( function () { reject() });
      });
    }
    function testLED ( n ) {
      return new Promise( function ( resolve, reject ) {
        let result = 0;
        assert.input( makeSerialRequest( gecon.serial.command.set, gecon.serial.target.led, n ), ( 'LED ' + n + ' on' ) ).then( function ( res ) {
          result += res;
          assert.input( makeSerialRequest( gecon.serial.command.reset, gecon.serial.target.led, n ), ( 'LED ' + n + ' off' ) ).then( function ( res ) {
            resolve( result + res );
          }).catch( function () { reject() });
        }).catch( function () { reject() });
      });
    }
    function testButtonUp ( n ) {
      return new Promise( function ( resolve, reject ) {
        assert.serial( makeSerialRequest( gecon.serial.command.get, gecon.serial.target.sw, n ), 
                       gecon.state.off,
                       ( "Switch button up " + n ) ).then( function ( res ) {
          resolve( res );
        }).catch( function () { reject() });
      });
    }
    function testButtonDown ( n ) {
      return new Promise( function ( resolve, reject ) {
        assert.event( makeSerialRequest( gecon.serial.command.get, gecon.serial.target.sw, n ), 
                      gecon.state.on,
                      gecon.normal.sw.delay,
                      gecon.normal.sw.timeout,
                      ( "Switch button down " + n ) ).then( function ( res ) {
          resolve( res );
        }).catch( function () { reject() });
      });
    }

    function testEthernet () {
      return new Promise( function ( resolve, reject ) {
        ethernet.test( ip ).then( function () {
          log.write( 'message', 'Ethernet - Ok' );
          resolve( 1 );
        }).catch( function ( error ) {
          log.write( 'warning', 'Ethernet - Fail' );
          resolve( 0 );
        });
      });
    }
    


    testStorage().then( function ( res ) {
      testSecces += res;
      testButtonUp( 0 ).then( function ( res ) {
        testSecces += res;
        testButtonUp( 1 ).then( function ( res ) {
          testSecces += res;
          testButtonUp( 2 ).then( function ( res ) {
            testSecces += res;
            testButtonUp( 3 ).then( function ( res ) {
              testSecces += res;
              testButtonUp( 4 ).then( function ( res ) {
                testSecces += res;
                testBattery().then( function ( res ) {
                  testSecces += res;
                  testOil().then( function ( res ) {
                    testSecces += res;
                    testCoolant().then( function ( res ) {
                      testSecces += res;
                      testFuel().then( function ( res ) {
                        testSecces += res;
                        testCharger().then( function ( res ) {
                          testSecces += res;
                          testDin( 0 ).then( function ( res ) {
                            testSecces += res;
                            testDin( 1 ).then( function ( res ) {
                              testSecces += res;
                              testDin( 2 ).then( function ( res ) {
                                testSecces += res;
                                testDin( 3 ).then( function ( res ) {
                                  testSecces += res;
                                  testDout( 0 ).then( function ( res ) {
                                    testSecces += res;
                                    testDout( 1 ).then( function ( res ) {
                                      testSecces += res;
                                      testDout( 2 ).then( function ( res ) {
                                        testSecces += res;
                                        testDout( 3 ).then( function ( res ) {
                                          testSecces += res;
                                          testDout( 4 ).then( function ( res ) {
                                            testSecces += res;
                                            testDout( 5 ).then( function ( res ) {
                                              testSecces += res;
                                              testGeneratorVoltage( 0 ).then( function ( res ) {
                                                testSecces += res;
                                                testGeneratorVoltage( 1 ).then( function ( res ) {
                                                  testSecces += res;
                                                  testGeneratorVoltage( 2 ).then( function ( res ) {
                                                    testSecces += res;
                                                    testMainsVoltage( 0 ).then( function ( res ) {
                                                      testSecces += res;
                                                      testMainsVoltage( 1 ).then( function ( res ) {
                                                        testSecces += res;
                                                        testMainsVoltage( 2 ).then( function ( res ) {
                                                          testSecces += res;
                                                          testCurrent( 0 ).then( function ( res ) {
                                                            testSecces += res;
                                                            testCurrent( 1 ).then( function ( res ) {
                                                              testSecces += res;
                                                              testCurrent( 2 ).then( function ( res ) {
                                                                testSecces += res;
                                                                testFrequency( 0 ).then( function ( res ) {
                                                                  testSecces += res;
                                                                  testFrequency( 0 ).then( function ( res ) {
                                                                    testSecces += res;
                                                                    testSpeed().then( function ( res ) {
                                                                      testSecces += res;
                                                                      testLED( 0 ).then( function ( res ) {
                                                                        testSecces += res;
                                                                        testLED( 1 ).then( function ( res ) {
                                                                          testSecces += res;
                                                                          testLED( 2 ).then( function ( res ) {
                                                                            testSecces += res;
                                                                            testButtonDown( 0 ).then( function ( res ) {
                                                                              testSecces += res;
                                                                              testButtonDown( 1 ).then( function ( res ) {
                                                                                testSecces += res;
                                                                                testButtonDown( 2 ).then( function ( res ) {
                                                                                  testSecces += res;
                                                                                  testButtonDown( 3 ).then( function ( res ) {
                                                                                    testSecces += res;
                                                                                    testButtonDown( 4 ).then( function ( res ) {
                                                                                      testSecces += res;
                                                                                      testEthernet().then( function ( res ) {
                                                                                        testSecces += res;
                                                                                        if ( testSecces == testLength ) {
                                                                                          log.write( 'message', 'System test finished seccesful=)')
                                                                                          resolve();
                                                                                        } else {
                                                                                          log.write( 'warning', ( 'System test finished with errors. There are ' + ( testLength - testSecces ) + ' unseccesful tests' ) );
                                                                                          reject();
                                                                                        }
                                                                                      }).catch( function () { reject(); });
                                                                                    }).catch( function () { reject(); });    
                                                                                  }).catch( function () { reject(); });    
                                                                                }).catch( function () { reject(); });    
                                                                              }).catch( function () { reject(); });    
                                                                            }).catch( function () { reject(); });    
                                                                          }).catch( function () { reject(); });    
                                                                        }).catch( function () { reject(); });    
                                                                      }).catch( function () { reject(); });    
                                                                    }).catch( function () { reject(); });    
                                                                  }).catch( function () { reject(); });    
                                                                }).catch( function () { reject(); });    
                                                              }).catch( function () { reject(); });    
                                                            }).catch( function () { reject(); });    
                                                          }).catch( function () { reject(); });    
                                                        }).catch( function () { reject(); });
                                                      }).catch( function () { reject(); });
                                                    }).catch( function () { reject(); });
                                                  }).catch( function () { reject(); });
                                                }).catch( function () { reject(); });
                                              }).catch( function () { reject(); });
                                            }).catch( function () { reject(); });
                                          }).catch( function () { reject(); });
                                        }).catch( function () { reject(); });
                                      }).catch( function () { reject(); });
                                    }).catch( function () { reject(); });
                                  }).catch( function () { reject(); });
                                }).catch( function () { reject(); });
                              }).catch( function () { reject(); });
                            }).catch( function () { reject(); });
                          }).catch( function () { reject(); });
                        }).catch( function () { reject(); });
                      }).catch( function () { reject(); });
                    }).catch( function () { reject(); });
                  }).catch( function () { reject(); });
                }).catch( function () { reject(); });
              }).catch( function () { reject(); });
            }).catch( function () { reject(); });
          }).catch( function () { reject(); });
        }).catch( function () { reject(); });
      }).catch( function () { reject(); });
    }).catch( function () { reject(); });
  }); 
}
function main () {
  start().then( function () {
    init().then( function () {
      stlink.flash().then( function () {
        delay( resetTimeout ).then( function () {
          getData().then( function () {
            waitForTest().then( function () {
              systemTest().then( function () {
                finish();
              }).catch( function () { error(); });
            });
          }).catch( function () { error(); });
        }); 
      }).catch( function () { error(); });
    }).catch( function () { error(); });
  });
  return;
}


main();