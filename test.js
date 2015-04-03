var util = require('util')
var RPCServer = require('./server')
var RPCClient = require('./client')

var server = new RPCServer()
var client = new RPCClient()

client.pipe(server).pipe(client)

var BluetoothServer = {
  getAdapterState: function() {
    console.log('[SERVER]', 'sync', 'getAdapterState')
  },
  getDevices: function() {
    return function(cb) {
      console.log('[SERVER]', 'async', 'getDevices')
      if (cb) {
        cb(null, [{
          'name': 'Moss-RGB',
          'address': '00-04-3e-08-21-a9',
          'uuids': ['00001101-0000-1000-8000-00805f9b34fb']
        },{
          'name': 'Cubelet-CCC',
          'address': '00-04-52-21-37-b2',
          'uuids': ['00001101-0000-1000-8000-00805f9b34fb']
        }])
      }
    }
  },
  connect: function(address) {
    return function(cb) {
      console.log('[SERVER]', 'async', 'connect', address)
      if (cb) {
        cb(null, true)
      }
    }
  }
}

// Synchronous RPC method implementation with no arguments
server.implementSync('getAdapterState', BluetoothServer.getAdapterState, BluetoothServer)

// Asynchronous RPC method implementation with no arguments
server.implementAsync('getDevices', BluetoothServer.getDevices, BluetoothServer)

// Asynchronous RPC method implementation with a single argument
server.implementAsync('connect', BluetoothServer.connect, BluetoothServer)

server.on('error', function(err) {
  console.error('[SERVER]', '<ERROR>', err)
})

server.on('request', function(req) {
  console.log('[SERVER]', '<REQUEST>', req)
})

server.on('response', function(req, res) {
  console.log('[SERVER]', '<RESPONSE>', res, 'for request:', req)
})

process.nextTick(function test() {
  // Calls a method with no arguments and no result
  client.callMethod('getAdapterState')

  // Calls a method with a result
  client.callMethod('getDevices', function(result) {
    console.log('[CLIENT]', 'call', 'getDevices', result)
  })

  // Calls a method with a single argument and a result
  client.callMethod('connect', function(result) {
    console.log('[CLIENT]', 'call', 'connect', result)
  }, '00-04-52-21-37-b2')

  // Binds a method to a function, and calls it, with a single argument and a result
  client.bindMethod('connect', function(result) {
    console.log('[CLIENT]', 'bind', 'connect', result)
  })('00-04-52-21-37-b2')

  client.applyMethod('connect', function(result) {
    console.log('[CLIENT]', 'apply', 'connect', result)
  },['01-23-45-67-89-AB'])
})

client.on('error', function(err) {
  console.error('[CLIENT]', '<ERROR>', err)
})

client.on('request', function(req) {
  console.log('[CLIENT]', '<REQUEST>', req)
})

client.on('response', function(req, res) {
  console.log('[CLIENT]', '<RESPONSE>', res, 'for request:', req)
})
