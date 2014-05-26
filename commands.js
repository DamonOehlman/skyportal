/* jshint node: true */
'use strict';

/**
  ## Commands

  These are command generators for commands supported on the device.

**/

/**
  ### activate

  The activate command is sent to the device after a reset.

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

  ```
  [0x43, 0xRR, 0xGG, 0xBB]
  ```

**/
exports.color = function(r, g, b) {
  return [0x43].concat(Array.isArray(r) ? r : [].slice.call(arguments));
};


/**
  ### query(tagIdx, blockIdx)

  Query a tag that is currently on the portal.  Data is returned in blocks,
  so use the `blockIdx` to target a specific block of data.

  ```
  [0x51, 0x20 + tagIdx, blockIdx]
**/
exports.query = function(tagIdx, blockIdx) {
  return [0x51, (blockIdx ? 0x10 : 0x20) + tagIdx, blockIdx];
};

/**
  ### reset

  Reset the device ready for use.

  ```
  [0x52]
  ```
**/
exports.reset = function() {
  return [0x52];
};

exports.status = function() {
  return [0x53];
};
