
// Tiles 
// Use Case 15:  https://github.com/aws/amazon-chime-sdk-js

const indexMap = {};

const acquireVideoElement = tileId => {
  // Return the same video element if already bound.
  for (let i = 0; i < 16; i += 1) {
    if (indexMap[i] === tileId) {
      return videoElements[i];
    }
  }
  // Return the next available video element.
  for (let i = 0; i < 16; i += 1) {
    if (!indexMap.hasOwnProperty(i)) {
      indexMap[i] = tileId;
      return videoElements[i];
    }
  }
  throw new Error('no video element is available');
};

const releaseVideoElement = tileId => {
  for (let i = 0; i < 16; i += 1) {
    if (indexMap[i] === tileId) {
      delete indexMap[i];
      return;
    }
  }
};

