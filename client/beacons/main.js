var wsOpen = false;
var ws;
function connect() {
  ws = new WebSocket('ws://192.168.2.115:9322');
  ws.onopen = function() {
    wsOpen = true;
    document.querySelector('#status').textContent = 'Connected';
  };
  ws.onclose = function() {
    document.querySelector('#status').textContent = 'Connecting...';
    wsOpen = false;
    connect();
  };
}
connect();

window.addEventListener('online', function() {
  if (!wsOpen) connect();
});

var measurement = {};

function gotBeacon(beacon, rssi) {
  console.log('got beacon', beacon.major, rssi);
  var ele = document.querySelector('li[data-major="' + beacon.major + '"]');
  if (!ele) {
    ele = document.createElement('li');
    ele.dataset.major = beacon.major;
    document.querySelector('#beacons').appendChild(ele);
  }
  
  measurement[beacon.major] = measurement[beacon.major] || [];
  measurement[beacon.major] = 
    measurement[beacon.major].slice(
      Math.max(measurement[beacon.major].length - 4, 0), 
      measurement[beacon.major].length);
  
  measurement[beacon.major].push(rssi);
  
  var avg = measurement[beacon.major].reduce((curr, val) => {
    curr += val;
    return curr;
  }, 0) / measurement[beacon.major].length;
  
  var name = (function() {
    switch (beacon.major) {
      case 39524:
        return 'mint';
      case 58630:
        return 'blueberry';
      case 42152:
        return 'ice';
    }
  })();
  
  if (wsOpen) {
    ws.send(JSON.stringify({
      type: 'beacon',
      name: name,
      major: beacon.major,
      minor: beacon.minor,
      rssi: rssi,
      distance: calculateDistance(beacon.txPower, rssi),
      avgRssi: avg,
      avgDistance: calculateDistance(beacon.txPower, avg)
    }));
  }
  
  ele.textContent = name + ' (' + avg.toFixed(2) + ')' + ' ' + calculateDistance(beacon.txPower, avg).toFixed(2) + ' ' +
    new Date().toTimeString();
}

function gogogo() {
  navigator.mozBluetooth.defaultAdapter.startLeScan([]).then(handle => {
    console.log('Start LE scan', handle);
    handle.ondevicefound = e=> {
      var record = parseScanRecord(e.scanRecord);
      if (record) {
        gotBeacon(record, e.rssi);
        // console.log('Found it yo!', record.uuid, record.major, record.minor, 
        //   calculateDistance(record.txPower, e.rssi),
        //   record.txPower, e.rssi);
      }
    };
    
    setTimeout(function() {
      navigator.mozBluetooth.defaultAdapter.stopLeScan(handle);
      setTimeout(() => {
        gogogo();
      }, 100);
    }, 3000);
  
  }, err => {
    console.error('Start LE Scan failed', err);
    setTimeout(gogogo, 2000);
  });
}

navigator.mozBluetooth.addEventListener('attributechanged', function(e) {
  if (e.attrs[0] !== 'defaultAdapter' || !navigator.mozBluetooth.defaultAdapter)
    return;
  
  gogogo();
});

if (!!navigator.mozBluetooth.defaultAdapter) {
  gogogo();
}

function parseScanRecord(scanRecord) {
  var view = new Uint8Array(scanRecord);
  
  // Company ID does not have fixed length, so find out where to start by
  // finding 0x02, 0x15 in byes 4..8
  for (var start = 4; start < 8; start++) {
    if (view[start] === 0x02 && view[start + 1] === 0x15) {
      break;
    }
  }
  
  if (start === 8) {
    return;
  }
  
  // Now UUID is the next 16 bytes right after 0x15
  start += 2;
  var uuid = bytesToHex(view.slice(start, start + 16));
  
  // major / minor are two bytes each
  start += 16;
  var major = (view[start] & 0xff) * 0x100 + (view[start + 1] & 0xff);

  start += 2;
  var minor = (view[start] & 0xff) * 0x100 + (view[start + 1] & 0xff);
  
  start += 2;
  // var txPower = view[start] - 0x100;
  var txPower = -73; // 1 meter distance
  
  return { uuid: uuid, major: major, minor: minor, txPower: txPower };
}

var hexArray = '0123456789ABCDEF'.split('');
function bytesToHex(bytes) {
  var hex = [];
  for (var j = 0; j < bytes.length; j++) {
    var v = bytes[j] & 0xff;
    hex[j * 2] = hexArray[v >>> 4];
    hex[j * 2 + 1] = hexArray[v & 0x0f];
  }
  return hex.join('');
}

function calculateDistance(txPower, rssi) {
  if (rssi === 0) {
    return -1.0;
  }

  var ratio = rssi * 1.0 / txPower;
  if (ratio < 1.0) {
    return Math.pow(ratio, 10);
  }
  else {
    var accuracy =  (0.89976) * Math.pow(ratio, 7.7095) + 0.111;    
    return accuracy;
  }
}

if ('requestWakeLock' in navigator) {
  var lock = navigator.requestWakeLock('screen');
  window.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      lock.unlock();
    }
    else {
      lock = navigator.requestWakeLock('screen');
    }
  });
}
    