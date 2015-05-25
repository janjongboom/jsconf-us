(function() {
var distance = {};

var personData = {
  ice: {
    photo: 'people/jan.jpg',
    name: 'Jan Jongboom',
    company: 'Telenor Digital',
    description: 'Software developer / evangelist currently working on Firefox OS and Internet of Things applicances',
    descriptionSource: 'janjongboom.com',
    twitter: 958,
    github: 118,
    lastTweet: 'Bluetooth LE support is in #FirefoxOS. Here\'s how to scan for iBeacons!'
  }
};

function calcDistance(rssi) {
  var txPower = -70;
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

function update() {
  var c = document.querySelector('#info');
  
  // check distance, if only one of them is within 0.5 meter and the rest >.6m
  // show the box
  var blah = Object.keys(distance).map(key => distance[key]).sort();
  console.log('blah', blah);
  if (blah[0] > 0.5 || blah[1] < 0.6) {
    c.style.display = 'none';
    return;
  }
  
  var key = Object.keys(distance).filter(key => distance[key] === blah[0])[0];
  
  var p = personData[key];
  
  c.style.display = 'block';
  
  c.querySelector('.face').src = p.photo;
  c.querySelector('.name').textContent = p.name;
  c.querySelector('.company').textContent = p.company;
  c.querySelector('.description span').textContent = p.description;
  c.querySelector('.description small').textContent = '(' + p.descriptionSource + ')';
  c.querySelector('.fame .twitter').textContent = p.twitter;
  c.querySelector('.fame .github').textContent = p.github;
  c.querySelector('.last-tweet').textContent = '“' + p.lastTweet + '”';
}

var wsOpen = false;
var ws;
function connect() {
  ws = new WebSocket('ws://' + location.hostname + ':9322');
  ws.onopen = function() {
    wsOpen = true;
  };
  ws.onclose = function() {
    document.querySelector('#beacons').innerHTML = '';

    wsOpen = false;
    connect();
  };
  ws.onmessage = function(e) {
    var data = e.data;
    if (typeof data === 'string') data = JSON.parse(data);
    
    if (data.type === 'beacon') {
      var beacon = data;
      var ele = document.querySelector('li[data-major="' + beacon.major + '"]');
      if (!ele) {
        ele = document.createElement('li');
        ele.dataset.major = beacon.major;
        document.querySelector('#beacons').appendChild(ele);
      }
      
      var d = calcDistance(beacon.rssi);
      
      ele.textContent = beacon.name + ' (' + d.toFixed(2) + 'm)';
      
      distance[beacon.name] = d;
      
      update();
    }
  };
}
connect();



var step = 0;
document.addEventListener('keydown', e => {
  if (e.key === 'PageDown') {
    step++;
    renderStep();
  }
  else if (e.key === 'PageUp') {
    step--;
    renderStep();
  }
});

function renderStep() {
  var steps = {
    0: {
      hidden: true
    },
    1: {
      hidden: false
    },
    2: {
      get talk() {
        return "Hello from Mozilla glass. I am Andreas Gal. CTO of Mozilla.";
      }
    },
    3: {
      get talk() {
        return "OK Google";
        // return "There are " + Object.keys(distance).length + " people around you";
      }
    },
    4: {
      get talk() {
        return "Will do!";
      }
    },
    5: {
      get talk() {
        var c = document.querySelector('#info');
        if (c.style.display !== 'block') {
          return "You're not near anyone";
        }
        else {
          return "You are near " + c.querySelector('.name').textContent;
        }
      }
    },
    6: {
      talk: "I'm sorry Jan, I'm afraid I can't do that"
    }
  };
  
  if (!steps[step]) {
    step = 0;
  }

  if (steps[step].hidden !== undefined) {
    document.querySelector('#andreas').classList.toggle('hidden', steps[step].hidden);
  }
  
  if (steps[step].talk) {
    document.querySelector('#andreas').classList.add('talking');
    meSpeak.speak(steps[step].talk, {}, function() {
       document.querySelector('#andreas').classList.remove('talking');
    })
  }
}



})();
