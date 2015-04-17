var RPCServer = require('./server')
var RPCClient = require('./client')

module.exports = {
  server: function (opts) {
    return RPCServer(opts)
  },
  client: function (opts) {
    return RPCClient(opts)
  }
}

module.exports.RPCServer = RPCServer;
module.exports.RPCClient = RPCClient;
