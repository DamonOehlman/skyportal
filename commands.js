/**
  The activate command is sent to the device after a reset.
**/
exports.activate = () => ([0x41, 0x01]);

/**
  ### color(r, g, b)

  Update the color of the glowing thing by providing rgb values.  This
  function also supports providing a three element array as the first
  argument for rgb.

  ```
  [0x43, 0xRR, 0xGG, 0xBB]
  ```

**/
exports.color = (r, g, b) => {
  return Array.isArray(r) ? [0x43, ...r] : [0x43, r, g, b];
};


/**
  ### query(tagIdx, blockIdx)

  Query a tag that is currently on the portal.  Data is returned in blocks,
  so use the `blockIdx` to target a specific block of data.

  ```
  [0x51, 0x20 + tagIdx, blockIdx]
**/
exports.query = (tagIdx, blockIdx) => ([0x51, (blockIdx ? 0x10 : 0x20) + tagIdx, blockIdx]);

exports.reset = () => ([0x52]);
exports.status = () => ([0x53]);
