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
    'mac'       : 'mac',
    'version'   : 'version'
  },
  'versions' : {
    'bootloader' : 0,
    'firmware'   : 1,
    'hardware'   : 2
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
    'max' : 24,
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
const modbus = {
  'id' : 10,
  'map' : {
    'oil'                : 0,
    'coolant'            : 1,
    'fuel'               : 2,
    'speed'              : 3,
    'mainsPhaseL1'       : 4,
    'mainsPhaseL2'       : 5,
    'mainsPhaseL3'       : 6,
    'mainsLineL1'        : 7,
    'mainsLineL2'        : 8,
    'mainsLineL3'        : 9,
    'mainsFreq'          : 10,
    'generatorPhaseL1'   : 11,
    'generatorPhaseL2'   : 12,
    'generatorPhaseL3'   : 13,
    'generatorLineL1'    : 14,
    'generatorLineL2'    : 15,
    'generatorLineL3'    : 16,
    'currentL1'          : 17,
    'currentL2'          : 18,
    'currentL3'          : 19,
    'generatorFreq'      : 20,
    'consFi'             : 21,
    'powerActive'        : 22,
    'powerReactive'      : 23,
    'powerFull'          : 24,
    'battery'            : 25,
    'charger'            : 26,
    'external'           : 27,
    'workTime'           : 28,
    'workMin'            : 29,
    'startNumber'        : 30,
    'powerReactiveUsage' : 31,
    'powerActiveUsage'   : 32,
    'powerFullUsage'     : 33,
    'fuelUsage'          : 34,
    'fuelMomentalRate'   : 35,
    'fuelAverageRate'    : 36,
    'DOUT'               : 37,
    "DIN"                : 38,
    'deviceStatus'       : 39,
    'status'             : 40,
    'error0'             : 41,
    'error1'             : 42,
    'error2'             : 43,
    'warning0'           : 44,
    'warning1'           : 45,
    'control'            : 46
  }
}

module.exports.serial = serial;
module.exports.normal = normal;
module.exports.modbus = modbus;
