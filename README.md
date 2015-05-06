json-rpc-stream
===============

Streaming JSON RPC.

how to use
----------

Create a simple server with a few methods:

```
  var Source = {
    fooSync: function () {
      console.log('foo sync')
    },
    fooAsync: function () {
      return function (cb) {
        setTimeout(function() {
          if (cb) {
            cb(null, { boom: 'bang' })
          }
        }, 100)
      }
    },
    barSync: function (lhs, rhs) {
      return (lhs + rhs)
    },
    barAsync: function (lhs, rhs) {
      return function (cb) {
        setTimeout(function() {
          if (cb) {
            cb(null, (lhs + rhs))
          }
        }, 100)
      }
    }
  }

  var server = new RPCServer()

  server.implementSync('fooSync', Source.fooSync)
  server.implementAsync('fooAsync', Source.fooAsync)
  server.implementSync('barSync', Source.barSync)
  server.implementAsync('barAsync', Source.barAsync)
```

Then create a client and pipe it to the server:

```
  var client = new RPCClient()

  client.pipe(server).pipe(client)
```

To call methods on the client, use `client.callMethod(method, callback, arg1, arg2, ..., argN)` like so:

```
  // calls a sync method with no arguments and no result
  client.callMethod('fooSync', function (err) {
    console.log('hello world')
  })

  // calls an async method with no arguments and a result
  client.callMethod('fooAsync', function (err, result) {
    console.log(result.boom) // prints 'bang'
  })

  // calls a sync method with arguments and a result
  client.callMethod('barSync', function (err, result) {
    console.log('result is', result) // prints 777
  }, 770, 7)

  // calls an async method with arguments and a result
  client.callMethod('barAsync', function (err, result) {
    console.log('result is', result) // prints 42
  }, 40, 2)
```

You can also bind and apply methods:

```
  client.applyMethod('barAsync', function (err, result) {
    console.log('result is', result) // prints 777
  }, [770, 7])

  client.bindMethod('barAsync', function (err, result) {
    console.log('result is', result) // prints 123
  })(23, 100)
```
