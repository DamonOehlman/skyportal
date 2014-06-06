/* jshint node: true */
'use strict';

var commands = exports.commands = require('./commands');
var debug = require('debug')('skyportal');
var usb = require('usb');
var times = require('whisk/times');
var vendorList = [0x1430];
var productList = [
  0x1f17,  // usb wired (pc, xbox)
  0x0150   // wii wireless (also ps3?)
];

// initialise the command prefixes which matches index for index with
// the product list
var commandPrefixes = [
  [0x0B, 0x14],
  []
];

// initialise the input endpoints for the various product ids
var inpoints = [
  0x81
];
// initialise the output endpoints for the various product ids
var outpoints = [
  0x02
];

var RESPONSE_SIZE = 0x20;
var REQUEST_PADDING = times(RESPONSE_SIZE).map(function() {
  return 0;
});


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
var find = exports.find = function(index) {
  var device;
  var productIdx;

  // get the portal
  device = usb.getDeviceList().filter(isPortal)[index || 0];

  // if we don't have a device, return
  if (! device) {
    return;
  }

  // find the product index so we can patch in the appropriate command prefix
  productIdx = productList.indexOf(device.deviceDescriptor.idProduct);

  return {
    commandPrefix: commandPrefixes[productIdx] || [],
    device: device,
    productIdx: productIdx
  };
};

/**
  ### skyportal.init(opts?, callback)

  The `init` function of the skyportal module is best way to get yourself a
  correctly open initialized portal.  In short, you should pretty much
  always use it.

**/
var init = exports.init = function(opts, callback) {
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
      return callback();
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

/**
  ### skyportal.open(portal, callback)

  Open the portal using the portal data that has been retrieved
  from a find operation.

**/
var open = exports.open = function(portal, callback) {
  var device = (portal || {}).device;

  // if we don't have a valid device, then abort
  if (! device) {
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
  device.reset(function(err) {
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
    send(commands.reset(), portal, function(err) {
      if (err) {
        return callback(wrapUsbError('Could not send reset command', err));
      }

      // send the activate and trigger the outer callback
      send(commands.activate(), portal, function(err) {
        callback(err, err ? null : portal);
      });
    });
  });
};

/**
  ### skyportal.read(portal, callback)

  Read data from the portal.

**/
var read = exports.read = function(portal, callback) {
  var prefixLen = portal.commandPrefix.length;
  portal.i.transfer(RESPONSE_SIZE, function(err, data) {
    debug('<-- ', data.length, data);
    callback(err, err ? null : (prefixLen ? data.slice(prefixLen) : data));
  });
};

/**
  ### skyportal.send(bytes, portal, callback)

  Send a chunk of bytes to the portal. If required the device appropriate
  command prefix will be prepended to the bytes before sending.

**/
var send = exports.send = function(bytes, portal, callback) {
  // TODO: handle bytes being provided in another format
  var payload = portal.commandPrefix.concat(bytes || []);
  var data = new Buffer(payload.concat(REQUEST_PADDING.slice(payload.length)));

  // send the data
  debug('--> ', data.length, data);
  portal.o.transfer(data, callback);
};

var sendRaw = exports.sendRaw = function(bytes, portal, callback) {
  // TODO: handle bytes being provided in another format
  var payload = portal.commandPrefix.concat(bytes || []);
  var data = new Buffer(payload.concat(REQUEST_PADDING.slice(payload.length)));

  // send the data
  debug('--> ', data.length, data);
  portal.o.transfer(data, callback);
};

/**
  ### skyportal.release(portal, callback)

  Release the portal device bindings.

**/
var release = exports.release = function(portal, callback) {
  var device = (portal || {}).device;
  var di = device ? device.interface(0) : null;

  // ensure we have a callback
  callback = callback || function() {};

  // if we don't have a valid device, then abort
  if (! di) {
    return callback(new Error('No device data'));
  }

  di.release(function(err) {
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

/* internal functions */

function isPortal(device) {
  return vendorList.indexOf(device.deviceDescriptor.idVendor) >= 0 &&
    productList.indexOf(device.deviceDescriptor.idProduct) >= 0;
}

function wrapUsbError(msg, usbError) {
  var err = new Error(msg + ' (libusb error: ' + usbError.toString() + ')');

  // attach the usb error
  err.usb = usbError;
  return err;
}
