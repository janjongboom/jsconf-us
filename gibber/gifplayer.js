(function() {
  /**
   * Based on x-gif
   */
  
  function play(ele, frames) {
    var ctx = ele.getContext('2d');
    var ix = 0;
    var playbackTimeout = 50;
    var to;

    function nextFrame() {
      var lix = 0;
      if (!frames[ix]) {
        ix = 0;
        
        // @todo: this doesn't look nice :-(
        // why does it work first time....???
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, ele.width, ele.height);
      }
      
      if (!frames[ix].img) {
        var img = new Image();
        img.onload = function() {
          frames[lix].img = img;
          ctx.drawImage(img, 0, 0, ele.width, ele.height);
        };
        img.src = frames[ix].url;
      }
      else {
        ctx.drawImage(frames[ix].img, 0, 0, ele.width, ele.height);
      }

      ix++;
      
      to = setTimeout(nextFrame, playbackTimeout);
    }
    nextFrame();
    
    return {
      stop: function() {
        clearTimeout(to);
        to = null;
      },
      start: function() {
        if (to) return;
        nextFrame();
      },
      set playbackTimeout(v) {
        playbackTimeout = v;
      },
      get playbackTimeout() {
        return playbackTimeout;
      }
    };
  }
  
  function createPlayer(file, ele) {
    return new Promise((res, rej) => {
      var x = new XMLHttpRequest();
      x.open('GET', file);
      x.responseType = 'arraybuffer';
      x.onload = function() {
        explode(x.response).then(frames => {
          res(play(ele, frames));
        })
        .catch(rej);
      };
      x.send();
    });
  }
  
  function i(t) {
    this.data = new Uint8Array(t), this.index = 0, this.log("TOTAL LENGTH: " + this.data.length)
  };
  i.prototype.finished = function() {
    return this.index >= this.data.length
  };
  i.prototype.readByte = function() {
    return this.data[this.index++]
  };
  i.prototype.peekByte = function() {
    return this.data[this.index]
  };
  i.prototype.skipBytes = function(t) {
    this.index += t
  };
  i.prototype.peekBit = function(t) {
    return !!(this.peekByte() & 1 << 8 - t)
  };
  i.prototype.readAscii = function(t) {
    for (var e = "", r = 0; t > r; r++) e += String.fromCharCode(this.readByte());
    return e
  };
  i.prototype.isNext = function(t) {
    for (var e = 0; e < t.length; e++)
      if (t[e] !== this.data[this.index + e]) return !1;
    return !0
  };
  i.prototype.log = function() {};
  i.prototype.error = function(t) {
    console.error(this.index + ": " + t)
  };
  
  function explode(t) {
    return console.debug("EXPLODING russian-guy-dancing-o.gif"), new Promise(function(e, r) {
      var o = [],
        u = new i(t);
      if ("GIF89a" != u.readAscii(6)) return void r(Error("Not a GIF!"));
      if (u.skipBytes(4), u.peekBit(1)) {
        u.log("GLOBAL COLOR TABLE");
        var a = 7 & u.readByte();
        u.log("GLOBAL COLOR TABLE IS " + 3 * Math.pow(2, a + 1) + " BYTES"), u.skipBytes(2), u.skipBytes(3 * Math.pow(2, a + 1))
      }
      else u.log("NO GLOBAL COLOR TABLE");
      for (var c = t.slice(0, u.index), l = !0, f = !1; l;)
        if (u.isNext([33, 255])) {
          u.log("APPLICATION EXTENSION"), u.skipBytes(2);
          var h = u.readByte();
          if (u.log(u.readAscii(h)), u.isNext([3, 1])) u.skipBytes(5);
          else {
            for (u.log("A weird application extension. Skip until we have 2 NULL bytes"); 0 !== u.readByte() || 0 !== u.peekByte(););
            u.log("OK moving on"), u.skipBytes(1)
          }
        }
        else if (u.isNext([33, 254])) {
        for (u.log("COMMENT EXTENSION"), u.skipBytes(2); !u.isNext([0]);) {
          var h = u.readByte();
          u.log(u.readAscii(h))
        }
        u.skipBytes(1)
      }
      else if (u.isNext([44])) {
        if (u.log("IMAGE DESCRIPTOR!"), f || o.push({
            index: u.index,
            delay: 0
          }), f = !1, u.skipBytes(9), u.peekBit(1)) {
          u.log("LOCAL COLOR TABLE");
          var a = 7 & u.readByte();
          u.log("LOCAL COLOR TABLE IS " + 3 * Math.pow(2, a + 1) + " BYTES"), u.skipBytes(3 * Math.pow(2, a + 1))
        }
        else u.log("NO LOCAL TABLE PHEW"), u.skipBytes(1);
        for (u.log("MIN CODE SIZE " + u.readByte()), u.log("DATA START"); !u.isNext([0]);) {
          var h = u.readByte();
          u.skipBytes(h)
        }
        u.log("DATA END"), u.skipBytes(1)
      }
      else if (u.isNext([33, 249, 4])) {
        u.log("GRAPHICS CONTROL EXTENSION!");
        var p = u.index;
        u.skipBytes(3);
        var d = u.readByte() >> 2;
        u.log("DISPOSAL " + d);
        var m = u.readByte() + 256 * u.readByte();
        o.push({
          index: p,
          delay: m,
          disposal: d
        }), u.log("FRAME DELAY " + m), u.skipBytes(2), f = !0
      }
      else {
        for (var g = u.index; !u.finished() && !u.isNext([33, 249, 4]);) u.readByte();
        u.finished() ? (u.index = g, u.log("WE END"), l = !1) : u.log("UNKNOWN DATA FROM " + g)
      }
      for (var v = u.index, b = t.slice(-1), y = 0; y < o.length; y++) {
        var j = o[y],
          w = y < o.length - 1 ? o[y + 1].index : v;
        j.blob = new Blob([c, t.slice(j.index, w), b], {
          type: "image/gif"
        }), j.url = URL.createObjectURL(j.blob)
      }
      e(o);
    })
  }
  
  window.createGifPlayer = createPlayer;
})();
