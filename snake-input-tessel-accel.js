var Tessel = require('tessel');


// Enable ES6 promises
require('es6-promise').polyfill();


// Accelerometer HW
var ACCEL;

// Last acquired accelerometer state
var lastData = [0,0,0];


/* Update locally stored last state of accelerometer using the data
 * acquired from the accelerometer
 */
function updateAccel (xyz) {
  lastData[0] = xyz[0];
  lastData[1] = xyz[1];
  lastData[2] = xyz[2];
}



/* Initialize
 */
exports.init = function () {
  console.log('[ACCEL] sensor starting up...');
  ACCEL = require('accel-mma84').use(Tessel.port['B']);

  return (new Promise(function (resolve, reject) {

    // Update every 50ms
    ACCEL.setOutputRate(10, function(err) {

      // Failed to set output rate
      if (err) return reject(err);

      // Set up automatic updating
      ACCEL.on('data', updateAccel);

      // Get first batch of data and return
      ACCEL.getAcceleration(function(err, xyz) {
        // Failed to get initial acceleration state
        if (err) return reject(err);

        console.log('[ACCEL] initialized ('+xyz.map(function(ax){return ax.toFixed(1)}).join(',')+')');
        resolve(updateAccel(xyz));
      });
    });

  }));
};
