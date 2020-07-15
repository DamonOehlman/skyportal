# skyportal

This is a top-level interface to an rfid reader and writer that happens
to double as a very nice glowy thing.  The library itself have been written
to support multiple skyportals on the one machine allowing you do so
some pretty neat things when you have a few usb ports spare :)

[![NPM](https://nodei.co/npm/skyportal.png)](https://nodei.co/npm/skyportal/)



## Usage

This module does just the bare bones required to communicate with the
device, but does make interfacing with a skyportal pretty accessible.  The
follow example demonstrates opening a portal and setting it's color to
green.

```js
const { commands, init, send } = require('skyportal');

init((err, portal) => {
  if (err) {
    console.error(err);
    return;
  }

  send(commands.color(0, 255, 0), portal);
});
```

## Required System Permissions

On linux, by default super user privileges are required to open a USB device. It
is possible, however, to add udev rules to mark a device as something that can
be used by all users.  Included in this repo is a system configuration file
which will do that for the various devices this package is compatible with.

If you wish to do this, you can run the following commands (but you are
also encouraged to look at the referenced rules file also):

```sh
sudo cp system/999-skyportal.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules
```

**NOTE:** Running the examples (at least on my machine required root user
privileges to open the device, so you may need to `sudo` the examples).

## Compatibility

At this stage this has only been tested with the USB version of the portal
(Xbox 360) on Linux.  It has been coded in such a way that compatibility
with other portal models is quite easy to implement, so feel to send
through a pull request :)

You may need to apply some system updates to get it working though, see the
following url for more info:

<https://bitbucket.org/DamonOehlman/skyportal/src/HEAD/system/>

## LICENSE

The MIT License (MIT)

Copyright (c) 2020 Damon Oehlman <damon.oehlman@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
