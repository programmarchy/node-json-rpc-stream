var RPCServer = require('./server')
var RPCClient = require('./client')

function RPCStream() {
  
  this.server = function (opts) {
    return RPCServer(opts)
  }

  this.client = function (opts) {
    return RPCClient(opts)
  }

  return this
}

module.exports = RPCStream;
module.exports.RPCServer = RPCServer;
module.exports.RPCClient = RPCClient;
