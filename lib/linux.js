/**
 * @param {!Device} device
 * @return {!Promise<Device>}
 */
function openDevice(device) {
  if (!device) {
    throw new Error('no device selected');
  }

  device.open();
  return new Promise((resolve, reject) => {
    device.reset((err) => {
      if (err) {
        return reject(err);
      }

      resolve(device);
    });
  });
}

module.exports = {
  openDevice
};
