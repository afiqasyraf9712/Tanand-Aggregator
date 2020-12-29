const util = {};

util.env = {
  nodeEnv: process.env.NODE_ENV === 'DEV' ? 1 : 0,
};

module.exports = util;
