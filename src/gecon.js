#!/usr/bin/env node
const serial = {
  'separator': ' ',
  'postfix'  : '\n',
  'command': {
    'no'    : 'no',
    'set'   : 'set',
    'reset' : 'reset',
    'get'   : 'get'
  },
  'target' : {
    'no'        : 'no',      // yes
    'din'       : 'din',     // yes
    'dout'      : 'dout',    // yes
    'time'      : 'time',
    'oil'       : 'oil',     // yes
    'coolant'   : 'cool',    // yes
    'fuel'      : 'fuel',    // yes
    'battery'   : 'bat',     // yes
    'charger'   : 'charg',   // yes
    'generator' : 'gen',     // yes
    'mains'     : 'mains',   // yes
    'current'   : 'cur',     // yes
    'freq'      : 'freq',    // yes
    'speed'     : 'speed',   // yes
    'sw'        : 'sw',      // yes
    'led'       : 'led',     // yes
    'storage'   : 'storage', // yes
    'id'        : 'id',
    'ip'        : 'ip,',
    'mac'       : 'mac'
  },
  'state' : {
    'on'  : 'on',
    'off' : 'off'
  },
  'status' : {
    'ok'             : 'Ok',
    'errorCommand'   : 'Wrong command',
    'errorTarget'    : 'Wrong target',
    'errorData'      : 'Wrong data',
    'errorExecuting' : 'Executing error',
    'errorUnknown'   : 'Unknown error'
  },
};
const normal = {
  'battery' : {
    'min' : 23,
    'max' : 24
  },
  'oil' : {
    'min' : 0,
    'max' : 1
  },
  'coolant' : {
    'min' : 0,
    'max' : 1
  },
  'fuel' : {
    'min' : 0,
    'max' : 1
  },
  'charger' : {
    'min' : 0,
    'max' : 1
  },
  'dinTimeout' : {
    'on'  : 10,
    'off' : 10
  },
  'doutTimeout' : {
    'on'  : 10,
    'off' : 10
  },
  'generator' : {
    'timeout' : 10,
    'min' : 210,
    'max' : 230
  },
  'mains' : {
    'timeout' : 10,
    'min' : 210,
    'max' : 230
  },
  'current' : {
    'timeout' : 10,
    'min' : 10,
    'max' : 20
  },
  'frequency' : {
    'timeout' : 10,
    'min' : 45,
    'max' : 55
  }, 
  'speed' : {
    'timeout' : 3000,
    'min' : 45,
    'max' : 55
  },
  'sw' : {
    'timeout' : 10000,
    'delay'   : 100,
  }
}

module.exports.serial = serial;
module.exports.normal = normal;