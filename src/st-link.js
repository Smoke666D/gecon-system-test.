const spawn  = require('child_process').spawn;
const log    = require( './log.js' ); 
const fs     = require( 'fs' );

const protocol = {
  'SWD'  : 'SWD',
  'JTAG' : 'JTAG'
}
const connection = {
  'underReset' : 'UR',
  'hotPlug'    : 'HOTPLUG'
}
const freqSWD = {
  '4MHZ'   : 0,
  '5KHz'   : 1,
  '15KHz'  : 2,
  '25KHz'  : 3,
  '50KHz'  : 4,
  '100KHz' : 5,
  '125KHz' : 6,
  '240KHz' : 7,
  '480KHz' : 8,
  '9MHz'   : 9,
  '1_8MHZ' : 10
}
const freqJTAG = {
  '9MHz'    : 0,
  '140KHz'  : 1,
  '281KHz'  : 2,
  '562KHz'  : 3,
  '1125KHz' : 4,
  '2250KHz' : 5,
  '4500KHz' : 6
}
const protection = {
  'no'      : 0, /* Protection disabled */
  'reading' : 1, /* Protection enabled */
  'full'    : 2  /* Protection enabled (debug and boot in SRAM features are DISABLED) */
}
const command = {
  'protocol'    : '-C',          /* Set protocol  */
  'reset'       : '-Rst',        /* Resets the system */
  'hardReset'   : '-HardRst',    /* Hardware reset */
  'run'         : '-Run',        /* Sets the program counter and stack pointer as defined at user application and performs a run operation */
  'halt'        : '–Halt',       /* Halts the core */
  'step'        : '–Step',       /* Executes Step core instruction */
  'setBreak'    : '-SetBP',      /* Sets the software or hardware breakpoint at a specific address. If an address is not specified, 0x08000000 is used */
  'cleanBreak'  : '-ClrBP',      /* Clears all hardware breakpoints, if any */
  'readRegs'    : '–CoreReg',    /* Reads the Core registers */
  'status'      : '-SCore',      /* Detects the Core status */
  'erase'       : '-ME',         /* Executes a Full chip erase operation */
  'eraseSector' : '-SE',         /* Erases Flash sector(s) */
  'load'        : '-P',          /* Loads binary, Intel Hex or Motorola S-record file into device memory without verification. For hex and srec format, the address is relevant. */
  'verify'      : '-V',          /* Verifies that the programming operation was performed successfully */
  'list'        : '-list',       /* Get list of available ST-LINK */
  'freq'        : 'SWCLK=',      /* Set frequency of the protocol */
  'read8'       : '-r8',         /* Reads <NumBytes> memory */
  'write8'      : '-w8',         /* Writes 8-bit data to the specified memory address */
  'write32'     : '-w32',        /* Writes 32-bit data to the specified memory address */
  'compare'     : '-CmpFile',    /* Compares a binary, Intel Hex or Motorola S-record file with device memory and displays the address of the first different value */
  'checksum'    : '-Cksum',      /* Calculates the Checksum value of a given file or a specified memory zone. The algorithm used is the simple arithmetic sum algorithm, byte per byte. The result is truncated to 32-bit word. */
  'dump'        : '-Dump',       /* Reads target memory and save it in a file */
  'log'         : '-Log',        /* Enables Trace LOG file generation */
  'noPrompt'    : '-NoPrompt',   /* Disables user confirmation prompts */
  'quiet'       : '-Q',          /* Enables quiet mode. No progress bar displayed */
  'voltage'     : '-TVolt',      /* Displays target voltage */
  'readOption'  : '-rOB',        /* Displays all option bytes */
  'writeOption' : '-OB',         /* Configures the option bytes */
  'setProtect'  : 'RDP=',        /* Sets the Flash memory read protection level */
  'setTrashhold': 'BOR_LEV=',    /* Sets the Brownout Reset threshold level */
  'setWatchdog' : 'IWDG_SW=',    /* Set watchdog */
  'setStop'     : 'nRST_STOP=',  /* Set MCU reset at stop mode */
  'setStandby'  : 'nRST_STDBY='  /* Set MCU reset in standbay mode */
}

