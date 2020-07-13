const commands = require('./commands');
const debug = require('debug')('skyportal');
const usb = require('usb');
const times = require('whisk/times');
const vendorList = [0x1430];
const productList = [
  0x1f17,  // usb wired (pc, xbox)
  0x0150   // wii wireless (also ps3?)
];

// initialise the command prefixes which matches index for index with
// the product list
const commandPrefixes = [
  [0x0B, 0x14],
  []
];

// initialise the input endpoints for the various product ids
const inpoints = [
  0x81
];
// initialise the output endpoints for the various product ids
const outpoints = [
  0x02
];

const RESPONSE_SIZE = 0x20;
const REQUEST_PADDING = times(RESPONSE_SIZE).map(function () {
  return 0;
});

const find = index => {
  // get the portal
  const device = usb.getDeviceList().filter(isPortal)[index || 0];
  if (!device) {
    return;
  }

  // find the product index so we can patch in the appropriate command prefix
  const productIdx = productList.indexOf(device.deviceDescriptor.idProduct);
  return {
    commandPrefix: commandPrefixes[productIdx] || [],
    device,
    productIdx,
  };
};

const init = (opts, callback) => {
  var portal;
  var initCommands = [
    commands.reset,
    commands.activate
  ];

  function sendNextInit(err) {
    if (err) {
      return callback(err);
    }

    if (initCommands.length === 0) {
      return callback(null, portal);
    }

    send(initCommands.shift(), portal, sendNextInit);
  }

  if (typeof opts == 'function') {
    callback = opts;
    opts = null;
  }

  open(portal = find((opts || {}).index), sendNextInit);
  return portal;
};

const open = (portal, callback) => {
  var device = (portal || {}).device;

  // if we don't have a valid device, then abort
  if (!device) {
    return callback(new Error('No device data'));
  }

  try {
    // open the device
    device.open();
  }
  catch (e) {
    return callback(wrapUsbError('Could not open the portal', e));
  }

  // reset the device and then open the interface
  device.reset(function (err) {
    var di;

    if (err) {
      return callback(wrapUsbError('Could not perform reset', err));
    }

    // select the portal interface
    di = device.interface(0);

    // if the kernel driver is active for the interface, release
    if (di.isKernelDriverActive()) {
      di.detachKernelDriver();

      // flag that we need to reattach the kernel driver
      portal._reattach = true;
    }

    // claim the interface (um, horizon)
    try {
      di.claim();
    }
    catch (e) {
      return callback(wrapUsbError('Could not claim usb interface', e));
    }

    // patch in the input and output endpoints
    portal.i = di.endpoint(inpoints[portal.productIdx] || 0x81);
    portal.o = di.endpoint(outpoints[portal.productIdx] || 0x02);

    // check the portal input and ouput are value
    if (!portal.i || portal.i.direction !== 'in') {
      return callback(new Error('Unable to find input interrupt'));
    }

    if (!portal.o || portal.o.direction !== 'out') {
      return callback(new Error('Unable to find output interrupt'));
    }

    // send the reset signal to the device
    send(commands.reset(), portal, function (err) {
      if (err) {
        return callback(wrapUsbError('Could not send reset command', err));
      }

      // send the activate and trigger the outer callback
      send(commands.activate(), portal, function (err) {
        callback(err, err ? null : portal);
      });
    });
  });
};

const read = (portal, callback) => {
  if (!portal || !portal.i) {
    return callback(new Error('no portal input attached'));
  }

  var prefixLen = portal.commandPrefix.length;
  portal.i.transfer(RESPONSE_SIZE, function (err, data) {
    debug('<-- ', data.length, data);
    callback(err, err ? null : (prefixLen ? data.slice(prefixLen) : data));
  });
};

const send = (bytes, portal, callback) => {
  if (!portal || !portal.o) {
    return callback(new Error('no portal output attached'));
  }

  // TODO: handle bytes being provided in another format
  const payload = portal.commandPrefix.concat(bytes || []);
  const data = new Buffer(payload.concat(REQUEST_PADDING.slice(payload.length)));

  // send the data
  debug('--> ', data.length, data);
  portal.o.transfer(data, callback);
};

const sendRaw = (bytes, portal, callback) => {
  if (!portal || !portal.o) {
    return callback(new Error('no portal output attached'));
  }

  // TODO: handle bytes being provided in another format
  const payload = portal.commandPrefix.concat(bytes || []);
  const data = new Buffer(payload.concat(REQUEST_PADDING.slice(payload.length)));

  // send the data
  debug('--> ', data.length, data);
  portal.o.transfer(data, callback);
};

/**
  ### skyportal.release(portal, callback)

  Release the portal device bindings.

**/
const release = (portal, callback) => {
  var device = (portal || {}).device;
  var di = device ? device.interface(0) : null;

  // ensure we have a callback
  callback = callback || function () { };

  // if we don't have a valid device, then abort
  if (!di) {
    return callback(new Error('No device data'));
  }

  di.release(err => {
    if (err) {
      return callback(err);
    }

    // release the input and output endpoints
    portal.i = undefined;
    portal.o = undefined;

    if (portal._reattach) {
      di.attachKernelDriver();
      portal._reattach = false;
    }

    // release the device reference
    portal.device = undefined;

    // TODO: close
    // device.close();
    callback();
  });
};

module.exports = {
  commands,
  find,
  init,
  open,
  read,
  send,
  sendRaw,
  release,
};

/* internal functions */

function isPortal(device) {
  return vendorList.indexOf(device.deviceDescriptor.idVendor) >= 0 &&
    productList.indexOf(device.deviceDescriptor.idProduct) >= 0;
}

function wrapUsbError(msg, usbError) {
  const err = new Error(msg + ' (libusb error: ' + usbError.toString() + ')');

  // attach the usb error
  err.usb = usbError;
  return err;
}
