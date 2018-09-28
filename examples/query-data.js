const skyportal = require('../');
const async = require('async');
const times = require('whisk/times');
const commands = skyportal.commands;

skyportal.init().then(portal => {
  const promises = times(64).map(blockIndex => {
    return portal
      .write(commands.query(0x01, blockIndex))
      .then(() => portal.read());
  });

  Promise.all(promises).then(results => {
    console.log(results);
  });
});
