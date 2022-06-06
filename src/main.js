#!/usr/bin/env node
const log        = require( './log.js' ); 
const Serial     = require( './serial.js' ).Serial;
const Envir      = require( './serial.js' ).SerialEnv;
const Modbus     = require( './modbus.js' ).Modbus;
const StLink     = require( './st-link.js' ).StLink;
const Assert     = require( './asserts.js').Assert;
const gecon      = require( './gecon.js' );
const systemTest = require( './sysTest.js' ).systemTest;
const reports    = require( './report.js');
const fs         = require( 'fs' );
var   doutMap    = require( './modbus.js' ).doutMap;
var   dinMap     = require( './modbus.js' ).dinMap;

const makeSerialRequest = require( './sysTest.js' ).makeSerialRequest;

var doutMap      = require( './modbus.js' ).doutMap;
var dinMap       = require( './modbus.js' ).dinMap;
var generatorMap = require( './modbus.js' ).generatorMap;
var mainsMap     = require( './modbus.js' ).mainsMap;
var currentMap   = require( './modbus.js' ).currentMap;
var speedMap     = require( './modbus.js' ).speedMap;

let serial  = new Serial();
let envir   = new Envir();
let modbus  = new Modbus();
let stlink  = new StLink();
let assert  = new Assert( serial, modbus );
let version = new reports.Version();
let report  = new reports.Report();

let id  = '';
let ip  = '';
let mac = '';
let num = 0;

const setupSerialFile = 'serial.txt';
const setupModbusFile = 'modbus.txt';
const macAddressFile  = 'mac.txt';
const serialNumberFile = "serialNumber.txt";

const serialSpeed  = 115200;
const modbusSpeed  = 115200;
const resetTimeout = 10000;  /* ms */
const macBase      = 0x320000000000;

function serialNumberInit() {
  return new Promise( function ( resolve, reject ) {
    if ( fs.existsSync( serialNumberFile ) ) {
      fs.readFile( serialNumberFile, 'utf8', function ( error, data ) {
        if ( error ) {
          log.write( 'error', 'Error on reading serial number storage file' );
          reject();
        } else {
          if ( data.indexOf( '\n' ) == -1 ) {
            num = parseInt( data );
            if ( isNaN( num ) ) {
              log.write( 'error', 'Error on number reading from serial number file' );
              reject();    
            } else {
              num++;
              log.write( 'message', ( "Serial number: " + num ) );
              resolve();
            }
          }
        }
      });
    } else {
      num = 1;
      fs.writeFile( serialNumberFile, num.toString(), function ( error ) {
        if ( error ) {
          log.write( 'error', 'Error on writing serial number storage file' );
          reject();
        } else {
          log.write( 'message', "There wasn't serial number storage file. New file has been creating." );
          log.write( 'message', ( "Serial number: " + num ) );
          resolve();
        }
      });
    }    
  });
}

