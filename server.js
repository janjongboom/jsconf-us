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

// Load required modules
var http    = require("http");              // http server core module
var express = require("express");           // web framework external module
var io      = require("socket.io");         // web socket external module
var easyrtc = require("easyrtc");           // EasyRTC external module

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var httpApp = express();
httpApp.use(express.static(__dirname + "/glass/"));

// Start Express http server on port 8080
var webServer = http.createServer(httpApp).listen(9323, '0.0.0.0');

// Start Socket.io so it attaches itself to Express server
var socketServer = io.listen(webServer, {"log level":1});

// Start EasyRTC server
var rtc = easyrtc.listen(httpApp, socketServer);

console.log('Listening on port', 9321, 9322, 9323);
