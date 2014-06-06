var skyportal = require('../');
var commands = skyportal.commands;
var async = require('async');

skyportal.init(function(err, portal) {

  function query(blockIdx, callback) {
    skyportal.send(commands.query(0x01, blockIdx), portal, function(err) {
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
          if (lastResponse[1] === 0x01) {
            err = new Error('Portal refused to provide query information');
          }

          callback(err, lastResponse);
        }
      );
    });
  }

//   skyportal.send(commands.status(), portal, function(err) {
//     skyportal.read(portal, function(err, bytes) {
//     });
//   });

  async.timesSeries(64, query);
});
