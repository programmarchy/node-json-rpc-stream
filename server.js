var util = require('util')
var through = require('through2')

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

function RPCServer(opts) {
  opts = opts || {}

  var stream = through.obj(function (data, enc, next) {
    if (typeof data !== 'object') {
      handleRPCError(req, RPCErrors['PARSE_ERROR'])
      next()
      return
    }
    stream.emit('message', data)
    if (!('id' in data)) {
      stream.emit('notification', data)
      next()
    } else {
      handleRequest(data)
      next()
    }
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

  stream.implementSync = function (method, fun, thisArg) {
    implementMethod(method, fun, thisArg, true)
  }

  stream.implementAsync = function (method, fun, thisArg) {
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

    stream.emit('request', req)

    var methodImp = methodImps[method]
    var thisArg = methodImp.thisArg || stream
    var args = req['params'] || []
    if (!Array.isArray(args)) {
      args = [args]
    }
    if (methodImp.sync) {
      var result = methodImp.fun.apply(thisArg, args)
      var res = createResultResponse(req, result)
      stream.emit('response', req, res)
      queueResponse(res)
    } else try {
      var callback = methodImp.fun.apply(thisArg, args)
      if (typeof callback !== 'function') {
        handleRPCError(req, RPCErrors['INTERNAL_ERROR'])
      } else {
        callback(function (err, result) {
          if (err) {
            var res = createErrorResponse(req, RPCErrors['INTERNAL_ERROR'])
            res.error.data = err
            res.result = result
            stream.emit('response', req, res)
            queueResponse(res)
          } else {
            var res = createResultResponse(req, result)
            stream.emit('response', req, res)
            queueResponse(res)
          }
        })
      }
    } catch (ex) {
      handleRPCError(req, RPCErrors['INTERNAL_ERROR'])
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
    stream.push(res)
  }

  return stream
}

module.exports = RPCServer
module.exports.RPCErrors = RPCErrors
