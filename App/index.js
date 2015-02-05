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
  , drawCircle: function(circle) {
    ctx.fillStyle = circle.c
    ctx.beginPath()
    ctx.arc(circle.x, circle.y, circle.r, 0, 2*Math.PI, true)
    ctx.fill()
  }
  , drawText: function(text) {
    var oldStyle = ctx.fillStyle
    ctx.fillStyle = text.style
    ctx.font = text.font
    ctx.fillText(text.text, text.x, text.y)
    ctx.fillStyle = oldStyle
  }
}

var scene, loopId;
var scenes = {}
var circles = []
var texts = []
var touch_to_circle_map = {}
var touchstarthandler = function() {}
var touchendhandler = function() {}
var touchmovehandler = function() {}

var loop = function() {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  circles.forEach(function(circle){
    _.drawCircle(circle)
  })

  texts.forEach(function(text){
    _.drawText(text)
  })
}

var cleanup = function() {
  canvas.removeEventListener('touchstart', touchstarthandler, false)
  canvas.removeEventListener('touchmove', touchmovehandler, false)
  canvas.removeEventListener('touchend', touchendhandler, false)
  circles = []
  texts = []
}

var gotoScene = function(newscene){
  if(loopId) { clearInterval(loopId) }
  cleanup()

  scene = scenes[newscene]
  scene.setup()
  canvas.addEventListener('touchstart', touchstarthandler, false)
  canvas.addEventListener('touchmove', touchmovehandler, false)
  canvas.addEventListener('touchend', touchendhandler, false)
  loopId = setInterval(loop, 1000/60)
}

scenes.start = {
  touchstart: function( event ) {
    touchX = event.clientX || event.targetTouches[0].clientX
    touchY = event.clientY || event.targetTouches[0].clientY
    c = circles[0]
    if (_.pointInCircle(touchX, touchY, c.x, c.y, c.r)){
      gotoScene('circles')
    }
  },
  setup: function() {
    circles.push({x: w/2, y: h/2, r: Math.min(w/3,h/3), c: _.randomColor()})
    texts.push({x: w/2 - 130, y: h/2 + 20, text: "START!", style: "#FF00FF", font: "80px ArialMT"})

    touchstarthandler = this.touchstart
  }
}

scenes.circles = {
  setup: function() {
    circles.push({x: 1*w/3, y: h/2, r: h/12, c: "rgba(255,0,0,0.5)"})
    circles.push({x: 2*w/3, y: h/2, r: h/12, c: "rgba(255,255,0,0.5)"})

    touchstarthandler = this.touchstart
    touchendhandler = this.touchstart
    touchmovehandler = this.touchmove

    texts.push({x: 180, y: h-60, text: "Using one hand, make these circles orange!", style: "#FF00FF", font: "40px ArialMT"})
  },
  touchstart: function(e) {
    touch_to_circle_map = {}
    for(var i=0; i<e.targetTouches.length; i++){
      var touchX = e.targetTouches[i].clientX;
      var touchY = e.targetTouches[i].clientY;
      for(var j=0; j<circles.length; j++){
        if(_.pointInCircle(touchX, touchY, circles[j].x, circles[j].y, circles[j].r / 2)){
          touch_to_circle_map[i] = j;
        }
      }
    }
  },
  touchmove: function(e) {
    for(var i=0; i<e.targetTouches.length; i++){
      circles[touch_to_circle_map[i]].x = e.targetTouches[i].clientX;
      circles[touch_to_circle_map[i]].y = e.targetTouches[i].clientY;
    }
    if(_.pointInCircle(circles[0].x, circles[0].y, circles[1].x, circles[1].y, circles[1].r / 4)){
      texts.push({x: w/2 - 230, y: 200, text: "WOOHOO! ORANGE!", style: "#00FFFF", font: "80px ArialMT"})
      setTimeout(function(){
        gotoScene('select')
      }, 2000)
    }
  }
}

scenes.select = {
  setup: function() {
    var colors = ["rgba(0,255,255,0.5)", "rgba(255,255,0,0.5)", "rgba(255,0,255,0.5)"]
    var circle_count = 9
    var circle_radius = w / (circle_count * 4 / 3) / 2
    for(var i =0; i<circle_count; i++){
      circles.push({x: ((i+1) * 9/4 * circle_radius) + circle_radius, y: h/2, r: circle_radius, c: colors[i%3]})
    }

    touchstarthandler = this.touchstart

    texts.push({x: 120, y: h-60, text: "touch all the yellow circles at the same time", style: "#FF00FF", font: "40px ArialMT"})
  },
  touchstart: function(e) {
    var correct_touches=0
    for(var i=0; i<e.targetTouches.length; i++){
      var touchX = e.targetTouches[i].clientX;
      var touchY = e.targetTouches[i].clientY;
      for(var j=1; j<circles.length; j+=3){
        if(_.pointInCircle(touchX, touchY, circles[j].x, circles[j].y, circles[j].r)){
          correct_touches++
        }
      }
    }
    if(correct_touches>1){
      texts.push({x: 20, y: 200, text: "daaamn you good with colors!", style: "#00FF00", font: "60px ArialMT"})
      setTimeout(function(){
        gotoScene('swipe')
      }, 2000)
    }
  }
}

scenes.swipe = {
  setup: function() {
    var move_circle = false
    var colors = ["rgba(220,220,220,220.5)", "rgba(0,255,255,0.5)", "rgba(255,255,0,0.5)", "rgba(255,0,255,0.5)"]
    for(var i=0; i<4; i++){
      circles.push({x: 40 + w/12 + (w/4 * i), y: h/2, r: h/6, c: colors[i % colors.length]})
    }

    touchstarthandler = this.touchCircles
    touchmovehandler = this.moveCircles
    texts.push({x: 120, y: h-60, text: "collect all the colors using the first circle as fast as possible", style: "#FF00FF", font: "30px ArialMT"})
  },

  touchCircles: function(e) {
    var touchX = e.targetTouches[0].clientX
    var touchY = e.targetTouches[0].clientY
    move_circle = _.pointInCircle(touchX, touchY, circles[0].x, circles[0].y, circles[0].r)
    if(move_circle) { circles[0].caught=true }
  },
  moveCircles: function(e) {
    if(move_circle){
      var touchX = e.targetTouches[0].clientX
      var touchY = e.targetTouches[0].clientY
      var caught = 0
      circles.forEach(function(c){
        if(c.caught){
          c.x = touchX
          c.y = touchY
          caught++
        }
      })

      for(var j=1; j<circles.length; j++){
        if(_.pointInCircle(touchX, touchY, circles[j].x, circles[j].y, circles[j].r/2)){
          circles[j].caught = true
        }
      }

      if(caught>3){
        texts.push({x: 80, y: 120, text: "you got them all!", style: "#00FF00", font: "60px ArialMT"})
        setTimeout(function(){
          gotoScene('congrats')
        }, 2000)
      }
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
  }
}

gotoScene('start')
