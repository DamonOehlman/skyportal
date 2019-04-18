const config = require('./config');
const debug = require('debug')('skyportal:portal');

class SkyPortal {
  constructor(options) {
    this.di = options.di;
    this.input = options.input;
    this.output = options.output;
    this.detachedKernelDriver = options.detachedKernelDriver || false;

    this.commandPrefix = config.commandPrefixes[options.productIndex] || [];
  }

  static of(options) {
    return new SkyPortal(options);
  }

  read() {
    const prefixLen = this.commandPrefix.length;
    return new Promise((resolve, reject) => {
      this.input.transfer(config.RESPONSE_SIZE, (err, data) => {
        if (err) {
          return reject(err);
        }

        debug('<-- ', data.length, data);
        resolve(data.slice(prefixLen));
      });
    });
  }

  write(bytes) {
    // TODO: handle bytes being provided in another format
    const payload = this.commandPrefix.concat(bytes || []);
    const data = new Buffer(payload.concat(config.REQUEST_PADDING.slice(payload.length)));

    // send the data
    debug('--> ', data.length, data);
    return new Promise((resolve, reject) => {
      this.output.transfer(data, (err) => {
        if (err) {
          return reject(err);
        }

        resolve(this);
      });
    });
  }

  release() {
    return new Promise((resolve, reject) => {
      this.di.release((err) => {
        if (err) {
          return reject(err);
        }

        // cleanup references
        this.input = undefined;
        this.output = undefined;

        if (this.detachedKernelDriver) {
          this.di.attachKernelDriver();
        }

        this.di = undefined;
        resolve(this);
      });
    });
  }

  checkInput() {
    if (!this.input || this.input.direction !== 'in') {
      throw new Error('Unable to find input interrupt');
    }
  }

  checkOutput() {
    if (!this.output || this.output.direction !== 'out') {
      throw new Error('Unable to find output interrupt');
    }
  }
}

module.exports = SkyPortal;
