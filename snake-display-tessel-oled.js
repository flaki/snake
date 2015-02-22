var Tessel = require('tessel');


// Enable ES6 promises
require('es6-promise').polyfill();


// Promise-based delay helper
function wait(delay) {
	return (new Promise(function(resolve) {
		setTimeout(resolve, delay||0);
	}));
}



var Display = (function() {
	var HW;
	var UART;

	var BR_HIGHSPEED = 57600;

	var ready;

	var LOGO = {
		// TESSEL logo - 50x50 px
		TESSEL: [
			0x00,0x00,0x00,0x00,0x00,0x00,0x3f,
			0x00,0x00,0x00,0x00,0x00,0x00,0x3f,
			0x00,0x00,0x01,0xc0,0x00,0x00,0x3f,
			0x00,0x00,0x03,0x60,0x00,0x00,0x3f,
			0x00,0x00,0x03,0x60,0x00,0x00,0x3f,
			0x00,0x00,0x07,0xc0,0x00,0x00,0x3f,
			0x00,0x00,0x1c,0x00,0x00,0x00,0x3f,
			0x00,0x00,0x70,0x00,0x00,0x00,0x3f,
			0x00,0x00,0xc0,0x01,0xc0,0x00,0x3f,
			0x00,0x03,0x80,0x00,0x60,0x00,0x3f,
			0x00,0x0e,0x00,0x00,0x38,0x00,0x3f,
			0x00,0x18,0x00,0x00,0x0e,0x00,0x3f,
			0x00,0x70,0x00,0x00,0x03,0x00,0x3f,
			0x01,0xc0,0x00,0x00,0x01,0xc0,0x3f,
			0x03,0x00,0x00,0x00,0x00,0x70,0x3f,
			0x06,0x00,0x00,0x00,0x00,0x30,0x3f,
			0x06,0x00,0x00,0x00,0x00,0x10,0x3f,
			0x06,0x00,0x00,0x00,0x00,0x10,0x3f,
			0x06,0x00,0x00,0x00,0x00,0x10,0x3f,
			0x06,0x01,0xff,0x7f,0xc0,0x10,0x3f,
			0x06,0x01,0xff,0x7f,0xc0,0x10,0x3f,
			0x06,0x01,0xff,0x7f,0xc0,0x10,0x3f,
			0x06,0x01,0xff,0x7f,0xc0,0x10,0x3f,
			0x06,0x00,0x07,0x70,0x00,0x10,0x3f,
			0x06,0x00,0x07,0x70,0x00,0x10,0x3f,
			0x06,0x00,0x07,0x70,0x00,0x10,0x3f,
			0x04,0x00,0x07,0x70,0x00,0x10,0x3f,
			0x00,0x00,0x07,0x70,0x00,0x10,0x3f,
			0x00,0x00,0x07,0x70,0x00,0x10,0x3f,
			0x00,0x00,0x07,0x70,0x00,0x10,0x3f,
			0x00,0x00,0x07,0x70,0x00,0x10,0x3f,
			0x00,0x00,0x07,0x70,0x00,0x10,0x3f,
			0x00,0x00,0x07,0x70,0x00,0x10,0x3f,
			0x00,0x00,0x07,0x70,0x00,0x10,0x3f,
			0x00,0x00,0x07,0x70,0x00,0x10,0x3f,
			0x0f,0x00,0x00,0x00,0x00,0x78,0x3f,
			0x09,0x00,0x00,0x00,0x00,0x6c,0x3f,
			0x09,0x80,0x00,0x00,0x00,0x6c,0x3f,
			0x0f,0xc0,0x00,0x00,0x00,0x38,0x3f,
			0x00,0x70,0x00,0x00,0x00,0x00,0x3f,
			0x00,0x1c,0x00,0x00,0x00,0x00,0x3f,
			0x00,0x06,0x00,0x00,0x30,0x00,0x3f,
			0x00,0x03,0x80,0x00,0xe0,0x00,0x3f,
			0x00,0x00,0xe0,0x01,0x80,0x00,0x3f,
			0x00,0x00,0x30,0x07,0x00,0x00,0x3f,
			0x00,0x00,0x1c,0x1c,0x00,0x00,0x3f,
			0x00,0x00,0x07,0x70,0x00,0x00,0x3f,
			0x00,0x00,0x01,0xc0,0x00,0x00,0x3f,
			0x00,0x00,0x00,0x00,0x00,0x00,0x3f,
			0x00,0x00,0x00,0x00,0x00,0x00,0x3f
		],

		// Twitter logo - 40x40 px
		TWITTER: [
			0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x7e,0x00,
			0x40,0x00,0x01,0xff,0x06,
			0x70,0x00,0x03,0xff,0xfc,
			0x78,0x00,0x07,0xff,0xf8,
			0x7c,0x00,0x07,0xff,0xf2,
			0x7e,0x00,0x0f,0xff,0xfe,
			0x3f,0x80,0x0f,0xff,0xfc,
			0x3f,0xc0,0x0f,0xff,0xf8,
			0x3f,0xf8,0x0f,0xff,0xf0,
			0x1f,0xff,0x0f,0xff,0xf0,
			0x1f,0xff,0xff,0xff,0xf0,
			0x4f,0xff,0xff,0xff,0xf0,
			0x7f,0xff,0xff,0xff,0xf0,
			0x3f,0xff,0xff,0xff,0xe0,
			0x3f,0xff,0xff,0xff,0xe0,
			0x1f,0xff,0xff,0xff,0xe0,
			0x1f,0xff,0xff,0xff,0xe0,
			0x0f,0xff,0xff,0xff,0xc0,
			0x07,0xff,0xff,0xff,0xc0,
			0x01,0xff,0xff,0xff,0x80,
			0x07,0xff,0xff,0xff,0x80,
			0x07,0xff,0xff,0xff,0x00,
			0x03,0xff,0xff,0xff,0x00,
			0x00,0xff,0xff,0xfe,0x00,
			0x00,0x7f,0xff,0xfc,0x00,
			0x00,0x1f,0xff,0xf8,0x00,
			0x00,0x3f,0xff,0xf0,0x00,
			0x00,0xff,0xff,0xe0,0x00,
			0x7f,0xff,0xff,0x80,0x00,
			0x3f,0xff,0xfe,0x00,0x00,
			0x0f,0xff,0xf8,0x00,0x00,
			0x00,0xff,0xc0,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00
		],

		// Firefox OS logo - full 128x64 px
		FIREFOXOS: [
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xf1,0xff,0xff,0xff,0xf0,0x3f,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xfc,0x00,0x20,0xff,0xff,0xff,0xe0,0x1f,0xff,0xff,0xff,0xff,0x03,0xff,0x80,0xff,
			0xfc,0x00,0x20,0xff,0xff,0xff,0xc1,0x3f,0xff,0xff,0xff,0xfc,0x00,0xfe,0x00,0x3f,
			0xfc,0x00,0x71,0xff,0xff,0xff,0xc3,0xff,0xff,0xff,0xff,0xf8,0x78,0x7c,0x3e,0x3f,
			0xfc,0x3f,0xff,0xff,0xff,0xff,0xc3,0xff,0xff,0xff,0xff,0xf1,0xfe,0x38,0xff,0xff,
			0xfc,0x3f,0xff,0xff,0xff,0xff,0xc3,0xff,0xff,0xff,0xff,0xf3,0xfe,0x38,0xff,0xff,
			0xfc,0x3f,0xf9,0xe7,0x1e,0x0f,0xc3,0xf8,0x1f,0xff,0xff,0xe3,0xff,0x18,0xff,0xff,
			0xfc,0x3f,0xe1,0xc2,0x18,0x07,0x80,0x30,0x0f,0x0f,0x0f,0xe3,0xff,0x18,0xff,0xff,
			0xfc,0x3f,0xe1,0xc0,0x30,0x03,0x80,0x60,0x07,0x07,0x0f,0xe3,0xff,0x18,0x7f,0xff,
			0xfc,0x3f,0xe1,0xc0,0x30,0xe1,0xc3,0xc3,0xc3,0x86,0x1f,0xe3,0xff,0x1c,0x1f,0xff,
			0xfc,0x00,0xe1,0xc1,0xe1,0xf1,0xc3,0xc3,0xc3,0xc2,0x3f,0xe3,0xff,0x1e,0x03,0xff,
			0xfc,0x00,0xe1,0xc3,0xe1,0xf0,0xc3,0xc7,0xe1,0xc0,0x3f,0xe3,0xff,0x1f,0x00,0xff,
			0xfc,0x00,0xe1,0xc3,0xc3,0xf0,0xc3,0x87,0xe1,0xe0,0x7f,0xe3,0xff,0x1f,0xe0,0x7f,
			0xfc,0x3f,0xe1,0xc3,0xc0,0x00,0xc3,0x87,0xe1,0xf0,0xff,0xe3,0xff,0x1f,0xfc,0x3f,
			0xfc,0x3f,0xe1,0xc3,0xc0,0x00,0xc3,0x87,0xe1,0xf0,0xff,0xe3,0xff,0x1f,0xfe,0x3f,
			0xfc,0x3f,0xe1,0xc3,0xc0,0x00,0xc3,0x87,0xe1,0xe0,0x7f,0xe3,0xff,0x1f,0xff,0x1f,
			0xfc,0x3f,0xe1,0xc3,0xc3,0xff,0xc3,0x87,0xe1,0xc0,0x3f,0xe3,0xff,0x1f,0xff,0x1f,
			0xfc,0x3f,0xe1,0xc3,0xc1,0xff,0xc3,0x87,0xe1,0xc0,0x3f,0xf3,0xff,0x3f,0xff,0x1f,
			0xfc,0x3f,0xe1,0xc3,0xe1,0xff,0xc3,0xc3,0xc3,0x80,0x1f,0xf1,0xfe,0x3f,0xfe,0x3f,
			0xfc,0x3f,0xe1,0xc3,0xe0,0xf9,0xc3,0xc3,0xc3,0x06,0x0f,0xf8,0xfc,0x79,0xfc,0x3f,
			0xfc,0x3f,0xe1,0xc3,0xf0,0x01,0xc3,0xe0,0x07,0x0f,0x0f,0xfc,0x00,0xf8,0x00,0x7f,
			0xfc,0x3f,0xe1,0xc3,0xf8,0x01,0xc3,0xf0,0x0e,0x1f,0x87,0xfe,0x01,0xfc,0x00,0xff,
			0xfc,0x3f,0xe1,0xc3,0xfe,0x07,0xc3,0xf8,0x1e,0x1f,0xc7,0xff,0x87,0xff,0x03,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
			0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff
		],

		// POSSIBLE logo - full 128x64 px
		POSSIBLE: [
			/* 20px padding on top */
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,

			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,

			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,

			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,

			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,

			/* 25px POSSIBLE logo bitmap data */
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x0f,0xfc,0x00,0x3e,0x00,0x1f,0x80,0x3f,0x03,0xe3,0xff,0x81,0xf0,0x07,0xff,0xe0,
			0x0f,0xff,0x01,0xff,0xc0,0x7f,0xe0,0xff,0xc3,0xe3,0xff,0xe1,0xf0,0x07,0xff,0xe0,
			0x0f,0xff,0x83,0xff,0xe0,0xff,0xf1,0xff,0xe3,0xe3,0xff,0xf1,0xf0,0x07,0xff,0xe0,
			0x0f,0xff,0xc7,0xff,0xf1,0xff,0xe3,0xff,0xc3,0xe3,0xff,0xf1,0xf0,0x07,0xff,0xe0,
			0x0f,0x87,0xcf,0xe3,0xf1,0xf0,0xe3,0xe1,0xc3,0xe3,0xe1,0xf1,0xf0,0x07,0xc0,0x00,
			0x0f,0x83,0xcf,0x80,0xf9,0xf0,0x03,0xe0,0x03,0xe3,0xe0,0xf1,0xf0,0x07,0xc0,0x00,
			0x0f,0x83,0xcf,0x80,0xf9,0xfc,0x03,0xf8,0x03,0xe3,0xe1,0xf1,0xf0,0x07,0xc0,0x00,
			0x0f,0x87,0xcf,0x00,0x79,0xff,0x83,0xff,0x03,0xe3,0xff,0xe1,0xf0,0x07,0xff,0xc0,
			0x0f,0x8f,0xcf,0x00,0x78,0xff,0xe1,0xff,0xc3,0xe3,0xff,0xc1,0xf0,0x07,0xff,0xc0,
			0x0f,0xff,0x8f,0x00,0x78,0x7f,0xf0,0xff,0xe3,0xe3,0xff,0xf1,0xf0,0x07,0xff,0xc0,
			0x0f,0xff,0x0f,0x80,0xf8,0x07,0xf0,0x0f,0xe3,0xe3,0xe0,0xf9,0xf0,0x07,0xc0,0x00,
			0x0f,0xfe,0x0f,0x80,0xf8,0x01,0xf8,0x03,0xf3,0xe3,0xe0,0xf9,0xf0,0x07,0xc0,0x00,
			0x0f,0xf0,0x07,0xc1,0xf0,0xe0,0xf9,0xc1,0xf3,0xe3,0xe0,0xf9,0xf0,0x07,0xc0,0x00,
			0x0f,0x80,0x07,0xff,0xf1,0xff,0xf3,0xff,0xe3,0xe3,0xff,0xf9,0xff,0xe7,0xff,0xe0,
			0x0f,0x80,0x03,0xff,0xe3,0xff,0xf7,0xff,0xe3,0xe3,0xff,0xf9,0xff,0xe7,0xff,0xe0,
			0x0f,0x80,0x01,0xff,0xc1,0xff,0xe3,0xff,0xc3,0xe3,0xff,0xf1,0xff,0xe7,0xff,0xe0,
			0x0f,0x80,0x00,0x7f,0x00,0x3f,0x80,0x7f,0x03,0xe3,0xff,0xe1,0xff,0xe7,0xff,0xe0,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,

			/* 19px padding on bottom */
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,

			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,

			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,

			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,

			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
			0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00
		]
	};

	var FONT = {
		'tiny': 6,
		'small': 10,
		'regular': 18,
		'medium': 51,
		'large': 120,
		'x-large': 123,

		'default': 0,

		'custom1': 200,
		'custom2': 201,
		'custom3': 202,
		'custom4': 203
	};

	// Instant/throttled write to display UART
	var writeprogress = Promise.resolve();
	function write(data, bps) {
		var buffer;

		// No data, just return promise
		if (!data) return writeprogress;

		// Write
		return (writeprogress = writeprogress.then(function() {
			if (typeof data === 'string') {
				buffer = new Buffer(data, 'ascii');
			} else {
				buffer = data;
			}

			if (bps) {
				return new Promise(function(resolve,reject) {
					var delay = 50,
						chunk = Math.floor(bps/(1000/delay)),
						cbuff = new Buffer(chunk),
						idx = 0,
						iv;

					iv = setInterval(function() {
						buffer.copy(cbuff,0,idx);

						// Write whole chunks
						if (idx+chunk < buffer.length) {
							UART.write(cbuff,0,idx);

							idx += chunk;
							console.log(idx+'/'+buffer.length+' bytes...');

						// Write last chunk
						} else {
							UART.write(cbuff.slice(0,buffer.length-idx));

							console.log('last '+(buffer.length-idx)+' byte(s) written and done');

							// Finished
							clearInterval(iv);
							resolve();
						}
					},delay);
				});

			} else {
				UART.write(buffer);
				//console.log(buffer.length+' bytes written in one shot');
			}
		}));
	}



	DigoleDisplay = function(options) {
		HW = options.port || require('tessel').port['D'];

		UART = new HW.UART({
			baudrate: 9600
		});

		// Clear
		write('CL\0');
		console.log('[OLED] screen cleared');

		// Upgrade to high-speed uart
		if (options.highSpeed) {
			ready = new Promise(function (resolve, reject) {
				// Request baudrate upgrade
				setTimeout(function () {
					console.log('[OLED] requested UART high-speed baudrate: '+BR_HIGHSPEED);
					write('SB'+BR_HIGHSPEED+'\0');

					// Upgrade baudrate on UART connection
					setTimeout(function () {
						console.log('[OLED] upgraded UART baudrate: '+BR_HIGHSPEED);
						UART.setBaudRate(BR_HIGHSPEED);

						setTimeout(resolve, 0);
					}, 200);
				}, 0);
			});

		} else {
			ready = new Promise(function (resolve, reject) {
				setTimeout(resolve, 0);
			});
		}
	};

	DigoleDisplay.prototype.write = function(data, bps) {
		write(data);
	};

	DigoleDisplay.prototype.ready = function() {
		return ready;
	};

	DigoleDisplay.prototype.clear = function() {
		write('CL\0');
	};
	DigoleDisplay.prototype.config = function(set) {
		write('DC'+(set?'1':'0')+'\0');
	};
	DigoleDisplay.prototype.cursor = function(set) {
		write('CS'+(set?'1':'0')+'\0');
	};
	DigoleDisplay.prototype.power = function(set) {
		write('SOO'+(set?'\x01':'\x00')+'');
	};

	DigoleDisplay.prototype.setMode = function(m) {
		write('SM'+m+'\0');
	};

	DigoleDisplay.prototype.startup = function(set) {
		write('DSS'+(set?'1':'0')+'\0');
	};
	DigoleDisplay.prototype.displayStartup = function() {
		write('DSS\x01\0');
	};

	DigoleDisplay.prototype.text = function(text,size,x,y,center) {
		var buf, i;

		// Not buffered, create fallback buffer
		buf = (buffered ? dBuf.slice(dBufP) : new Buffer(128));
		i = 0;

		// Enforce text to be a string
		if (typeof text !== 'string') {
			text = ""+text;
		}

		// If no size specified, use default
		if (typeof size !== 'string') {
			if (!isNaN(size) && !isNaN(x) && isNaN(y)) {
				y = x;
				x = size;
			}

			size = void 0;
		}

		// Font select
		if (size && size in FONT) {
			buf[i++] = 'S'.charCodeAt();
			buf[i++] = 'F'.charCodeAt();
			buf[i++] = FONT[size];
			//buf[i++] = 0; //might not be neccessary
		}

		// TODO: make font size selection smarter, cache last used font size
		// especially in buffered mode.

		// Positioning
		if (!isNaN(x) && !isNaN(y)) {
			// Try to center text
			if (center) {
				if (size === 'tiny') {
					x -= Math.floor(text.length / 2 * 4);
					y -= 3; // TODO: account for newlines, maybe?

				} else if (size === 'small') {
					x -= Math.floor(text.length / 2 * 6);
					y -= 5;

				} else if (size === 'regular') {
					x -= Math.floor(text.length / 2 * 8);
					y -= 6;
				}
			}

			buf[i++] = 'E'.charCodeAt();
			buf[i++] = 'T'.charCodeAt();
			buf[i++] = 'P'.charCodeAt();

			buf[i++] = x;
			buf[i++] = y;

			//buf[i++] = 0; //might not be neccessary, either
		}

		// Text
		buf[i++] = 'T'.charCodeAt();
		buf[i++] = 'T'.charCodeAt();

		i += buf.write(text, i);

		buf[i++] = 0; // neccessary to mark the end of string data


		// Buffered: update buffers content size
		if (buffered) {
			dBufP += i;

		// No buffering: Direct write into display output
		} else {
			write(buf.slice(0,i));
		}
	};

	DigoleDisplay.prototype.updateStartup = function(DATA, width, translate) {
		var buf;
		var i, j, k, b, bpr;

		//DEBUG//DATA=[0xff,0x00,0xff,0x01,0x01,0xf0,0xf0,0xff]; translate=false;

		// Target screen width - default: 128px
		width = width || 128;
		// Bytes per row
		bpr = width >> 3;

		// Translate image data (byte-column format) - default: yes
		translate = typeof translate === 'undefined' ? true : translate;

		function tc(x,y) {
			return (DATA[ ((y*width + x)>>3) ]>>(7-x%8)) &1;
		}

		buf = new Buffer(1024+1);

		if (translate) console.log('Translating startup screen...');

		write('SSS\x00\x04');

		i = 0;
		while (i < 1024) {
			for (j = 0; j < width; j++) {

				if (translate) {
					b = 0;
					for (k = 0; k < 8; ++k) {
						b = b | ( i + j + k*bpr < DATA.length ? tc(j, 8 * (i/width) + k)<<(7-k) : 0);
						//if (i===512 && j<16) console.log('i:',i,' j/x:',j,' y:',(8*(i/width)+k),' k:',k,' idx:',i + j + k*bpr,' D:',DATA[ (((8*(i/width)+k)*width + j)>>3) ],' T:',tc(j, 8 * (i/width) + k)<<(7-k),' b:',b);
					}
				} else {
					b = i + j < DATA.length ? DATA[i+j] : 0;
				}
				buf.writeUInt8(b, i+j);
			}

			i += width;
		}

		// Write startup image data
		console.log('Uploading startup screen...');
		write(buf, 320);

		// hide configuration
		OLED.config(false);

		// show background image
		OLED.startup(true);

		return write();
	};

	DigoleDisplay.prototype.logo = function (label) {
		return LOGO[label];
	};
	DigoleDisplay.prototype.displayLogo = function (logo, x,y, center) {
		var DATA = LOGO[logo.label];

		var buf = new Buffer(3+4+DATA.length+1);

		var i = 0;

		buf.writeUInt8('D'.charCodeAt(), i++);
		buf.writeUInt8('I'.charCodeAt(), i++);
		buf.writeUInt8('M'.charCodeAt(), i++);

		buf.writeUInt8(x - ( center ? 25 : 0 ), i++);
		buf.writeUInt8(y - ( center ? 25 : 0 ), i++);

		buf.writeUInt8(logo.w, i++);
		buf.writeUInt8(logo.h, i++);

		for (j=0 ; j < DATA.length; j++) {
			buf.writeUInt8(DATA[j], i++);
		}

		write(buf);
	};

	var buffered = false,
		dBuf = new Buffer(1024),
		dBufP;

	DigoleDisplay.prototype.buffer = function(x, y, width, height) {
		dBufP = 0;
		buffered = true;
	}
	DigoleDisplay.prototype.showBuffer = function() {
		UART.write(dBuf.slice(0,dBufP));
		buffered = false;
	}

	// API-compatible with canvas commands
	var DRAW_MODE_FILL = 1,
		DRAW_MODE_CLEAR = 2;
	DigoleDisplay.prototype.fillRect = function(x, y, width, height) {
		DigoleDisplay.prototype.drawRect(x, y, width, height, DRAW_MODE_FILL);
	}
	DigoleDisplay.prototype.clearRect = function(x, y, width, height) {
		DigoleDisplay.prototype.drawRect(x, y, width, height, DRAW_MODE_CLEAR);
	}

	DigoleDisplay.prototype.drawRect = function(x, y, width, height, mode) {
		var buf, i;

		// Not buffered, create fallback buffer
		buf = (buffered ? dBuf.slice(dBufP) : new Buffer(32));
		i = 0;

		// Set clear mode color
		if (mode === DRAW_MODE_CLEAR) {
			// Set to erase (black color)
			buf.writeUInt8('S'.charCodeAt(), i++);
			buf.writeUInt8('C'.charCodeAt(), i++);
			buf.writeUInt8(0, i++);

			// TODO: make this smarter - if call is buffered, check buffer for
			// color-reset, and overwrite it with current clear command to avoid
			// unneccessary context-switching
		}

		// Must be at least 1x1 px to show
		if (width > 1 && height > 1) {
			// Drawing mode
			buf.writeUInt8((mode === DRAW_MODE_FILL || mode === DRAW_MODE_CLEAR ? 'F' : 'D').charCodeAt(), i++);
			buf.writeUInt8('R'.charCodeAt(), i++);

			buf.writeUInt8(x, i++);
			buf.writeUInt8(y, i++);

			// API uses bottom-right coords
			buf.writeUInt8(x + width - 1, i++);
			buf.writeUInt8(y + height - 1, i++);

		// 1px width/height must be special-cased
		} else if ((width > 0 && height > 0)) {

			// Draw a single pixel (width === height = 1)
			if (height === width) {
				buf.writeUInt8('D'.charCodeAt(), i++);
				buf.writeUInt8('P'.charCodeAt(), i++);

				buf.writeUInt8(x, i++);
				buf.writeUInt8(y, i++);

			// Draw horizontal/vertical line
			} else {
				buf.writeUInt8('L'.charCodeAt(), i++);
				buf.writeUInt8('N'.charCodeAt(), i++);

				buf.writeUInt8(x, i++);
				buf.writeUInt8(y, i++);

				// API uses x2,y2 coords
				buf.writeUInt8(x + width - 1, i++);
				buf.writeUInt8(y + height - 1, i++);
			}
		}

		// Reset clear mode color
		if (mode === DRAW_MODE_CLEAR) {
			// Set to erase (black color)
			buf.writeUInt8('S'.charCodeAt(), i++);
			buf.writeUInt8('C'.charCodeAt(), i++);
			buf.writeUInt8(1, i++);
		}

		// Buffered: update buffers content size
		if (buffered) {
			dBufP+=i;

		// No buffering: Direct write into display output
		} else {
			write(buf.slice(0,i));
		}
	}

	// API-compatible with canvas commands
	DigoleDisplay.prototype.oldClearRect = function(x, y, width, height) {
		var buf = new Buffer(3+2+4+3);
		var i = 0;

		// Set to erase (black color)
		buf.writeUInt8('S'.charCodeAt(), i++);
		buf.writeUInt8('C'.charCodeAt(), i++);
		buf.writeUInt8(0, i++);

		// Clear area
		buf.writeUInt8('F'.charCodeAt(), i++);
		buf.writeUInt8('R'.charCodeAt(), i++);

		buf.writeUInt8(x, i++);
		buf.writeUInt8(y, i++);

		// API uses bottom-right coords
		buf.writeUInt8(x + width - 1, i++);
		buf.writeUInt8(y + height - 1, i++);

		// Reset to draw (white color)
		buf.writeUInt8('S'.charCodeAt(), i++);
		buf.writeUInt8('C'.charCodeAt(), i++);
		buf.writeUInt8(1, i++);

		UART.write(buf);
	}


	DigoleDisplay.prototype.logoTessel = function (x,y, center) {
		return this.displayLogo({ label:'TESSEL', w:50, h:50 }, x,y, center);
	};
	DigoleDisplay.prototype.logoPOSSIBLE = function (x,y, center) {
		return this.displayLogo({ label:'POSSIBLE', w:128, h:64 }, x,y, center);
	};
	DigoleDisplay.prototype.logoFirefoxOS = function (x,y, center) {
		return this.displayLogo({ label:'FIREFOXOS', w:128, h:64 }, x,y, center);
	};



	return function(options) {
		return new DigoleDisplay(options);
	};
})();