function writeSerialNumber () {
  return new Promise( function ( resolve, reject ) {
    let date   = new Date();
    let strNum = num;
    if ( num < 9999 ) {
      strNum = ( '0000' + num ).slice( -2 );
    }
    let out = date.getYear().toString().slice(-2) + 
              ( '00' + date.getMonth() ).slice( -2 ) +
              ( '00' + date.getDate() ).slice( -2 ) +
              '.' + strNum;
    serial.write( out ).then( function () {
      fs.writeFile( serialNumberFile, out, function ( error ) {
        if ( error ) {
          log.write( 'error', 'Error on serial umber writing to the file' );
          reject();
        } else {
          log.write( 'message', ( "Serial number was wrote: " + out ) );
          resolve();
        }
      });
    }).catch( function () {
      log.write( 'error', 'Error on serial umber writing to the device' );
      reject();
    });
  });
}

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
  modbus.close().then( function () {
    serial.close().then( function () {
      log.write( 'error', 'Finish with error!' );
      process.exit();
    });
  });
  return;
}
function finish () {
  modbus.close().then( function () {
    serial.close().then( function () {
      log.write( 'message', 'Finish!' );
      process.exit();
    });
  });
  return;
}
function init () {
  return new Promise( function ( resolve, reject ) {
    serialNumberInit().then( function () {
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
    }).catch( function () {
      reject();
    });
  });
}
function getDeviceData ( target, length = 0, data = null ) {
  return new Promise( function ( resolve, reject ) {
    serial.write( makeSerialRequest( gecon.serial.command.get, target, data ) ).then( function () {
      serial.read().then( function ( data ) {
        if ( data.length >= length ) {
          resolve( data.substring( 0, data.indexOf( '\n' ) ) );
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
          getDeviceData( gecon.serial.target.version, 5, gecon.serial.versions.bootloader ).then( function ( data ) {
            version.bootloader = data;
            log.write( 'message', ( 'Bootloader version : ' + data ) );
            getDeviceData( gecon.serial.target.version, 5, gecon.serial.versions.firmware ).then( function ( data ) {
              version.firmware = data;
              log.write( 'message', ( 'Firmware version   : ' + data ) );
              getDeviceData( gecon.serial.target.version, 5, gecon.serial.versions.hardware ).then( function ( data ) {
                version.hardware = data;
                log.write( 'message', ( 'Hardwre version    : ' + data ) );
                resolve();
              }).catch( function () {
                log.write( 'error', 'Error on hardware version reading' );
                reject();
              });
            }).catch( function () {
              log.write( 'error', 'Error on firmware version reading' );
              reject();
            });
          }).catch( function () {
            log.write( 'error', 'Error on bootloader version reading' );
            reject();
          });
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
function getNewMAC () {
  return new Promise( function ( resolve, reject ) {
    fs.readFile( macAddressFile, 'utf-8', function ( data ) {
      let lines = data.split(/\r?\n/);
      let adr   = macBase;
      if ( lines.length > 0 ) {
        adr = parseInt( lines[lines.length - 1], 16 ) + 1;
      }
      fs.appendFile( macAddressFile, last.toString( 16 ), { encoding : 'utf-8' }, function ( error ) {
        if ( error ) {
          log.write( 'error', 'Error on writing to MAC address file')
          reject();
        }
        let string = adr.toString( 16 );
        let output = '';
        for ( var i=0; i<( string.length / 2 ); i++ ) {
          output += string.substring( (2*i), (2*i + 2) ) + ':';
        }
        log.write( 'message', ( 'New MAC address is ' + output ) );
        resolve( adr );
      });
    });
  });
}
function writeMAC () {
  return new Promise( function ( resolve, reject ) {
    getNewMAC().then( function ( data ) {
      serial.write( makeSerialRequest( gecon.serial.command.set, gecon.serial.target.mac, data ) ).then( function () {
        serial.read().then( function ( response ) {
          if ( response == gecon.serial.status.ok ) {
            log.wtite( 'message', 'MAC address has been written. The changes will take effect after reset.' );
            stlink.reset().then( function () {
              delay( resetTimeout ).then( function () {
                resolve();
              });
            });
          }
        });
      }).catch( function () { reject(); });
    }).catch( function () { reject(); });
  });
}
function testModBus () {
  start().then( function() {
    modbusInit().then( function () {
      modbus.getOvenByID( dinMap[0].id ).then( function ( oven ) {
        oven.get( dinMap[0].bit ).then( function () {
          oven.get( dinMap[1].bit ).then( function () {
            modbus.getOvenByID( doutMap[0].id ).then( function ( oven ) {
              doutMap[0].state = true;
              oven.set( doutMap[0].bit, doutMap[0].state ).then( function () {
                doutMap[0].state = false;
                oven.set( doutMap[0].bit, doutMap[0].state ).then( function () {
                  finish();
                }).catch( function () { error(); } );
              }).catch( function () { error(); } );
            }).catch( function () { error(); } );
          }).catch( function () { error(); } );
        }).catch( function () { error(); } );
      }).catch( function () { error(); } );
    }).catch( function () { error(); } );
  }).catch( function () { error(); } );
  return;
}

async function test ( flash = false ) {
  try {
    await start();
    await init();
    if ( flash == true ) {
      await stlink.flash();
      await delay( resetTimeout );
    }
    await getData();
    await report.init( id, version );
    const list = await systemTest( assert );
    await report.write( list );
    await writeSerialNumber();
    finish();
  } catch {
    error();
  }
  return;
}

function printHelp () {
  console.log( 'gecon-system-test:' );
  console.log( '   -h: help message ' );
  console.log( '   -v: version of application' );
  console.log( '   -m: modbus test' );
  console.log( '   -f: run test with flash' );
  process.exit();
  return;
}

function printVersion () {
  console.log( 'gecon-system-test version ' + process.env.npm_package_version );
  process.exit();
  return;
}

function argsAnaliz ( arg ) {
  switch ( arg ) {
    case '-h':
      printHelp();
      break;
    case '-v':
      printVersion();
      break;  
    case '-m':
      testModBus();
      break;
    case '-f':
      test( true );
      break;
    default:
      test( false );
      break;  
  }
  return;
}

async function main () {
  argsAnaliz( process.argv[2] );
  return;
}

main();
