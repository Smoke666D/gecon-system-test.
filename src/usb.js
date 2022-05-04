#!/usr/bin/env node
var HID = require( 'node-hid' );

function USB () {
  var device = null;
  this.scan = function () {
    return new Promise ( function ( resolve, reject ) {
      var devices = HID.devices();
      device = null;
      for ( var i=0; i<devices.length; i++ ) {
        if ( devices[i].manufacturer == "Energan" ) {
          device = new HID.HID( devices[i].path );
          resolve( device );
          break;
        }
      }
      reject();
    });
  }
  return;
}

module.exports.USB = USB;