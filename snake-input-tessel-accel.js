// Load snake lib/commons/helpers
var S = require('./snake-lib.js');

// To change default map size, use
// > require('./snake-lib.js').resizeMap(<width>, <height>)
// to load the snake lib.

// Index helper
var idxAt = S.idxAt,

  // Turn helper
  turnTo = S.turnTo;


// Tessel lib
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
  ACCEL = require('accel-mma84').use(Tessel.port['C']);

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
        updateAccel(xyz);
        resolve(exports);
      });
    });

  }));
};

exports.axes = function() {
  return lastData;
}

exports.currentDir = function () {

}

var DZ = 0.15;
exports.input = function (Map, w,h, headIdx,tailIdx) {
  var dir = Map[headIdx];

  // Go UP
  // Headed left/right, accel is negative on Y axis
  if (lastData[1]>DZ) {
    dir = (Map[headIdx]&(S.DPAD.LEFT|S.DPAD.RIGHT)) ? S.DPAD.UP : dir;

  // Go DOWN
  } else if (lastData[1]<-DZ) {
    dir = (Map[headIdx]&(S.DPAD.LEFT|S.DPAD.RIGHT)) ? S.DPAD.DOWN : dir;

  }

  // Go LEFT
  // Headed up/down, accel is negative on X axis
  if (lastData[0]<-DZ) {
    dir = (Map[headIdx]&(S.DPAD.UP|S.DPAD.DOWN)) ? S.DPAD.LEFT : dir;

  // Go RIGHT
  } else if (lastData[0]>DZ) {
    dir = (Map[headIdx]&(S.DPAD.UP|S.DPAD.DOWN)) ? S.DPAD.RIGHT : dir;

  }

  Map[headIdx] = dir;
}
