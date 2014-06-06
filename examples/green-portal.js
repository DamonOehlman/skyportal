var skyportal = require('../');
var commands = skyportal.commands;

skyportal.init(function(err, portal) {
  skyportal.send(commands.color(0, 255, 0), portal);
});
