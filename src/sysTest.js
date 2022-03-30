#!/usr/bin/env node
const log    = require( './log.js' ); 
const serial = require( './serial.js' ); 

function MbDIO ( id, bit, state ) {
  this.id    = id;
  this.bit   = bit;
  this.state = state;
  return;
} 

