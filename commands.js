/* jshint node: true */
'use strict';

/**
  ## Commands

  These are command generators for commands supported on the device.

**/

/**
  ### activate

  ```
  [0x41, 0x01]
  ```
**/
exports.activate = function() {
  return [0x41, 0x01];
};

/**
  ### color(r, g, b) 

  Update the color of the glowing thing by providing rgb values.  This
  function also supports providing a three element array as the first 
  argument for rgb.

**/
exports.color = function(r, g, b) {
  return [0x43].concat(Array.isArray(r) ? r : [].slice.call(arguments));
};

/**
  ### status()

  Ask for the status updates to start
**/
exports.status = function() {
  return [0x53];
};

/**
  ### reset

  ```
  [0x52]
  ```
**/
exports.reset = function() {
  return [0x52];
};