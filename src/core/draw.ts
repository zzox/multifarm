import { Height, hiTarget, loTarget, maxPercent, TileHeight, TileWidth, Width } from './const'

let context:CanvasRenderingContext2D
let image:HTMLImageElement

export const setContext = (ctx:CanvasRenderingContext2D) => context = ctx
export const getContext = ():CanvasRenderingContext2D => context

export const setImage = (img:HTMLImageElement) => image = img

export const drawTile = (fromIndex:number, x:number, y:number) => {
  const tRowWidth = (image.width / TileWidth)
  const tRow = fromIndex % tRowWidth
  const tColumn = Math.floor(fromIndex / tRowWidth)

  context.drawImage(image,
    tRow * TileWidth, tColumn * TileHeight, TileWidth, TileHeight,
    x, y, TileWidth, TileHeight
  )
}

export const drawSprite = (x:number, y:number, index:number, width = 16, height = 16) => {
  const tRowWidth = (image.width / width)
  const tRow = index % tRowWidth
  const tColumn = Math.floor(index / tRowWidth)

  context.drawImage(image,
    tRow * width, tColumn * height, width, height,
    x, y, width, height
  )
}

export const drawDebug = (x:number, y:number, width:number, height:number, fillColor:string = '#ff00ff') => {
  context.fillStyle = fillColor
  context.globalAlpha = 0.5
  context.fillRect(x, y, width, height)
  context.globalAlpha = 1.0
}

export const clear = (bgColor:string = 'black') => {
  // context.clearRect
  context.fillStyle = bgColor
  context.fillRect(0, 0, Width, Height)
}

export const drawBarBg = () => {
  context.drawImage(image,
    0, 48, 48, 16,
    0, Height - 16, 48, 16
  )
}

export const drawBar = (percent:number) => {
  if (percent >= maxPercent) {
    context.fillStyle = '#b4202a'
  } else if (percent > hiTarget) {
    context.fillStyle = '#df3e23'
  } else if (percent > loTarget) {
    context.fillStyle = '#14a02e'
  } else {
    context.fillStyle = '#1a7a3e'
  }

  context.fillRect(3, Height - 12, Math.round(42 * Math.min(percent, 1.0)), 8)
}
