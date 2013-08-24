/* jshint node: true */
'use strict';

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
  ## Commands

**/

/**
  ### reset

  ```
  [0x52]
  ```
**/
exports.reset = function() {
  return [0x52];
};