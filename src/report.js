#!/usr/bin/env node
const log = require( './log.js' );
const fs  = require( 'fs' );

const reportFolder = process.cwd() + '\\reports\\';
const extension    = '.txt';
const writeSucces  = true;

function Version ( ) {
  this.bootloader = '0.0.0';
  this.firmware   = '0.0.0';
  this.hardware   = '0.0.0';
  return;
}
function Report () {
  var output  = '';
  var id      = '';
  var version = new Version(); 

  function makeHeader () {
    output = '';
    output += '-------------------------------------------\n'
    output += '[DATE]     ' + log.getDate() + '\n';
    output += '[VERSION]  Bootlader : ' + version.bootloader + '\n';
    output += '[VERSION]  Firmware  : ' + version.firmware   + '\n';
    output += '[VERSION]  Hardware  : ' + version.hardware   + '\n';
    return;
  }
  function addTest ( name, res ) {
    let string = 'fail';
    if ( res > 0 ) {
      string = 'ok';
    }
    output += '[TEST]     ' + name + ': ' + string + '\n';
  }
  function add ( list ) {
    return new Promise( function ( resolve ) {
      list.forEach( function ( record ) {
        if ( ( record.res == 0) || ( ( record.res > 0 ) && ( writeSucces > 0 ) ) ) {
          addTest( record.name, record.res );
        }
      });
      resolve();
    });
    return;
  }
  this.write = function ( list ) {
    return new Promise( function ( resolve, reject ) {
      let path = reportFolder + id + extension;
      add( list ).then( function () {
        fs.appendFile( path, output, 'utf-8', function ( error ) {
          if ( error ) {
            log.write( 'error', 'Error on report writi  ng' );
            reject();
          }
          resolve();
        });
      });
    });
  }
  this.init = function ( inid, inversion ) {
    return new Promise( function ( resolve ) {
      id                 = inid;
      version.bootloader = inversion.bootloader;
      version.firmware   = inversion.firmware;
      version.hardware   = inversion.hardware;
      makeHeader();
      resolve();
    });
    return;
  }
  return;
}

module.exports.Report  = Report;
module.exports.Version = Version;