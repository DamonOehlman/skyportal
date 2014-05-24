var skyportal = require('../');
var commands = skyportal.commands;
var async = require('async');

skyportal.open(skyportal.find(), function(err, portal) {
  skyportal.send(commands.query(0x10, 1), portal, function(err, bytes) {
    var lastResponse = [];

    if (err) {
      return;
    }

    async.until(
      function() {
        return lastResponse[0] === 0x51;
      },

      function(callback) {
        skyportal.read(portal, function(err, bytes) {
          lastResponse = bytes || [];
          callback(err);
        });
      },

      function(err) {
        console.log(err, lastResponse);
      }
    );
  });
});
