var util = require('util')
var through = require('through2')

function RPCClient(opts) {
  opts = opts || {}

  var stream = through.obj(function write(data, enc, next) {
    if (data === null) {
      stream.emit('error', TypeError("Argument 'data' must not be null."))
      next()
      return
    }
    if (typeof data !== 'object') {
      stream.emit('error', TypeError("Argument 'data' must be an object."))
      next()
      return
    }
    stream.emit('message', data)
    if (!('id' in data)) {
      stream.emit('notification', data)
      next()
    } else {
      handleResponse(data)
      next()
    }
  })

  stream.applyMethod = function (method, fun, params) {
    var req = createRequest(method, params)
    addPendingRequest(req, fun)
  }

  stream.callMethod = function (method, fun) {
    var args = [].splice.call(arguments, 2)
    stream.applyMethod(method, fun, args)
  }

  stream.bindMethod = function (method, fun) {
    return function () {
      var args = [].splice.call(arguments, 0)
      stream.applyMethod(method, fun, args)
    }
  }

  var pendingRequests = []

  function addPendingRequest(req, fun) {
    stream.emit('request', req)
    pendingRequests = pendingRequests.concat([
      createPendingRequest(req, fun)
    ])
    stream.push(req)
  }

  function removePendingRequest(id) {
    pendingRequests = pendingRequests.filter(function (pendingRequest) {
      return pendingRequest.id !== id
    })
  }

  var id = 1;
  function createRequest(method, params) {
    return {
      'id': id++,
      'method': method,
      'params': params
    }
  }

  function createPendingRequest(req, fun) {
    return {
      req: req,
      fun: fun
    }
  }

  function handleResponse(res) {
    if (!(('result' in res) || ('error' in res))) {
      stream.emit('error', new Error("Response does not have either a 'result' nor an 'error' property."))
      removePendingRequest(res.id)
      return
    }
    var foundPendingRequests = pendingRequests.filter(function (pendingRequest) {
      return res.id === pendingRequest.req.id
    })
    removePendingRequest(res.id)
    if (foundPendingRequests.length === 0) {
      stream.emit('error', new Error('Received unsolicited response.'))
      return
    }
    if (foundPendingRequests.length > 1) {
      stream.emit('error', new Error('Duplicate request (id = ' + res.id + ').'))
    }
    var pendingRequest = foundPendingRequests[0]
    var req = pendingRequest.req
    stream.emit('response', req, res)
    var fun = pendingRequest.fun
    if (fun) {
      if (res.error) {
        fun.call(stream, res.error, res.result)
      } else {
        fun.call(stream, null, res.result)
      }
    }
  }

  return stream
}

module.exports = RPCClient
