var connect = require('connect');

connect()
    .use(connect.static(__dirname))
    .listen(9321, '0.0.0.0');

var ws = require("nodejs-websocket");
var server = ws.createServer(function(conn) {
  console.log("New connection");
  conn.on("text", function(str) {
    try {
      var data = JSON.parse(str);
      if (data.deviceId) {
        conn.deviceId = data;
      }
    }
    catch (ex) {}
    broadcast(str);
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

console.log('Listening on port', 9321, 9322);
