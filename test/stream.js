var test = require('tape')
var util = require('util')
var RPCServer = require('../server')
var RPCClient = require('../client')

test('simple client', function (t) {
  t.plan(20)

  var Source = {
    fooSync: function () {
      console.log('foo sync')
    },
    fooAsync: function () {
      return function (cb) {
        if (cb) {
          cb(null, {
            name: 'boom'
          }, {
            name: 'beep'
          }, {
            name: 'boop'
          })
        }
      }
    },
    barSync: function (lhs, rhs) {
      return (lhs + rhs)
    },
    barAsync: function (lhs, rhs) {
      return function (cb) {
        if (cb) {
          cb(null, (lhs + rhs))
        }
      }
    }
  }

  var server = new RPCServer()

  server.implementSync('fooSync', Source.fooSync)
  server.implementAsync('fooAsync', Source.fooAsync)
  server.implementSync('barSync', Source.barSync)
  server.implementAsync('barAsync', Source.barAsync)

  server.once('error', function (err) {
    t.end(err)
  })

  var client = new RPCClient()

  client.pipe(server).pipe(client)

  // calls a sync method with no arguments and no result
  client.callMethod('fooSync', function (err) {
    t.ifError(err)
  })

  // calls a sync method with arguments and a result
  client.callMethod('barSync', function (err, result) {
    t.ifError(err)
    t.ok(result)
    t.equal(result, 105)
  }, 5, 100)

  // calls an async method with no arguments and no result
  client.callMethod('fooAsync', function (err) {
    t.ifError(err)
  })

  // calls an async method with arguments and a result
  client.callMethod('barAsync', function (err, result) {
    t.ifError(err)
    t.ok(result)
    t.equal(result, 59)
  }, 42, 17)

  // apply a sync method
  client.applyMethod('barSync', function (err, result) {
    t.ifError(err)
    t.ok(result)
    t.equal(result, 101)
  }, [99, 2])

  // apply an async method
  client.applyMethod('barAsync', function (err, result) {
    t.ifError(err)
    t.ok(result)
    t.equal(result, 99)
  }, [98, 1])

  // bind a sync method
  client.bindMethod('barSync', function (err, result) {
    t.ifError(err)
    t.ok(result)
    t.equal(result, 3)
  })(1, 2)

  // bind an async method
  client.bindMethod('barAsync', function (err, result) {
    t.ifError(err)
    t.ok(result)
    t.equal(result, 7)
  })(3, 4)

})
