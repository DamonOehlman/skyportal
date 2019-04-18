const times = require('whisk/times');

const RESPONSE_SIZE = 0x20;
const REQUEST_PADDING = times(RESPONSE_SIZE).map(() => 0);

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

function isPortal(device) {
  return vendorList.includes(device.deviceDescriptor.idVendor)
    && productList.includes(device.deviceDescriptor.idProduct);
}

module.exports = {
  RESPONSE_SIZE,
  REQUEST_PADDING,
  vendorList,
  productList,
  commandPrefixes,
  inpoints,
  outpoints,
  isPortal
};