// Display interface
var OLED;

exports.init = function() {

	// Fire up OLED hardware
	OLED = new Display({
		port: Tessel.port['D'],
		highSpeed: true
	});


	// Wait until connection to OLED display is established
	return OLED.ready()

		// Starting init/demo session
		.then(function() {
			console.log("[OLED] display starting up...");

		})

		// Show Tessel splash screen
		.then(function () {
			OLED.clear();

			OLED.text('powered by', 'tiny', 64,8, true);

			OLED.logoTessel(64, 38, true);

			console.log('[OLED] powered by Tessel');
			return wait(1000);

		// Show Author splash screen
		}).then(function () {
			OLED.clear();

			OLED.text('created by', 'tiny', 64,8, true);
			OLED.text('@slsoftworks','small', 64, 66, true);

			OLED.displayLogo({ label:'TWITTER', w: 40, h:40 }, 68, 36, true);

			console.log('[OLED] created by @slsoftworks');
			return wait(1000);

		// Renderer
		}).then(function () {
			OLED.clear();

			console.log('[OLED] initialized');
			return exports.update;

		// Failed to initialize
		}).catch(function (e) {
			console.log('Display module init failed: '+ e.toString());
		});

};


var BS = 5;
var BUFFERED = true;

exports.update1x1 = function(Map, w,h, headIdx,tailIdx) {
	// GUI
	OLED.text(headIdx, 'tiny', 100,8, false);



	// Draw game area
	Map.forEach(function(t, idx) {
		if (t) {
			OLED.drawRect(1 + (idx % w), 1 + (idx / w | 0) ,1,1);
		}
	});
};


var lastMem = process.memoryUsage().heapUsed;

exports.update = function(Map, w,h, headIdx,tailIdx) {
	// Buffer drawing commands in order to avoid display channel latency
	// which would result in screen flicker.
	if (BUFFERED) OLED.buffer();

	// Clear GUI/HUD
	OLED.clearRect(0,57, 128,7);

	// Memory profiling
	OLED.text('HEAP: +'+((process.memoryUsage().heapUsed-lastMem)/1024|0)+'K', 'tiny', 0,64, false);
	lastMem = process.memoryUsage().heapUsed;

	// GUI
	OLED.text('HEAD: ', 'tiny', 80,64, false);
	OLED.text(headIdx, 'tiny', 100,64, false);

	// Play area
	OLED.drawRect(0,0, BS*w + 2, BS*h + 2);
	OLED.clearRect(1,1, BS*w,BS*h);

	// Draw game area
	Map.forEach(function(t, idx) {
		if (t) {
			OLED.drawRect(1 + BS* (idx % w), 1 + BS* (idx / w | 0) ,BS-1||1, BS-1||1);
		}
	});

	// Display buffer
	if (BUFFERED) OLED.showBuffer();
};
