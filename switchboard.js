var debug = require('debug')('rtc-switchboard');
module.exports = function(server, opts) {
  var WebSocketServer = require('ws').Server;
  var wss = new WebSocketServer({ server: server });
  var board = require('rtc-switch')();
  var connections = [];

  wss.on('connection', function connection(ws) {
    var peer = board.connect();

    // add the socket to the connection list
    connections.push(ws);

    ws.on('message', peer.process);
    peer.on('data', function(data) {
      if (ws.readyState === 1) {
        debug('<== %s %s', peer.id, data);
        ws.send(data);
      }
    });

    ws.on('close', function() {
      // trigger the peer leave
      peer.leave();

      // splice out the connection
      connections = connections.filter(function(conn) {
        return conn !== ws;
      });
    });
  });

  // add a reset helper
  board.reset = function() {
    connections.splice(0).forEach(function(conn) {
      conn.close();
    });
  };

  return board;
};
