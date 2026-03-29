import { keys, justPressed, clearJustPressed } from './core/keys'
import { Scene } from './scenes/test-scene'
import { Debug } from './util/debug'
import { average } from './util/utils'
import { clear, setContext, setImage } from './core/draw'

const canvas = document.getElementById('main-canvas') as HTMLCanvasElement
const fixed = document.getElementsByClassName('fixed')[0] as HTMLDivElement
let scene:Scene
let debugScale = 0

let paused:boolean = false

const update = () => {
  const updateStart = performance.now()

  scene.update()
  clearJustPressed()

  const time = performance.now()
  const updateTime = time - updateStart
  Debug.updateTimes.push(updateTime)
  Debug.updateTimes.shift()

  Debug.updateFrames.push(time)
  while (true) {
    if (Debug.updateFrames[0] && Debug.updateFrames[0] < time - 999) {
      Debug.updateFrames.shift()
    } else {
      break
    }
  }
}

const draw = () => {
  const renderStart = performance.now()

  clear()
  scene.draw()

  // context.drawImage(image, Math.floor(Math.random() * 100), Math.floor(Math.random() * 100))

  const time = performance.now()
  const renderTime = time - renderStart
  Debug.renderTimes.push(renderTime)
  Debug.renderTimes.shift()

  Debug.renderFrames.push(time)
  while (true) {
    if (Debug.renderFrames[0] && Debug.renderFrames[0] < time - 999) {
      Debug.renderFrames.shift()
    } else {
      break
    }
  }

  if (Debug.on) {
    const pItems = Array.from(fixed.querySelectorAll('p'))
    pItems[0].textContent = `FPS: ${Debug.renderFrames.length}, avg: ${Math.round(average(Debug.renderTimes) * 1000)}us`
    pItems[1].textContent = `UPS: ${Debug.updateFrames.length}, avg: ${Math.round(average(Debug.updateTimes) * 1000)}us`
    pItems[2].textContent = `things: ${scene.things.length} checks: ${scene.checks}`
    pItems[3].textContent = `scale: ${debugScale}`
    fixed.classList.remove('none')
  } else {
    fixed.classList.add('none')
  }
}

let acc = 0
let prev = 0

let fps = 60
let frameTime = 1000 / fps

const next = (time:number) => {
  if (!paused) {
    const delta = time - prev
    acc += Math.min(delta, frameTime + 2.0)

    if (acc > frameTime) {
      update()
      draw()
      acc -= frameTime
    }
  }

  requestAnimationFrame(next)
  prev = time
}

const ready = () => {
  next(0)
}

const resizeCanvas = () => {
  const maxMulti = 20
  const w = canvas.width
  const h = canvas.height
  // overflow pixels
  const padding = 0
  
  const availW = canvas.parentElement!.getBoundingClientRect().width
  const availH = canvas.parentElement!.getBoundingClientRect().height

  const scale = window.devicePixelRatio

  const maxW = Math.floor(availW / (w * scale - padding))
  const maxH = Math.floor(availH / (h * scale - padding))
  // lower than maxMultiplier, but at least two
  const multi = Math.max(Math.min(Math.min(maxW, maxH), maxMulti), 1)

  debugScale = multi

  const width = Math.floor(multi * w * scale)
  const height = Math.floor(multi * h * scale)

  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  fixed.style.left = `${(availW - (width)) / 2}px`
  fixed.style.top = `${(availH - (height)) / 2}px`
}

const run = async () => {
  const image = new Image()
  image.src = './assets/tiles.png'
  setImage(image)
  setContext(canvas.getContext('2d')!)

  // const grid = makeGrid(11, 11)

  // from: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images
  // await Promise.all(
  //   Array.from(document.images).map(
  //     (image) =>
  //       new Promise((resolve) => image.addEventListener('load', resolve)),
  //   ),
  // )

  document.onkeydown = (event:KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Space':
        event.preventDefault()
        break
      case 'd':
        Debug.on = !Debug.on
        break
      case 'p':
        console.log(
          `FPS: ${Debug.renderFrames.length}, avg: ${Math.round(average(Debug.renderTimes) * 1000)}us\n` +
          `UPS: ${Debug.updateFrames.length}, avg: ${Math.round(average(Debug.updateTimes) * 1000)}us`
        )
        paused = !paused
        break
    }
    if (event.repeat) return
    keys.set(event.key, true)
    justPressed.set(event.key, true)
  }
  document.onkeyup = (event:KeyboardEvent) => {
    // event.preventDefault()
    keys.set(event.key, false)
  }

  Debug.renderTimes = [...new Array(300)].map(_ => 0) // 5 seconds on 60fps monitors
  Debug.updateTimes = [...new Array(300)].map(_ => 0) // ~5 seconds

  image.addEventListener('load', ready)

  window.onresize = resizeCanvas
  resizeCanvas()

  scene = new Scene()
  scene.create()
}

run()
