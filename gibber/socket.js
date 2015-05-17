var clientList = {};

var wsOpen = false;
var ws;
function connect() {
  ws = new WebSocket('ws://' + location.hostname + ':9322');
  ws.onopen = function() {
    wsOpen = true;
  };
  ws.onclose = function() {
    wsOpen = false;
    connect();
  };
  ws.onmessage = function(e) {
    var data = e.data;
    if (typeof data === 'string') data = JSON.parse(data);
    
    if (data.type === 'client-gone') {
      console.log('client-gone', data.deviceId);
    }
    if (data.type === 'client-gone' && clientList[data.deviceId]) {
      clientList[data.deviceId].parentNode.removeChild(clientList[data.deviceId]);
      delete clientList[data.deviceId];
    }
    else if (data.type === 'deviceorientation') {
      var dot = clientList[data.deviceId];
      if (!dot) {
        dot = document.createElement('div');
        dot.classList.add('dot');
        dot.setAttribute('data-device', data.deviceId);
        document.body.appendChild(dot);
        clientList[data.deviceId] = dot;
      }
      
      var beta = data.beta;
      if (beta > 70) beta = 70;
      if (beta < -70) beta = -70;
      
      var gamma = data.gamma;
      if (gamma > 70) gamma = 70;
      if (gamma < -70) gamma = -70;
      
      
      dot.dataset.left = ((gamma + 70) / 140);
      dot.dataset.top = ((beta + 70) / 140);
      
      dot.style.transform = 
        'translateX(' + dot.dataset.left * 100 + 'vw) ' +
        'translateY(' + dot.dataset.top * 100 + 'vh)';
    }
    
    document.querySelector('#clients').textContent = Object.keys(clientList).length;
  };
}
connect();

window.getAvg = function() {
  var keys = Object.keys(clientList);
  
  var blah = keys.reduce(function(curr, id) {
    curr.left += clientList[id].dataset.left;
    curr.top += clientList[id].dataset.top;
    return curr;
  }, { left: 0, top: 0 });
  
  return {
    left: blah.left / keys.length,
    top: blah.top / keys.length,
  };
}