const bootloaderFileName = 'bootloader.hex';
const firmwareFileName   = 'energan-emb.hex';

function StLink () {
  function makeFlashSequence () {
    return [
      command.protocol, protocol.SWD, connection.underReset,
      command.erase,
      command.load, getHexPath( bootloaderFileName ),
      command.verify,
      command.load, getHexPath( firmwareFileName ),
      command.verify,
      command.cleanBreak,
      command.reset
    ];
  }
  function getHexPath ( name ) {
    return  process.cwd() + '\\hex\\' + name ;
  }
  function checkHexPath ( name ) {
    return fs.existsSync( getHexPath( name ) );
  }
  this.check = function () {
    return new Promise( function ( resolve, reject ) {
      const test = spawn( 'ST-LINK_CLI', [command.list], [] );
      test.stdout.on( 'data', function ( data ) {
        if ( data.indexOf( 'ST-LINK Probe 0:' ) > 0 ) {
          log.write( 'message', 'ST-LINK is ready' );
          resolve();
        } else {
          log.write( 'error', 'There is no ST-LINK' );
          reject();
        }
      });
    });
  }
  this.reset = function () {
    return new Promise( function ( resolve, reject ) {
      const message = spawn( 'ST-LINK_CLI', command.reset, [] );
      log.write( 'message', 'ST-LINK has restarted controller.' );
      resolve();
    });
  }
  this.flash = function () {
    return new Promise( function ( resolve, reject ) {
      if ( checkHexPath( bootloaderFileName ) == true ) {
        if ( checkHexPath( firmwareFileName ) == true ) {
          var   res   = false;
          const flash = spawn( 'ST-LINK_CLI', makeFlashSequence(), [] );
          log.write( 'message', 'ST-LINK has started flashing. It will take a few minutes.' );
          flash.stdout.on( 'data', function ( data ) {
            if ( data.indexOf( 'No ST-LINK detected!' ) > 0 ) {
              log.write( 'error', 'There is no ST-LINK' );
              reject();
            }
            if ( data.indexOf( 'No target connected' ) > 0 ) {
              log.write( 'error', 'There is no connected MCU to the ST-LINK' );
              reject();
            }
            if ( data.indexOf( 'Unable to open file!' ) > 0 ) {
              log.write( 'error', 'There is problem with openning hex files by ST-LINK CLI' );
              reject();
            }
            let pStr = data.indexOf( 'Verification...OK' );
            if ( ( pStr > 0 ) && ( data.toString().substring( pStr + 'Verification...OK'.length ).indexOf( 'Verification...OK' ) > 0) )  { 
              log.write( 'message', 'ST-LINK has done flashing' );
              resolve();
            } else {
              log.write( 'error', 'ST-LINK flashing fail' );
              reject();
            }

          });

          flash.stderr.on( 'data', function ( data ) {
            console.log( 'error ' + data );
          });

          flash.on( 'close', function ( code ) {
            console.log( 'close with code ' + code );
          });
        } else {
          log.write( 'error', 'There is no ' + firmwareFileName + ' file' );
          reject();  
        }
      } else {
        log.write( 'error', 'There is no ' + bootloaderFileName + ' file' );
        reject();
      }
    });
    
    
    return;
  }
  this.unprotect = function () {
    return new Promise( function ( resolve, reject ) {
      const cli = spawn( 'ST-LINK_CLI', [command.writeOption, ( command.protect + protection.no )], [] );
      cli.stdout.on( 'data', function ( data ) {
        console.log( data );
        log.write( 'message', 'MCU has been unprotected and erased' );
        resolve();
      });
    });
  }
  this.protect   = function () {
    return new Promise( function ( resolve, reject ) {
      const cli = spawn( 'ST-LINK_CLI', [command.writeOption, ( command.protect + protection.reading )], [] );
      cli.stdout.on( 'data', function ( data ) {
        console.log( data );
        log.write( 'message', 'MCU has been protected from reading' );
        resolve();
      });
    });
  }
  return;
}

module.exports.StLink = StLink;