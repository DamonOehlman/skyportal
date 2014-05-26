# skyportal

This is a top-level interface to an rfid reader and writer that happens
to double as a very nice glowy thing.  The library itself have been written
to support multiple skyportals on the one machine allowing you do so
some pretty neat things when you have a few usb ports spare :)


[![NPM](https://nodei.co/npm/skyportal.png)](https://nodei.co/npm/skyportal/)

[![experimental](https://img.shields.io/badge/stability-experimental-red.svg)](https://github.com/badges/stability-badges) 

## Usage

This module does just the bare bones required to communicate with the
device, but does make interfacing with a skyportal pretty accessible.  The
follow example demonstrates opening a portal and setting it's color to
green.

```js
var skyportal = require('skyportal');
var commands = skyportal.commands;

skyportal.open(skyportal.find(), function(err, portal) {
  skyportal.send(commands.color(0, 255, 0), portal);
});

```

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

### skyportal.open(portal, callback)

Open the portal using the portal data that has been retrieved
from a find operation.

### skyportal.read(portal, callback)

Read data from the portal.

### skyportal.send(bytes, portal, callback)

Send a chunk of bytes to the portal. If required the device appropriate
command prefix will be prepended to the bytes before sending.

### skyportal.release(portal, callback)

Release the portal device bindings.

## Commands

These are command generators for commands supported on the device.

### activate

The activate command is sent to the device after a reset.

```
[0x41, 0x01]
```

### color(r, g, b)

Update the color of the glowing thing by providing rgb values.  This
function also supports providing a three element array as the first
argument for rgb.

```
[0x43, 0xRR, 0xGG, 0xBB]
```

### query(tagIdx, blockIdx)

Query a tag that is currently on the portal.  Data is returned in blocks,
so use the `blockIdx` to target a specific block of data.

```
[0x51, 0x20 + tagIdx, blockIdx]

### reset

Reset the device ready for use.

```
[0x52]
```

## License(s)

### MIT

Copyright (c) 2014 Damon Oehlman <damon.oehlman@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
