const commands = require('./commands');
const debug = require('debug')('skyportal');
const usb = require('usb');
const platform = require('os').platform();
const platformUtils = require(`./lib/${platform}`);
const config = require('./config');
const SkyPortal = require('./portal');

/**
  # skyportal

  This is a top-level interface to an rfid reader and writer that happens
  to double as a very nice glowy thing.  The library itself have been written
  to support multiple skyportals on the one machine allowing you do so
  some pretty neat things when you have a few usb ports spare :)

  ## Usage

  This module does just the bare bones required to communicate with the
  device, but does make interfacing with a skyportal pretty accessible.  The
  follow example demonstrates opening a portal and setting it's color to
  green.

  <<< examples/green-portal.js

  __NOTE:__ Running the examples (at least on my machine required root user
  privileges to open the device, so you may need to `sudo` the examples).

  ## Compatibility

  At this stage this has only been tested with the USB version of the portal
  (Xbox 360) on Linux.  It has been coded in such a way that compatibility
  with other portal models is quite easy to implement, so feel to send
  through a pull request :)

  You may need to apply some system updates to get it working though, see the
  following url for more info:

  https://bitbucket.org/DamonOehlman/skyportal/src/HEAD/system/

  ## Reference

  ### skyportal.find(index == 0)

  Look for a skyportal within the current usb devices.

**/
function find(index) {
  // get the portal
  const device = usb.getDeviceList().filter(config.isPortal)[index || 0];
  if (!device) {
    return;
  }

  // find the product index so we can patch in the appropriate command prefix
  const productIndex = config.productList.indexOf(device.deviceDescriptor.idProduct);
  debug(`found device; product index = ${productIndex}`);
  return {
    device,
    productIndex
  };
}

/**
  ### skyportal.init(opts?) => !Promise<SkyPortal>

  The `init` function of the skyportal module is best way to get yourself a
  correctly open initialized portal.  In short, you should pretty much
  always use it.

**/
function init(opts) {
  const targetIndex = (opts || {}).index || 0;
  const initCommands = [
    commands.reset,
    commands.activate
  ];

  return open(find(targetIndex))
    .then(portal => {
      return initCommands.reduce((memo, command) => {
        return memo.then(() => portal.write(command));
      }, Promise.resolve()).then(() => portal);
    });
}

/**
  ### skyportal.open(portal) => Promise<Portal>

  Open the portal using the portal data that has been retrieved
  from a find operation.

**/
function open({ device, productIndex }) {
  return platformUtils.openDevice(device)
    .then(device => {
      debug('opened device successfully');
      const di = device.interface(0);
      debug('interface 0 bound');

      debug('checking kernel driver state');
      let detachedKernelDriver = false;
      if (di.isKernelDriverActive()) {
        debug('kernel drive active, detaching and will reattach on close of this process');
        di.detachKernelDriver();
        detachedKernelDriver = true;
      }

      di.claim();
      debug('successfully claimed device');
      const portal = SkyPortal.of({
        di,
        input: di.endpoint(config.inpoints[productIndex] || 0x81),
        output: di.endpoint(config.outpoints[productIndex] || 0x02),
        detachedKernelDriver,
        productIndex
      });

      debug('portal instance created, performing input and output checks');
      portal.checkInput();
      portal.checkOutput();
      debug('input and output ports of configured');

      return portal
        .write(commands.reset())
        .then(portal => portal.write(commands.activate()));
    });
}

function sendRaw(bytes, portal, callback) {
  if (!portal || !portal.o) {
    return callback && callback(new Error('no portal output attached'));
  }

  // TODO: handle bytes being provided in another format
  var payload = portal.commandPrefix.concat(bytes || []);
  var data = new Buffer(payload.concat(REQUEST_PADDING.slice(payload.length)));

  // send the data
  debug('--> ', data.length, data);
  portal.o.transfer(data, callback);
};

module.exports = {
  commands,
  find,
  init,
  open,
  sendRaw,
  SkyPortal
};
