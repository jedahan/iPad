'use strict';
var w = window.innerWidth
var h = window.innerHeight

var canvas = document.getElementById('canvas')
canvas.width = w
canvas.height = h

var ctx = canvas.getContext('2d')

var _ = {
    randomColor: function() { return '#'+(Math.random()*0xFFFFFF<<0).toString(16) }
  , pointInCircle: function(pX, pY, cX, cY, r){
    var dx = pX - cX; var dy = pY - cY
    return (dx*dx + dy*dy <= r * r)
  }
  , randomColorWithAlpha: function() {
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
  , drawBox: function(box) {
    var oldStyle = ctx.fillStyle
    ctx.fillStyle = box.c
    ctx.fillRect(box.x-box.r,box.y-box.r,2*box.r,2*box.r)
    ctx.fillStyle = oldStyle
  }
  , drawText: function(text) {
    var oldStyle = ctx.fillStyle
    ctx.fillStyle = text.style
    ctx.font = text.size + " ArialMT"
    text.x = text.x || (w-ctx.measureText(text.text).width) / 2
    text.y = text.y || (ctx.measureText(text.text).actualBoundingBoxAscent) * 2
    ctx.fillText(text.text, text.x, text.y)
    ctx.fillStyle = oldStyle
  }
}

var scenes = {}
var circles = []
var boxes = []
var texts = []
var scene = null
var touch_to_circle_map = {}
var move_circle = false
var handlers = {
  touchstart: null,
  touchmove: null,
  touchend: null
}

var accel

window.ondevicemotion = function(event) {
  accel = event.accelerationIncludingGravity
}

var loop = function() {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  circles.forEach(function(circle){
    if(circle.v){
      if(accel){
        circle.v.x += accel.x || 0
        circle.v.y += accel.y || 0
      }
      circle.x += circle.v.x
      circle.y += circle.v.y
      if(circle.x < 0 ) circle.x = 0
      if(circle.x > w) circle.x = w
      if(circle.y < 0 ) circle.y = 0
      if(circle.y > h) circle.y = h
    }
    _.drawCircle(circle)
  })

  boxes.forEach(function(box){
    _.drawBox(box)
  })

  texts.forEach(function(text){
    _.drawText(text)
  })
}

var gotoScene = function(newscene){
  var listeners = function(add){
    for(var name in handlers) {
      if (handlers.hasOwnProperty(name)){
        if(scenes[scene] && scenes[scene][name]){
          if(add)
            canvas.addEventListener(name, scenes[scene][name], false)
          else
            canvas.removeEventListener(name, scenes[scene][name], false)
        }
      }
    }
  }
  if(scene != newscene){
    listeners(false)
    scene = newscene
    circles = []
    texts = []
    boxes = []
    scenes[scene].setup()
    listeners(true)
  }
}

scenes.start = {
  setup: function() {
    circles.push({x: w/2, y: h/2, r: Math.min(w/3,h/3), c: '#3154a5'})
    texts.push({y: h/2 + 20, text: "START!", style: "#FFFFFF", size: "80px"})
  },
  touchstart: function( event ) {
    var touchX = event.clientX || event.targetTouches[0].clientX
    var touchY = event.clientY || event.targetTouches[0].clientY
    var c = circles[0]
    if (_.pointInCircle(touchX, touchY, c.x, c.y, c.r)){
      gotoScene('circles')
    }
  }
}

scenes.circles = {
  setup: function() {
    circles.push({x: 1*w/3, y: h/2, r: h/12, c: "rgba(255,0,0,0.5)"})
    circles.push({x: 2*w/3, y: h/2, r: h/12, c: "rgba(255,255,0,0.5)"})
    texts.push({x: 180, y: h-60, text: "Using one hand, make these circles orange!", style: "#FF00FF", size: "40px"})
  },
  touchstart: function(e) {
    touch_to_circle_map = {}
    for(var i=0; i<e.targetTouches.length; i++){
      var touchX = e.targetTouches[i].clientX
      var touchY = e.targetTouches[i].clientY
      for(var j=0; j<circles.length; j++){
        if(_.pointInCircle(touchX, touchY, circles[j].x, circles[j].y, circles[j].r / 2)){
          touch_to_circle_map[i] = j
        }
      }
    }
  },
  touchmove: function(e) {
    for(var i=0; i<e.targetTouches.length; i++){
      circles[touch_to_circle_map[i]].x = e.targetTouches[i].clientX
      circles[touch_to_circle_map[i]].y = e.targetTouches[i].clientY
    }
    if(_.pointInCircle(circles[0].x, circles[0].y, circles[1].x, circles[1].y, circles[1].r / 4)){
      texts.push({x: w/2 - 230, y: 200, text: "WOOHOO! ORANGE!", style: "#00FFFF", size: "80px"})
      setTimeout(function(){
        gotoScene('select')
      }, 2000)
    }
  },
  touchend: this.touchstart
}

scenes.select = {
  setup: function() {
    texts.push({text: "touch all the yellow circles at the same time", style: "#FF00FF", size: "40px"})
    var colors = ["rgba(0,255,255,0.5)", "rgba(255,255,0,0.5)", "rgba(255,0,255,0.5)"]
    var circle_count = 9
    var circle_radius = w / (circle_count * 4 / 3) / 2
    for(var i =0; i<circle_count; i++){
      circles.push({x: ((i+1) * 9/4 * circle_radius) + circle_radius, y: h/2, r: circle_radius, c: colors[i%3]})
    }
    texts.push({x: 120, y: h-60, text: "touch all the yellow circles at the same time", style: "#FF00FF", size: "40px"})
  },
  touchstart: function(e) {
    var correct_touches=0
    for(var i=0; i<e.targetTouches.length; i++){
      var touchX = e.targetTouches[i].clientX
      var touchY = e.targetTouches[i].clientY
      for(var j=1; j<circles.length; j+=3){
        if(_.pointInCircle(touchX, touchY, circles[j].x, circles[j].y, circles[j].r)){
          correct_touches++
        }
      }
    }
    if(correct_touches>=2){
      texts.push({y: h-200, text: "Great multi-touching!", style: "#00FF00", size: "60px"})
      setTimeout(function(){
        gotoScene('swipe')
      }, 2000)
    }
  }
}

scenes.swipe = {
  setup: function() {
    texts.push({text: "Move the circle into the box", style: "#FF00FF", size: "30px"})
    var colors = ["rgba(220,220,220,220.5)", "rgba(0,255,255,0.5)", "rgba(255,255,0,0.5)", "rgba(255,0,255,0.5)"]
    circles.push({x: 2*h/12, y: h/2, r: h/12, c: colors[3]})
    boxes.push({x:w-(2*h/12), y: h/2, r: h/12, c: colors[2]})
  },
  touchstart: function(e) {
    move_circle = _.pointInCircle(e.targetTouches[0].clientX, e.targetTouches[0].clientY, circles[0].x, circles[0].y, circles[0].r)
    if(move_circle) { circles[0].caught=true }
  },
  touchmove: function(e) {
    if(move_circle){
      var touchX = e.targetTouches[0].clientX
      var touchY = e.targetTouches[0].clientY
      circles[0].x = touchX
      circles[0].y = touchY
    }

    if(_.pointInCircle(circles[0].x, circles[0].y, boxes[0].x, boxes[0].y, circles[0].r)){
      texts.push({y: h-100, text: "circle in the box!", style: "#00FF00", size: "60px"})
      setTimeout(function(){
        gotoScene('pinch')
      }, 2000)
    }
  }
}

      for(var j=1; j<circles.length; j++){
        if(_.pointInCircle(touchX, touchY, circles[j].x, circles[j].y, circles[j].r/2)){
          circles[j].caught = true
        }
      }

      if(caught>3){
        texts.push({x: 80, y: 120, text: "you got them all!", style: "#00FF00", size: "60px"})
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
      circles.push({
        x: w * Math.random(),
        y: h * Math.random(),
        r: h/10 * Math.random(),
        c: _.randomColorWithAlpha(),
        v: {
          x: Math.random() - 0.5,
          y: Math.random() - 0.5
          }
        })
    }
    setInterval(function(){
      var i = Math.floor(Math.random()*circles.length)
      circles[i].v.x = Math.min(Math.random() - 0.5 + circles[i].v.x, 1)
      circles[i].v.y = Math.min(Math.random() - 0.5 + circles[i].v.y, 1)
    }, 500)
  }
}

gotoScene('start')
setInterval(loop, 1000/60)
