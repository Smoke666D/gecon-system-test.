#!/usr/bin/env node
const log          = require( './log.js' ); 
const ethernet     = require( './ethernet.js' );
const gecon        = require( './gecon.js' );
const USB          = require( './usb.js' ).USB;
const doutMap      = require( './modbus.js' ).doutMap;
const dinMap       = require( './modbus.js' ).dinMap;
const generatorMap = require( './modbus.js' ).generatorMap;
const currentMap   = require( './modbus.js' ).currentMap;
const mainsMap     = require( './modbus.js' ).mainsMap;
const speedMap     = require( './modbus.js' ).speedMap;

function Record ( name, res ) {
  this.name = name;
  this.res  = res;
}

function makeSerialRequest ( cmd, target, data = null ) {
  let request = cmd + gecon.serial.separator + target;
  if ( data != null ) {
    request += gecon.serial.separator + data;
  }
  request += gecon.serial.postfix;
  return request;
}

function systemTest ( assert ) {
  return new Promise( function ( resolve, reject ) {
    let testLength = 1;
    let testSecces = 0;
    let list       = [];

    function testStorage () {
      return new Promise( function ( resolve, reject ) {
        let request  = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.storage )
        let expected = gecon.serial.status.ok;
        assert.serial( request, expected, 'Storage' ).then( function ( res ) {
          list.push( new Record( 'Storage', res ) );
          resolve( res );
        }).catch( function () {
          reject();
        });
      });
    }
    async function testBattery () {
      let result =  new Promise( function ( resolve, reject ) {
        let cmd = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.battery );
        let min = gecon.normal.battery.min;
        let max = gecon.normal.battery.max;
        assert.compare( null, cmd, min, max, 0, 'Battery' ).then( function ( res ) {
          list.push( new Record( 'Battery', res ) );
          resolve( res );
        }).catch( function () { reject(); });
      });
      return await result;
    }
    function testFuel () {
      return new Promise( function ( resolve, reject ) {
        let request = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.fuel );
        let min     = gecon.normal.fuel.min;
        let max     = gecon.normal.fuel.max;
        assert.compare( null, request, min, max, 0, 'Fuel sensor' ).then( function ( res ) {
          list.push( new Record( 'Fuel sensor', res ) );
          resolve( res );
        }).catch( function () {
          reject();
        });
      });
    }
    function testCoolant () {
      return new Promise( function ( resolve, reject ) {
        let request = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.coolant );
        let min     = gecon.normal.coolant.min;
        let max     = gecon.normal.coolant.max;
        assert.compare( null, request, min, max, 0, 'Coolant sensor' ).then( function ( res ) {
          list.push( new Record( 'Coolant sensor', res ) );
          resolve( res );
        }).catch( function () {
          reject();
        });
      });
    }
    function testOil () {
      return new Promise( function ( resolve, reject ) {
        let request = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.oil );
        let min     = gecon.normal.oil.min;
        let max     = gecon.normal.oil.max;
        assert.compare( null, request, min, max, 0, 'Oil sensor' ).then( function ( res ) {
          list.push( new Record( 'Oil sensor', res ) );
          resolve( res );
        }).catch( function () {
          reject();
        });
      });
    }
    function testCharger () {
      return new Promise( function ( resolve, reject ) {
        let request = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.charger );
        let min     = gecon.normal.charger.min;
        let max     = gecon.normal.charger.max;
        assert.compare( null, request, min, max, 0, 'Charger' ).then( function ( res ) {
          list.push( new Record( 'Charger', res ) );
          resolve( res );
        }).catch( function () {
          reject();
        });
      });
    }
    function testDout ( n ) {
      return new Promise( function ( resolve, reject ) {
        let result   = 0;
        let request  = makeSerialRequest( gecon.serial.command.set, gecon.serial.target.dout, n );
        let expected = ( 1 << n ).toString(); 
        let timeout  = gecon.normal.doutTimeout.on;
        assert.write( dinMap[n], request, expected, timeout, ( 'DOUT ' + n ) ).then( function ( res ) {
          result += res;
          list.push( new Record( ( 'DOUT ' + n + ' on' ), res ) );
          request  = makeSerialRequest( gecon.serial.command.reset, gecon.serial.target.dout, n );
          expected = '0';
          timeout  = gecon.normal.doutTimeout.off;
          assert.write( dinMap[n], request, expected, timeout, ( 'DOUT ' + n ) ).then( function ( res ) {
            list.push( new Record( ( 'DOUT ' + n + ' off' ), res ) );
            resolve( result + res );
          }).catch( function () { reject() });
        }).catch( function () { reject() });
      });
    }
    function testDin ( n ) {
      return new Promise( function ( resolve, reject ) {
        doutMap[n].state = true;
        let result   = 0;
        let request  = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.din, n );
        let expected = gecon.serial.state.on;
        let timeout  = gecon.normal.dinTimeout.on;
        assert.read( doutMap[n], request, expected, timeout, ( 'DIN ' + n ) ).then( function ( res ) {
          result += res;
          list.push( new Record( ( 'DIN ' + n + ' on' ), res ) );
          doutMap[n].state = false;
          request  = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.din, n );
          expected = gecon.serial.state.off;
          timeout  = gecon.normal.dinTimeout.off;
          assert.read( doutMap[n], request, expected, timeout, ( 'DIN ' + n ) ).then( function ( res ) {
            list.push( new Record( ( 'DIN ' + n + ' off' ), res ) );
            resolve( result + res );
          }).catch( function () { reject() });
        }).catch( function () { reject() });
      });
    }
    function testGeneratorVoltage ( n ) {
      return new Promise( function ( resolve, reject ) {
        generatorMap[n].state = true;
        let result  = 0;
        let request = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.generator, n );
        let min     = gecon.normal.generator.min;
        let max     = gecon.normal.generator.max;
        let timeout = gecon.normal.generator.timeout;
        assert.compare( generatorMap[n], request, min, max, timeout, ( 'Generator on ' + n ) ).then( function ( res ) {
          result += res;
          list.push( new Record( ( 'Generator on ' + n ), res ) );
          generatorMap[n].state = false;
          assert.read( generatorMap[n], request, 0, timeout, ( 'Generator off ' + n ) ).then( function ( res ) {
            list.push( new Record( ( 'Generator off ' + n ), res ) );
            resolve( result + res );
          }).catch( function () { reject() });
        }).catch( function () { reject() });
      });
    }
    function testMainsVoltage ( n ) {
      return new Promise( function ( resolve, reject ) {
        mainsMap[n].state = true;
        let result  = 0;
        let request = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.mains, n );
        let min     = gecon.normal.mains.min;
        let max     = gecon.normal.mains.max;
        let timeout = gecon.normal.mains.timeout;
        assert.compare( mainsMap[n], request, min, max, timeout, ( 'Mains on ' + n ) ).then( function ( res ) {
          result += res;
          list.push( new Record( ( 'Mains on ' + n ), res ) );
          mainsMap[n].state = false;
          assert.read( mainsMap[n], request, 0, timeout, ( 'Mains off ' + n ) ).then( function ( res ) {
            list.push( new Record( ( 'Mains off ' + n ), res ) );
            resolve( result + res );
          }).catch( function () { reject(); });
        }).catch( function () { reject(); });
      });
    }
    function testCurrent ( n ) {
      return new Promise( function ( resolve, reject ) {
        currentMap[n].state = true;
        let result  = 0;
        let request = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.current, n );
        let min     = gecon.normal.current.min;
        let max     = gecon.normal.current.max;
        let timeout = gecon.normal.current.timeout;
        assert.compare( currentMap[n], request, min, max, timeout, ( 'Current on ' + n ) ).then( function ( res ) {
          result += res;
          list.push( new Record( ( 'Current on ' + n ), res ) );
          currentMap[n].state = false;
          assert.read( currentMap[n], request, 0, timeout, ( 'Current off ' + n ) ).then( function ( res ) {
            list.push( new Record( ( 'Current off ' + n ), res ) );
            resolve( result + res );
          }).catch( function () { reject(); });
        }).catch( function () { reject(); });
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
        dio.state   = true;
        let result  = 0;
        let request = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.frequency, n );
        let min     = gecon.normal.frequency.min;
        let max     = gecon.normal.frequency.max;
        let timeout = gecon.normal.frequency.timeout;
        assert.compare( dio, request, min, max, timeout, ( 'frequency ' + string + 'on' ) ).then( function ( res ) {
          list.push( new Record( ( 'frequency ' + string + 'on' ), res ) );
          result += res;
          dio.state = false;
          assert.read( dio, request, 0, timeout, ( 'frequency ' + string + 'off' ) ).then( function ( res ) {
            list.push( new Record( ( 'frequency ' + string + 'off' ), res ) );
            resolve( result + res );
          }).catch( function () { reject(); });
        }).catch( function () { reject(); });
      });
    }
    function testSpeed () {
      return new Promise( function ( resolve, reject ) {
        let result = 0;
        let request = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.speed );
        let min     = gecon.normal.speed.min;
        let max     = gecon.normal.speed.max;
        let timeout = gecon.normal.speed.timeout;
        assert.compare( speedMap[0], request, min, max, timeout, 'Speed  hight' ).then( function ( res ) {
          list.push( new Record( 'Speed  hight', res ) );
          result += res;
          assert.write( speedMap[0], request, 0, timeout, 'Speed low' ).then( function ( res ) {
            list.push( new Record( 'Speed  low', res ) );
            resolve( result + res );
          }).catch( function () { reject() });
        }).catch( function () { reject() });
      });
    }
    function testLED ( n ) {
      return new Promise( function ( resolve, reject ) {
        let result  = 0;
        let request = makeSerialRequest( gecon.serial.command.set, gecon.serial.target.led, n );
        assert.input( request, ( 'LED ' + n + ' on' ) ).then( function ( res ) {
          list.push( new Record( ( 'LED ' + n + ' on' ), res ) );
          result += res;
          request = makeSerialRequest( gecon.serial.command.reset, gecon.serial.target.led, n );
          assert.input( request, ( 'LED ' + n + ' off' ) ).then( function ( res ) {
            list.push( new Record( ( 'LED ' + n + ' off' ), res ) );
            resolve( result + res );
          }).catch( function () { reject() });
        }).catch( function () { reject() });
      });
    }
    async function testButtonUp ( n ) {
      return new Promise( function ( resolve, reject ) {
        let request  = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.sw, n );
        let expected = gecon.serial.state.off;
        assert.serial( request, expected, ( "Switch button up " + n ) ).then( function ( res ) {
          list.push( new Record( ( "Switch button up " + n ), res ) );
          resolve( res );
        }).catch( function () { reject() });
      });
    }
    function testButtonDown ( n ) {
      return new Promise( function ( resolve, reject ) {
        let request  = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.sw, n )
        let expected = gecon.serial.state.on;
        let delay    = gecon.normal.sw.delay;
        let timeout  = gecon.normal.sw.timeout;  
        assert.event( request, expected, delay, timeout,( "Switch button down " + n ) ).then( function ( res ) {
          list.push( new Record( ( "Switch button down " + n ), res ) );
          resolve( res );
        }).catch( function () { reject() });
      });
    }
    function testSD () {
      return new Promise( function ( resolve, reject ) {
        let request  = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.sd );
        let expected = gecon.serial.state.on;
        assert.serial( request, expected, "SD card" ).then( function ( res ) {
          list.push( new Record( "SD card", res ) );
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
      return new Promise( function ( resolve, reject ) {
        let id  = gecon.modbus.id;
        let adr = gecon.modbus.map.battery;
        let min = gecon.normal.battery.min * 10;
        let max = gecon.normal.battery.max * 10;
        assert.modbus( id, adr, min, max, 'Modbus', 'holding' ).then( function ( res ) {
          list.push( new Record( 'Modbus', res ) );
          resolve( res );
        }).catch( function () { 
          reject() 
        });
      });
    }
    function testTime () {
      return new Promise( function ( resolve, reject ) {
        let setRequest = makeSerialRequest( gecon.serial.command.set, gecon.serial.target.time, gecon.normal.time.value );
        let getRequest = makeSerialRequest( gecon.serial.command.get, gecon.serial.target.time );
        let timeout    = gecon.normal.time.timeout;
        let expected   = gecon.normal.time.expected;
        log.write( 'message', 'RTC test started. It will take ' + timeout + ' ms...' );
        assert.charge( setRequest, getRequest, timeout, expected, 'RTC' ).then( function ( res ) {
          list.push( new Record( 'RTC', res ) );
          resolve( res );
        }).catch( function () { reject() });
      });
    }
    function testUSB () {
      return new Promise( function ( resolve ) {
        let usb = new USB();
        usb.scan().then( function () {
          log.write( 'message', 'USB - Ok' );
          list.push( new Record( 'USB', 1 ) );
          resolve( 1 );
        }).catch( function () {
          log.write( 'warning', 'USB - fail' );
          list.push( new Record( 'USB', 0 ) );
          resolve( 0 );
        });
      });
    }

    function finish () {
      return new Promise( function ( resolve ) {
        list.forEach( function ( record ) {
          testSecces += record.res;
        });
        if ( testSecces >= testLength ) {
          log.write( 'message', 'System test finished seccesful=)')
          resolve( true );
        } else {
          log.write( 'warning', ( 'System test finished with errors. There are ' + ( testLength - testSecces ) + ' unseccesful tests' ) );
          resolve( false );
        }
      });
    }
    async function run () {
      list = [];
      let res = false;
      try {
        await testSD();
        /*
        await testTime();
        await testUSB();
        await testButtonUp( 0 );
        await testButtonUp( 1 );
        await testButtonUp( 2 );
        await testButtonUp( 3 );
        await testButtonUp( 4 );
        await testStorage();
        await testBattery();
        await testOil();
        await testFuel();
        await testCharger();
        await testDin( 0 );
        await testDin( 1 );
        await testDin( 2 );
        await testDin( 3 );
        await testDout( 0 );
        await testDout( 1 );
        await testDout( 2 );
        await testDout( 3 );
        await testDout( 4 );
        await testDout( 5 );
        await testGeneratorVoltage( 0 );
        await testGeneratorVoltage( 1 );
        await testGeneratorVoltage( 2 );
        await testMainsVoltage( 0 );
        await testMainsVoltage( 1 );
        await testMainsVoltage( 2 );
        await testCurrent( 0 );
        await testCurrent( 1 );
        await testCurrent( 2 );
        await testFrequency( 0 );
        await testFrequency( 1 );
        await testSpeed();
        await testEthernet();
        await testModbus();
        await testButtonDown( 0 );
        await testButtonDown( 1 );
        await testButtonDown( 2 );
        await testButtonDown( 3 );
        await testButtonDown( 4 );
        await testLED( 0 );
        await testLED( 1 );
        await testLED( 2 );
        */
        res = await finish();
        return Promise.resolve( [list, res] );
      } catch {
        return Promise.reject();
      }
    }
    run().then( function ( data ) {
      resolve( data );
    }).catch( function () {
      reject();
    });
  }); 
}


module.exports.systemTest = systemTest;
module.exports.makeSerialRequest = makeSerialRequest;