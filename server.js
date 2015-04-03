var util = require('util')
var eventStream = require('event-stream')
var through = require('through')

var RPCErrors = {
  'PARSE_ERROR':
    { code: -32700, message: 'Parse error' },
  'INVALID_REQUEST':
    { code: -32600, message: 'Invalid request' },
  'METHOD_NOT_FOUND':
    { code: -32700, message: 'Method not found' },
  'INVALID_PARAMS':
    { code: -32700, message: 'Invalid params' },
  'INTERNAL_ERROR':
    { code: -32700, message: 'Internal error' },
}

var RPCServer = function(opts) {
  var stream = through(function write(data) {
    if (typeof data !== 'object') {
      handleRPCError(req, RPCErrors['PARSE_ERROR'])
      return
    }
    stream.emit('message', data)
    if (!('id' in data)) {
      stream.emit('notification', data)
    } else {
      handleRequest(data);
    }
  },
  function end() {
    stream.queue(null)
  })

  var methodImps = {}

  function implementMethod(method, fun, thisArg, sync) {
    if (typeof method !== 'string') {
      throw new TypeError("Argument 'method' must be a string.")
    }
    if (typeof fun !== 'function') {
      throw new TypeError("Argument 'fun' must be a function.")
    }
    methodImps[method] = {
      fun: fun,
      thisArg: thisArg,
      sync: sync
    }
  }

  stream.implementSync = function(method, fun, thisArg) {
    implementMethod(method, fun, thisArg, true)
  }

  stream.implementAsync = function(method, fun, thisArg) {
    implementMethod(method, fun, thisArg, false)
  }

  function handleRequest(req) {
    if (typeof req['method'] !== 'string') {
      handleRPCError(req, RPCErrors['INVALID_REQUEST'])
      return
    }

    var method = req['method']
    if (!methodImps[method]) {
      handleRPCError(req, RPCErrors['METHOD_NOT_FOUND'])
      return
    }

    var methodImp = methodImps[method]
    var thisArg = methodImp.thisArg || stream
    var args = req['params'] || []
    if (!Array.isArray(args)) {
      args = [args]
    }
    stream.emit('request', req)
    var result = methodImp.fun.apply(thisArg, args)
    if (methodImp.sync) {
      var res = createResultResponse(req, result)
      stream.emit('response', req, res)
      queueResponse(res)
    } else {
      if (typeof result !== 'function') {
        handleRPCError(req, RPCErrors['INTERNAL_ERROR'])
      } else {
        result(function(err, result) {
          if (err) {
            handleRPCError(req, err)
          } else {
            var res = createResultResponse(req, result)
            stream.emit('response', req, res)
            queueResponse(res)
          }
        })
      }
    }
  }

  function handleRPCError(req, RPCError) {
    stream.emit('error', new Error(RPCError.message))
    queueResponse(createErrorResponse(req, RPCError))
  }

  function createResultResponse(req, result) {
    return {
      'id': req.id,
      'result': result
    }
  }

  function createErrorResponse(req, err) {
    return {
      'id': req.id,
      'error': err
    }
  }

  function queueResponse(res) {
    stream.queue(res)
  }

  return stream
}

module.exports = RPCServer
module.exports.RPCErrors = RPCErrors
