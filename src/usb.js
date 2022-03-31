#!/usr/bin/env node
var HID = require( 'node-hid' );

function USB () {
  var self   = this;
  var device = null;

  this.scan = function () {
    return new Promise ( function ( resolve, reject ) {
      var devices = HID.devices();
      var res     = 0;
      device = null;
      for ( var i=0; i<devices.length; i++ ) {
        if ( devices[i].manufacturer == "Energan" ) {
          device = new HID.HID( devices[i].path );
          res    = 1;
          resolve( device );
          break;
        }
      }
      if ( device == null ) {
        reject();
      }
    });
  }
  return;
}

module.exports.USB = USB;