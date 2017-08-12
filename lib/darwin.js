const async = require('async');
const debug = require('debug')('skyportal:darwin');

/**
 * @param {!Device} device
 * @return {!Promise<Device>}
 */
function openDevice(device) {
  if (!device) {
    throw new Error('no device selected');
  }

  debug('opening the device without the default configuration');
  device.open(false);
  return new Promise((resolve, reject) => {
    async.series([
      device.setConfiguration.bind(device, 1),
      device.reset.bind(device)
    ], (err) => {
      if (err) {
        return reject(err);
      }

      resolve(device);
    })
  });
}

module.exports = {
  openDevice
};
