(function() {
  "use strict"
  
  var _m = null,
      $ = Gibber.dollar,
      mappingProperties = {
        x : {
          min:0, max:1,
          timescale:'interface',
          output: Gibber.LINEAR
        },
        y : {
          min:0, max:1,
          timescale:'interface',
          output: Gibber.LINEAR
        }
      }


    if( _m !== null ) return _m

    _m = {} 

    var storeX = 0, storeY = 0
    
    $.extend( _m, {
      x:0, y:0, prevX:0, prevY:0,
      isOn : false,
      name: 'Phone',
      on: function() {
        _m._isOn = true;
        
        if (this.iv) return;
        
        this.iv = setInterval(function() {
          console.time('getAvg');
          var avg = window.getAvg();
          console.timeEnd('getAvg');
          
          if (isNaN(avg.left)) { return; }
          
          _m['prevX'] = storeX;
          _m['prevY'] = storeY;
          storeX = _m.x = avg.left * mappingProperties.x.max | 0;
          storeY = _m.y = avg.top * mappingProperties.y.max | 0;
          
          console.log('setting to', storeX, storeY);
          
          if( typeof _m.onvaluechange === 'function' ) {
            _m.onvaluechange()
          }
        }, 200);
      },
      off: function() {
        _m._isOn = false;
        this.iv && clearInterval(this.iv);
        this.iv = null;
      },
      toggle : function() {
        if( _m.isOn ) {
          _m.off()
        }else{
          _m.on()
        }
      },
    })
    
    mappingProperties.x.max = window.innerWidth
    mappingProperties.y.max = window.innerHeight
    
    // create getter layer that turns mouse event handlers on as needed
    for( var prop in mappingProperties ) {
      !function() {
        var name = prop,
            Name = prop.charAt(0).toUpperCase() + prop.slice(1),
            value = _m[ prop ]
        
        Object.defineProperty( _m, Name, {
          configurable:true,
          get: function() {
            if( Name !== "Button" ) {
              _m.on();
            }
            return value 
          },
          set: function(v) { value = v; return _m }
        })
      }()
    }
    
    $.subscribe( '/layout/contentResize', function( obj ) {
      _m.ww = _m.X.max = obj.w
      _m.wh = _m.Y.max = obj.h
    })
    
    Gibber.createProxyProperties( _m, mappingProperties, true )
    
  window.Phone = _m;
})();
