console.log('inital ram free',require('os').freemem());

var Tessel = require('tessel');


// Enable ES6 promises
require('es6-promise').polyfill();

// Promise-based delay helper
function wait(delay) {
	return (new Promise(function(resolve) {
		setTimeout(resolve, delay||0);
	}));
}



var main = function() {
	var snake = require('./snake-run.js');
	var mods = [];

	console.log('Starting tessel-snake...');

	// Load Tessel-OLED display module
	mods.push(

		// Initialize
		require('./snake-display-tessel-oled.js').init()

		// Push module as an output
		.then(function(display) {
			// This is a render module
			if (typeof display === 'function') {
				snake.setDisplay(display);
				console.log('[snake-display-tessel-oled] READY');
			} else {
				console.log('Display-module failed to init:', display);
			}
		})
	);

	// Load Tessel-Accelerometer input-module
	mods.push(
		require('./snake-input-tessel-accel.js').init()

		.then(function(input) {
			// This is a render module
			if (typeof input === 'function') {
				snake.setInput(input);
				console.log('[snake-input-tessel-accel] READY');
			} else {
				console.log('Input-module failed to init:', input);
			}
		})
	);

	// Aaaand LIFTOFF! - when all modules initialized, fire up the game!
	Promise.all(mods)
		.then(function() {
			console.log('ram free after init',require('os').freemem());
			snake.start();

		// Failed to init
		}).catch(function (e) {
			console.log('Snake init failed: '+ e.toString());
		});
}

main();
