const https = require( 'https' );

function testEth ( ip ) {
  return new Promise( function ( resolve, reject ) {
    const options = {
      hostname: ip,
      port: 443,
      path: '',
      method: 'GET'
    }
    
    https.get( options, function ( response ) {
      if ( response.statusCode == 200 ) {
        resolve();
      } else {
        reject( 'Ethernet response from ' + ip + ' is wrong' );
      }
    });
  });
}

module.exports.test = testEth;