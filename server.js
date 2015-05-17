var connect = require('connect');

connect()
    .use(connect.static(__dirname))
    .listen(9321, '0.0.0.0');

var ws = require("nodejs-websocket");
var server = ws.createServer(function(conn) {
  console.log("New connection");
  
  var to;
  conn.on("text", function(str) {
    
    if (to) {
      clearTimeout(to);
    }
    
    try {
      var data = JSON.parse(str);
      if (data.deviceId) {
        conn.deviceId = data.deviceId;
      }
    }
    catch (ex) {}
    broadcast(str);

    // no message for 2s, then treat as disconnect
    if (conn.deviceId) {
      to = setTimeout(function() {
        broadcast(JSON.stringify({ type: 'client-gone', deviceId: conn.deviceId }));
      }, 2000);
    }
  });
  conn.on("close", function(code, reason) {
    broadcast(JSON.stringify({ type: 'client-gone', deviceId: conn.deviceId }));

    console.log("Connection closed");
  });
}).listen(9322, '0.0.0.0');

function broadcast(msg) {
  server.connections.forEach(function(conn) {
    try {
      conn.sendText(msg);
    }
    catch(ex) {}
  });
}

process.on('uncaughtException', function (err) {
  console.error(err.stack);
});

/**
 * SWITCHBOARD STUFF!
 */
var swServer = require('http').createServer();
var switchboard = require('./switchboard')(swServer, { servelib: true });
swServer.listen(9323, '0.0.0.0');

console.log('Listening on port', 9321, 9322, 9323);
