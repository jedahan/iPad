var w = window.innerWidth
var h = window.innerHeight

var canvas = document.getElementById('canvas')
canvas.width = w
canvas.height = h

var ctx = canvas.getContext('2d')

var _ = {
    randomColor: function() { return '#'+(Math.random()*0xFFFFFF<<0).toString(16); }
  , pointInCircle: function(pX, pY, cX, cY, r){
    var dx = pX - cX; var dy = pY - cY;
    return (dx*dx + dy*dy <= r * r)
  }
  , randomAlphaColor: function() {
      return 'rgba('+Math.floor(Math.random()*255)
               + ','+Math.floor(Math.random()*255)
               + ','+Math.floor(Math.random()*255)
               + ','+Math.random()+')'
  }
  , clearScreen: function() {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  }
  , drawCircle: function(circle) {
    ctx.fillStyle = circle.c
    ctx.beginPath()
    ctx.arc(circle.x, circle.y, circle.r, 0, 2*Math.PI, true)
    ctx.fill()
    ctx.stroke()
  }
  , drawText: function(text) {
    var oldStyle = ctx.fillStyle
    ctx.fillStyle = text.style
    ctx.font = text.font
    ctx.fillText(text.text, text.x, text.y)
    ctx.fillStyle = oldStyle
  }
  , addEventListeners: function(events, handler) {
    for(var i=0; i<events.length; i++){
      canvas.addEventListener(events[i], handler, false);
    }
  }
  , removeEventListeners: function(events, handler) {
    for(var i=0; i<events.length; i++){
      canvas.removeEventListener(events[i], handler, false);
    }
  }
}

var scene, loopId;
var scenes = {}
var circles = []
var text = []
var touch_to_circle_map = {}

var loop = function() {
  _.clearScreen()

  for(var i = 0; i < circles.length; i++){
    _.drawCircle(circles[i])
  }

  for(var j=0; j < text.length; j++){
    _.drawText(text[j])
  }
}

var gotoScene = function(newscene){
  if(scene) { scene.cleanup() }
  if(loopId) { clearInterval(loopId) }

  scene = scenes[newscene]
  _.clearScreen()
  scene.setup()
  loopId = setInterval(loop, 1000/60)
}

scenes.start = {
  startCircles: function( event ) {
    touchX = event.clientX || event.targetTouches[0].clientX
    touchY = event.clientY || event.targetTouches[0].clientY
    c = circles[0]
    if (_.pointInCircle(touchX, touchY, c.x, c.y, c.r)){
      gotoScene('circles')
    }
  },
  setup: function() {
    circles.push({x: w/2, y: h/2, r: Math.min(w/3,h/3), c: _.randomColor()})
    text.push({x: w/2 - 130, y: h/2 + 20, text: "START!", style: "#FF00FF", font: "80px Arial"})
    _.addEventListeners( ['touchstart'], this.startCircles, false )
    _.addEventListeners( ['click'], this.startCircles, false )
  },
  cleanup: function() {
    _.removeEventListeners( ['click'], this.startCircles )
    _.removeEventListeners( ['touchstart'], this.startCircles )
    circles = []
    text = []
  }
}

scenes.circles = {
  setup: function() {
    circles.push({x: 1*w/3, y: h/2, r: h/12, c: "rgba(255,0,0,0.5)"})
    circles.push({x: 2*w/3, y: h/2, r: h/12, c: "rgba(255,255,0,0.5)"})

    _.addEventListeners( ['touchstart', 'touchend', 'mousedown', 'mouseup'], this.lockCircles)
    _.addEventListeners( ['touchmove', 'mousemove'], this.moveCircles )

    text.push({x: 180, y: h-60, text: "Using one hand, make these circles orange!", style: "#FF00FF", font: "40px Arial"})
  },
  cleanup: function() {
    _.removeEventListeners( ['touchstart', 'touchend', 'mousedown', 'mouseup'], this.lockCircles )
    _.removeEventListeners( ['touchmove', 'mousemove'], this.moveCircles )
    circles = []
    text = []
  },
  lockCircles: function(e) {
    touch_to_circle_map = {}
    if(e.targetTouches){
      for(var i=0; i<e.targetTouches.length; i++){
        var touchX = e.targetTouches[i].clientX;
        var touchY = e.targetTouches[i].clientY;
        for(var j=0; j<circles.length; j++){
          if(_.pointInCircle(touchX, touchY, circles[j].x, circles[j].y, circles[j].r / 2)){
            touch_to_circle_map[i] = j;
          }
        }
      }
    } else {
      for(var j=0; j<circles.length; j++){
        if(_.pointInCircle(e.clientX, e.clientY, circles[j].x, circles[j].y, circles[j].r / 3)){
          touch_to_circle_map[0] = j;
        }
      }

    }
  },
  moveCircles: function(e) {
    if(e.targetTouches){
      for(var i=0; i<e.targetTouches.length; i++){
        circles[touch_to_circle_map[i]].x = e.targetTouches[i].clientX;
        circles[touch_to_circle_map[i]].y = e.targetTouches[i].clientY;
      }
    } else {
      if(touch_to_circle_map){
        circles[touch_to_circle_map[0]] = circles[touch_to_circle_map[0]] || {x: null, y: null}
        circles[touch_to_circle_map[0]].x = e.clientX;
        circles[touch_to_circle_map[0]].y = e.clientY;
      }
    }
    if(_.pointInCircle(circles[0].x, circles[0].y, circles[1].x, circles[1].y, circles[1].r / 4)){
      text.push({x: w/2 - 230, y: h/2 + 20, text: "WOOHOO! ORANGE!", style: "#00FFFF", font: "80px Arial"})
      setTimeout(function(){
        gotoScene('congrats')
      }, 2000)

    }
  }
}

scenes.congrats = {
  setup: function() {
    for(var i=0; i<100; i++){
      circles.push({x: w * Math.random(), y: h * Math.random(), r: h/10 * Math.random(), c: _.randomAlphaColor()})
    }
    setInterval(function(){
      var i = Math.floor(Math.random()*circles.length)
      circles[i].x += 3 * (Math.random()-0.5)
      circles[i].y += 3 * (Math.random()-0.5)
    }, 10)
  },
  cleanup: function() {
    circles=[]
  }
}


gotoScene('start')
