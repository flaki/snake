console.log('inital ram free',require('os').freemem());

var Tessel = require('tessel');


// Enable ES6 promises
require('es6-promise').polyfill();;

// Promise-based delay helper
function wait(delay) {
	return (new Promise(function(resolve) {
		setTimeout(resolve, delay||0);
	}));
}

var Main = function() {
	var snake = require('./snake-run.js');

	console.log('Starting tessel-snake...');

	// Load OLED Display module-
	require('./snake-display-tessel-oled.js')

		// Initialize
		.init()

		// Push module as an output
		.then(function(renderer) {
			// This is a render module
			if (typeof renderer === 'function') {
				snake.setDisplay(renderer);
			}

		// Aaaand LIFTOFF!
		}).then(function(renderer) {
			console.log('ram free after init',require('os').freemem());
			snake.start();

		// Failed to init
		}).catch(function (e) {
			console.log('Snake init failed: '+ e.toString());
		});
}

Main();
