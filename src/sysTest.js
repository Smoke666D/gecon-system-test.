#!/usr/bin/env node
const log      = require( './log.js' ); 
const ethernet = require( './ethernet.js' );
const gecon    = require( './gecon.js' );

function Record ( name, res ) {
  this.name = name;
  this.res  = res;
}

function systemTest ( assert ) {
  return new Promise( function ( resolve, reject ) {
    let testLength = 1;
    let testSecces = 0;
    let list       = [];

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
          list.push( new Record( 'Storage', res ) );
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
          list.push( new Record( 'Battery', res ) );
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
          list.push( new Record( 'Fuel sensor', res ) );
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
          list.push( new Record( 'Coolant sensor', res ) );
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
          list.push( new Record( 'Oil sensor', res ) );
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
          list.push( new Record( 'Charger', res ) );
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
          list.push( new Record( ( 'DOUT ' + n + ' on' ), res ) );
          assert.write( doutMap[n],
                        makeSerialRequest( gecon.serial.command.reset, gecon.serial.target.dout, n ),
                        gecon.state.ok,
                        gecon.normal.doutTimeout.on,
                        ( 'DOUT ' + n ) ).then( function ( res ) {
            list.push( new Record( ( 'DOUT ' + n + ' off' ), res ) );
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
          list.push( new Record( ( 'DIN ' + n + ' on' ), res ) );
          dinMap[n].state = false;
          assert.read( dinMap[n],
                      makeSerialRequest( gecon.serial.command.get, gecon.serial.target.din, n ),
                      gecon.state.off,
                      gecon.normal.dinTimeout.off,
                      ( 'DIN ' + n ) ).then( function ( res ) {
            list.push( new Record( ( 'DIN ' + n + ' off' ), res ) );
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
          list.push( new Record( ( 'Generator on ' + n ), res ) );
          generatorMap[n].state = false;
          assert.read( generatorMap[n],
                      makeSerialRequest( gecon.serial.command.get, gecon.serial.target.generator, n ),
                      0,
                      gecon.normal.generator.timeout,
                      ( 'Generator off ' + n ) ).then( function ( res ) {
            list.push( new Record( ( 'Generator off ' + n ), res ) );
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
          list.push( new Record( ( 'Mains on ' + n ), res ) );
          mainsMap[n].state = false;
          assert.read( mainsMap[n],
                      makeSerialRequest( gecon.serial.command.get, gecon.serial.target.mains, n ),
                      0,
                      gecon.normal.mains.timeout,
                      ( 'Mains off ' + n ) ).then( function ( res ) {
            list.push( new Record( ( 'Mains off ' + n ), res ) );
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
          list.push( new Record( ( 'Current on ' + n ), res ) );
          currentMap[n].state = false;
          assert.read( currentMap[n],
                      makeSerialRequest( gecon.serial.command.get, gecon.serial.target.current, n ),
                      0,
                      gecon.normal.current.timeout,
                      ( 'Current off ' + n ) ).then( function ( res ) {
            list.push( new Record( ( 'Current off ' + n ), res ) );
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
          list.push( new Record( ( 'frequency ' + string + 'on' ), res ) );
          result += res;
          dio.state = false;
          assert.read( dio,
                      makeSerialRequest( gecon.serial.command.get, gecon.serial.target.frequency, n ),
                      0,
                      gecon.normal.frequency.timeout,
                      ( 'frequency ' + string + 'off' ) ).then( function ( res ) {
            list.push( new Record( ( 'frequency ' + string + 'off' ), res ) );
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
          list.push( new Record( 'Speed  hight', res ) );
          result += res;
          assert.write( speedMap[0],
                        makeSerialRequest( gecon.serial.command.get, gecon.serial.target.speed ),
                        0,
                        gecon.normal.speed.timeout,
                        'Speed low' ).then( function ( res ) {
            list.push( new Record( 'Speed  low', res ) );
            resolve( result + res );
          }).catch( function () { reject() });
        }).catch( function () { reject() });
      });
    }
    function testLED ( n ) {
      return new Promise( function ( resolve, reject ) {
        let result = 0;
        assert.input( makeSerialRequest( gecon.serial.command.set, gecon.serial.target.led, n ), ( 'LED ' + n + ' on' ) ).then( function ( res ) {
          list.push( new Record( ( 'LED ' + n + ' on' ), res ) );
          result += res;
          assert.input( makeSerialRequest( gecon.serial.command.reset, gecon.serial.target.led, n ), ( 'LED ' + n + ' off' ) ).then( function ( res ) {
            list.push( new Record( ( 'LED ' + n + ' off' ), res ) );
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
          list.push( new Record( ( "Switch button up " + n ), res ) );
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
          list.push( new Record( ( "Switch button down " + n ), res ) );
          resolve( res );
        }).catch( function () { reject() });
      });
    }
    function testEthernet () {
      return new Promise( function ( resolve ) {
        ethernet.test( ip ).then( function () {
          log.write( 'message', 'Ethernet - Ok' );
          list.push( new Record( 'Ethernet', 1 ) );
          resolve( 1 );
        }).catch( function ( error ) {
          log.write( 'warning', 'Ethernet - Fail' );
          list.push( new Record( 'Ethernet', 0 ) );
          resolve( 0 );
        });
      });
    }
    function testModbus () {
      return new Promise( function ( resolve ) {
        assert.modbus( gecon.modbus.id, gecon.modbus.map.battery, gecon.normal.battery.min, gecon.normal.battery.max, 'Modbus' ).then( function ( res ) {
          list.push( new Record( 'Modbus', res ) );
          resolve( res );
        })
      });
    }
    async function run ( test, onError  ) {
      try {
        return await test();
      } catch( data ) {
        return onError();
      }
    }

    list = [];

    run( testStorage(),             reject() );
    run( testButtonUp( 0 ),         reject() );
    run( testButtonUp( 1 ),         reject() );
    run( testButtonUp( 2 ),         reject() );
    run( testButtonUp( 3 ),         reject() );
    run( testButtonUp( 4 ),         reject() );
    run( testBattery(),             reject() );
    run( testOil(),                 reject() );
    run( testCoolant(),             reject() );
    run( testFuel(),                reject() );
    run( testCharger(),             reject() );
    run( testDin( 0 ),              reject() );
    run( testDin( 1 ),              reject() );
    run( testDin( 2 ),              reject() );
    run( testDin( 3 ),              reject() );
    run( testDout( 0 ),             reject() );
    run( testDout( 1 ),             reject() );
    run( testDout( 2 ),             reject() );
    run( testDout( 3 ),             reject() );
    run( testDout( 4 ),             reject() );
    run( testDout( 5 ),             reject() );
    run( testGeneratorVoltage( 0 ), reject() );
    run( testGeneratorVoltage( 1 ), reject() );
    run( testGeneratorVoltage( 2 ), reject() );
    run( testMainsVoltage( 0 ),     reject() );
    run( testMainsVoltage( 1 ),     reject() );
    run( testMainsVoltage( 2 ),     reject() );
    run( testCurrent( 0 ),          reject() );
    run( testCurrent( 1 ),          reject() );
    run( testCurrent( 2 ),          reject() );
    run( testFrequency( 0 ),        reject() );
    run( testFrequency( 1 ),        reject() );
    run( testSpeed(),               reject() );
    run( testLED( 0 ),              reject() );
    run( testLED( 1 ),              reject() );
    run( testLED( 2 ),              reject() );
    run( testButtonDown( 0 ),       reject() );
    run( testButtonDown( 1 ),       reject() );
    run( testButtonDown( 2 ),       reject() );
    run( testButtonDown( 3 ),       reject() );
    run( testButtonDown( 4 ),       reject() );
    run( testEthernet(),            reject() );
    run( testModbus(),              reject() );
    testSecces = 0;
    list.forEach( function ( record ) {
      testSecces += record.res;
    });
    if ( testSecces == testLength ) {
      log.write( 'message', 'System test finished seccesful=)')
    } else {
      log.write( 'warning', ( 'System test finished with errors. There are ' + ( testLength - testSecces ) + ' unseccesful tests' ) );
    }
    resolve( list );

/*
    testStorage().then( function ( res ) {
      testButtonUp( 0 ).then( function ( res ) {
        testButtonUp( 1 ).then( function ( res ) {
          testButtonUp( 2 ).then( function ( res ) {
            testButtonUp( 3 ).then( function ( res ) {
              testButtonUp( 4 ).then( function ( res ) {
                testBattery().then( function ( res ) {
                  testOil().then( function ( res ) {
                    testCoolant().then( function ( res ) {
                      testFuel().then( function ( res ) {
                        testCharger().then( function ( res ) {
                          testDin( 0 ).then( function ( res ) {
                            testDin( 1 ).then( function ( res ) {
                              testDin( 2 ).then( function ( res ) {
                                testDin( 3 ).then( function ( res ) {
                                  testDout( 0 ).then( function ( res ) {
                                    testDout( 1 ).then( function ( res ) {
                                      testDout( 2 ).then( function ( res ) {
                                        testDout( 3 ).then( function ( res ) {
                                          testDout( 4 ).then( function ( res ) {
                                            testDout( 5 ).then( function ( res ) {
                                              testGeneratorVoltage( 0 ).then( function ( res ) {
                                                testGeneratorVoltage( 1 ).then( function ( res ) {
                                                  testGeneratorVoltage( 2 ).then( function ( res ) {
                                                    testMainsVoltage( 0 ).then( function ( res ) {
                                                      testMainsVoltage( 1 ).then( function ( res ) {
                                                        testMainsVoltage( 2 ).then( function ( res ) {
                                                          testCurrent( 0 ).then( function ( res ) {
                                                            testCurrent( 1 ).then( function ( res ) {
                                                              testCurrent( 2 ).then( function ( res ) {
                                                                testFrequency( 0 ).then( function ( res ) {
                                                                  testFrequency( 1 ).then( function ( res ) {
                                                                    testSpeed().then( function ( res ) {
                                                                      testLED( 0 ).then( function ( res ) {
                                                                        testLED( 1 ).then( function ( res ) {
                                                                          testLED( 2 ).then( function ( res ) {
                                                                            testButtonDown( 0 ).then( function ( res ) {
                                                                              testButtonDown( 1 ).then( function ( res ) {
                                                                                testButtonDown( 2 ).then( function ( res ) {
                                                                                  testButtonDown( 3 ).then( function ( res ) {
                                                                                    testButtonDown( 4 ).then( function ( res ) {
                                                                                      testEthernet().then( function ( res ) {
                                                                                        testModbus().then( function ( res ) {
                                                                                          testSecces = 0;
                                                                                          list.forEach( function ( record ) {
                                                                                            testSecces += record.res;
                                                                                          });
                                                                                          if ( testSecces == testLength ) {
                                                                                            log.write( 'message', 'System test finished seccesful=)')
                                                                                          } else {
                                                                                            log.write( 'warning', ( 'System test finished with errors. There are ' + ( testLength - testSecces ) + ' unseccesful tests' ) );
                                                                                          }
                                                                                          resolve( list );
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
    }).catch( function () { reject(); });
    */
  }); 
}


module.exports.systemTest = systemTest;