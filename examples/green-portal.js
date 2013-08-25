var skyportal = require('../');
var commands = skyportal.commands;

skyportal.open(skyportal.find(), function(err, portal) {
  skyportal.send(commands.color(0, 0, 0), portal);
});