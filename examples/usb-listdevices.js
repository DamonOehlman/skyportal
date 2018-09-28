const usb = require('usb');
const skyportal = require('..');

// console.log(usb.getDeviceList());
const portal = skyportal.find();

portal.device.deviceDescriptor.bDeviceClass = 1;
console.log(portal);
