var debug = require('debug')('skyportal');
var usb = require('usb');
var vendorList = [0x1430];
var productList = [
  0x1f17,  // usb wired (pc, xbox)
  0x0150   // wii wireless (also ps3?)
];

// initialise the command prefixes which matches index for index with
// the product list
var commandPrefixes = [
  [],
  [0x0B, 0x14]
];

/**
  # skyportal

  This is a top-level interface to an rfid reader and writer that happens
  to double as a very nice glowy thing.  The library itself have been written
  to support multiple skyportals on the one machine allowing you do so
  some pretty neat things when you have a few usb ports spare :)

  ## Reference

  ### skyportal.find(index == 0)

  Look for a skyportal within the current usb devices.

**/
exports.find = function(index) {
  var portal;
  var productIdx;

  // get the portal
  portal = usb.getDeviceList().filter(isPortal)[index || 0];

  // if we don't have a portal, return
  if (! portal) {
    return;
  }

  // patch in the command prefix into the device data
  productIdx = productList.indexOf(portal.deviceDescriptor.idProduct);
  portal.commandPrefix = commandPrefixes[productIdx] || [];

  // return the portal
  return portal;
};

/* internal functions */

function isPortal(device) {
  return vendorList.indexOf(device.deviceDescriptor.idVendor) >= 0 &&
    productList.indexOf(device.deviceDescriptor.idProduct) >= 0;
}

exports.init = function(vendorId, productId, cb) {
  var device = usb.findByIds(vendorId, productId);
  var portal;

  function exec(callback) {
    debug('looking for device: vendorid = 0x' + vendorId.toString(16) +
      ', productid = 0x' + productId.toString(16));

    if (! device) {
      return callback(new Error('Unable to find the device'));
    }

    // open the device
    try {
      debug('attempting to open the device');
      device.open();
    }
    catch (e) {
      return callback(e);
    }

    // attempt a device reset
    device.reset(function(err) {
      var input;
      var output;
      var oldPresenceByte;

      if (err) return callback(err);

      // open the portal
      portal = device.interface(0);

      if (portal.isKernelDriverActive()) {
        debug('kernel driver active for the portal, detaching');
        portal.detachKernelDriver();
      }

      // claim the interface
      try {
        debug('attempting to claim appropriate of the device');
        portal.claim();
      }
      catch (e) {
        return callback(e);
      }

      output = portal.endpoint(0x02);
      input = portal.endpoint(0x81);

      // console.log(portal.endpoints);
      console.log(output.direction);
      console.log(input.direction);

      input.on('error', function(err) {
        debug('captured error: ', err);
      });

      input.on('data', function(data) {
        var command = data[0 + commandPrefix.length];
        var flag = data[1 + commandPrefix.length];
        var payload;

        debug('.');

        if (command === 0x53) {
          if (flag !== oldPresenceByte && flag) {
            debug('presence byte changed: ', flag.toString(16));
            output.transfer(new Buffer(commandPrefix.concat([0x51, 0x21, 0x00])));
          }

          oldPresenceByte = flag;
        }
        else if (command === 0x51) {
          debug('received data', flag.toString(16));
          if (flag === 0x01) {
            debug('received query error, sending query for existing skylander data');
            output.transfer(new Buffer(commandPrefix.concat([0x51, 0x20, 0x00])));
          }
          else if (flag >= 0x10) {
            debug('received character data chunk: ', flag.toString(16), data[4], data.slice(5, 5 + 16));
            if (data[4] < 63) {
              output.transfer(new Buffer(commandPrefix.concat([0x51, flag, data[4] + 1])));
            }
          }
        }
        else {
          debug('got command: ' + command.toString() + ' data: ', data.slice(0 + commandPrefix.length(), 20 + commandPrefix.length()));
        }
      });

      console.log(input);
      // input.startStream(3, (commandPrefix.length + 20) * 8);

      async.mapSeries([
        new Buffer(commandPrefix.concat([0x52])), // R 
        new Buffer(commandPrefix.concat([0x41, 0x01])), // A, 0x01
        new Buffer(commandPrefix.concat([0x43, 0xFF, 0x00, 0x00])), // C red
        new Buffer(commandPrefix.concat([0x43, 0x00, 0xFF, 0x00])), // C green
        new Buffer(commandPrefix.concat([0x43, 0x00, 0x00, 0xFF])), // C blue
        new Buffer(commandPrefix.concat([0x53])) // S 
      ], output.transfer.bind(output), function(err, results) {
        process.stdin.resume();
        // input.startStream(3, (commandPrefix.length + 20) * 8);

        console.log(results);
        input.transfer((commandPrefix.length + 20) * 8, function(err, data) {
          console.log(data.slice(2));
        });
      });
    });
  }

  return cb ? exec(cb) : exec;
};