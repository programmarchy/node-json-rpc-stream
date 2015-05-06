var test = require('tape')
var util = require('util')
var RPCServer = require('../server')

test('sync', function (t) {
  t.plan(8)
  var server = new RPCServer()
  server.implementSync('fun', function () {
    t.pass('called fun')
  })
  server.write({
    id: 1,
    method: 'fun'
  })
  server.implementSync('funargs', function (a1, a2, a3) {
    t.pass('called funargs')
    t.ok(a1, 'has arg 1')
    t.deepEqual(a1, 42)
    t.ok(a2, 'has arg 2')
    t.deepEqual(a2, 'dogs rule')
    t.ok(a3, 'has arg 3')
    t.deepEqual(a3, [ 1, 2, 3 ])
  })
  server.write({
    id: 2,
    method: 'funargs',
    params: [
      42,
      'dogs rule',
      [ 1, 2, 3 ]
    ]
  })
})

test('async', function (t) {
  t.plan(8)
  var server = new RPCServer()
  server.implementAsync('fun', function () {
    return function (callback) {
      setTimeout(function () {
        t.pass('called fun')
        callback(null)
      }, 5)
    }
  })
  server.write({
    id: 1,
    method: 'fun'
  })
  server.implementAsync('funargs', function (a1, a2, a3) {
    return function (callback) {
      setTimeout(function () {
        t.pass('called funargs')
        t.ok(a1, 'has arg 1')
        t.deepEqual(a1, 42)
        t.ok(a2, 'has arg 2')
        t.deepEqual(a2, 'dogs rule')
        t.ok(a3, 'has arg 3')
        t.deepEqual(a3, [ 1, 2, 3 ])
      }, 5)
    }
  })
  server.write({
    id: 2,
    method: 'funargs',
    params: [
      42,
      'dogs rule',
      [ 1, 2, 3 ]
    ]
  })
})
