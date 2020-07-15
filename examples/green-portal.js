const { commands, init, send } = require('../');

init((err, portal) => {
  if (err) {
    console.error(err);
    return;
  }

  send(commands.color(0, 255, 0), portal);
});
