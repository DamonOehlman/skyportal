const skyportal = require('../');
const commands = skyportal.commands;
const async = require('async');

skyportal.init((initErr, portal) => {
  if (initErr) {
    console.error(initErr);
    return;
  }

  async.timesSeries(64, query);

  function query(blockIdx, callback) {
    skyportal.send(commands.query(0x01, blockIdx), portal, sendErr => {
      let lastResponse = [];
      if (sendErr) {
        console.error(err);
        return;
      }

      async.until(
        () => lastResponse[0] === 0x51,
        function (callback) {
          skyportal.read(portal, (readErr, bytes) => {
            lastResponse = bytes || [];
            callback(readErr);
          });
        },

        function (err) {
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

});
