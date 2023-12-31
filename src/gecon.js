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
    'unique'    : 'unique',
    'released'  : 'released',
    'serial'    : 'serial',
    'ip'        : 'ip,',
    'mac'       : 'mac',
    'version'   : 'version',
    'adr'       : 'adr',
    'baudrate'  : 'baudrate',
    'sd'        : 'sd'
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
  }
};
const normal = {
  'time' : {
    'value'    : '21.10.22.11.45.24.',
    'expected' : '21.10.22.11.45.26.',
    'timeout'  : 3000
  },
  'battery' : {
    'min' : 22, /* V */
    'max' : 25, /* V */
  },
  'oil' : {
    'min' : 0, /* Bar */
    'max' : 20 /* Bar */
  },
  'coolant' : {
    'min' : 0,   /* 'C */
    'max' : 260 /* 'C */
  },
  'fuel' : {
    'min' : 0,   /* % */
    'max' : 120  /* % */
  },
  'charger' : {
    'min' : 0, /* V */
    'max' : 5  /* V */
  },
  'dinTimeout' : {
    'on'  : 250, /* ms */
    'off' : 250  /* ms */
  },
  'doutTimeout' : {
    'on'  : 300,   /* ms, Heartinig timeout */
    'off' : 100     /* ms */
  },
  'generator' : {
    'timeout' : 1250, /* ms */
    'min' : 210,
    'max' : 230
  },
  'mains' : {
    'timeout' : 1250, /* ms */
    'min' : 210,
    'max' : 230
  },
  'current' : {
    'timeout' : 1250, /* ms */
    'min' : 10,
    'max' : 20
  },
  'frequency' : {
    'timeout' : 250, /* ms */
    'min' : 45,
    'max' : 55
  }, 
  'speed' : {
    'timeout' : 3000, /* ms */
    'min' : 45,
    'max' : 55
  },
  'sw' : {
    'timeout' : 10000, /* ms */
    'delay'   : 100,   /* ms */
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
