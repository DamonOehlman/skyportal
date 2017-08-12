const skyportal = require('../');
const commands = skyportal.commands;

skyportal.init().then(portal => portal.write(commands.color(0, 255, 0)));
