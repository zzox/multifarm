import { Thing } from '../data/actor-data'
import { Collides, vec3 } from '../types'
import { toRadian } from '../util/utils'

// TODO: get from const
const fps = 60
const gravity = 120

export const allCollides = { left: true, right: true, up: true, down: true }

export const updatePhysics = (thing:Thing) => {
  thing.last.x = thing.pos.x
  thing.last.y = thing.pos.y

  if (thing.held) return

  thing.zVel -= (gravity / fps) * thing.gravityFactor

  const velX = thing.vel * 1.5 * Math.cos(toRadian(thing.angle))
  const velY = thing.vel * Math.sin(toRadian(thing.angle))

  thing.pos.x += velX / fps
  thing.pos.y += velY / fps
  thing.pos.z += thing.zVel / fps
}

// Returns true if two physics bodies overlap.
export const overlaps = (x1:number, y1:number, w1:number, h1:number, x2:number, y2:number, w2:number, h2:number):boolean =>
  x1 + w1 > x2 && x1 < x2 + w2 && y1 + h1 > y2 && y1 < y2 + h2

export const overlaps3 = (
  x1:number, y1:number, z1:number,
  w1:number, h1:number, t1:number,
  x2:number, y2:number, z2:number,
  w2:number, h2:number, t2:number
):boolean =>
  x1 + w1 > x2 && x1 < x2 + w2 && y1 + h1 > y2 && y1 < y2 + h2 && z1 + t1 > z2 && z1 < z2 + t2
  // x1 + w1 >= x2 && x1 <= x2 + w2 && y1 + h1 >= y2 && y1 <= y2 + h2 <- seam clips

export const thingsOverlap = (t1:Thing, t2:Thing) =>
  overlaps3(
    t1.pos.x, t1.pos.y, t1.pos.z, t1.size.x, t1.size.y, t1.size.z,
    t2.pos.x, t2.pos.y, t2.pos.z, t2.size.x, t2.size.y, t2.size.z
  )

// Returns true if there's a collision
export const collideWallProj = (thing:Thing, wx:number, wy:number, ww:number, wh:number, wallCollides:Collides):boolean => {
  let collided = false
  if (overlaps(thing.pos.x, thing.pos.y, thing.size.x, thing.size.y, wx, wy, ww, wh)) {
    collided = checkWallDirectionalCollision(thing, { pos: vec3(wx, wy, 0), size: vec3(ww, wh, 32) } as Thing, wallCollides)
  }
  if (!collided && overlaps(thing.pos.x, thing.pos.y, thing.size.x, thing.size.y, wx, wy - thing.pos.z, ww, wh + thing.pos.z)) {
    return collideUp(thing, { pos: vec3(wx, wy, 0), size: vec3(ww, wh, 32) } as Thing)
  }
  return collided
}

// Returns true if there's a collision
export const collideWallXY = (thing:Thing, wx:number, wy:number, ww:number, wh:number, wallCollides:Collides):boolean => {
  if (overlaps(thing.pos.x, thing.pos.y, thing.size.x, thing.size.y, wx, wy, ww, wh)) {
    return checkDirectionalCollision(thing, { pos: vec3(wx, wy, 0), size: vec3(ww, wh, 1) } as Thing, true, wallCollides)
  }
  return false
}

const checkWallDirectionalCollision = (fromThing:Thing, intoWall:Thing, intoCollides:Collides):boolean => {
  let collided = false
  if (intoCollides.down
    && fromThing.last.y >= intoWall.pos.y + intoWall.size.y
    && fromThing.pos.y < intoWall.pos.y + intoWall.size.y) {
    fromThing.pos.y = intoWall.pos.y + intoWall.size.y
    bounceY(fromThing)
    collided = true
  }

  if (intoCollides.right
    && fromThing.last.x >= intoWall.pos.x + intoWall.size.x
    && fromThing.pos.x < intoWall.pos.x + intoWall.size.x) {
    fromThing.pos.x = intoWall.pos.x + intoWall.size.x
    bounceX(fromThing)
    collided = true
  }

  if (intoCollides.left
    && fromThing.last.x + fromThing.size.x <= intoWall.pos.x
    && fromThing.pos.x + fromThing.size.x > intoWall.pos.x) {
    fromThing.pos.x = intoWall.pos.x - fromThing.size.x
    bounceX(fromThing)
    collided = true
  }

  return collided
}

const collideUp = (fromThing:Thing, intoWall:Thing) => {
  const zHeight = fromThing.pos.z
  let collided = false
  if (//fromThing.last.y + fromThing.size.y - zHeight <= intoWall.pos.y &&
    fromThing.pos.y + fromThing.size.y - zHeight > intoWall.pos.y) {
    fromThing.pos.y = intoWall.pos.y - fromThing.size.y + zHeight
    bounceY(fromThing)
    collided = true
  }
  return collided
}

export const checkDirectionalCollision = (fromThing:Thing, intoThing:Thing, separates:boolean, intoCollides:Collides):boolean => {
  var collided = false
  const upCollide = checkUp(fromThing, intoThing, separates, intoCollides)
  if (upCollide) {
    collided = true
    // return true
  }

  const downCollide = checkDown(fromThing, intoThing, separates, intoCollides)
  if (downCollide) {
    collided = true
    // return true
  }

  const leftCollide = checkLeft(fromThing, intoThing, separates, intoCollides)
  if (leftCollide) {
    collided = true
    // return true
  }

  const rightCollide = checkRight(fromThing, intoThing, separates, intoCollides)
  if (rightCollide) {
    collided = true
    // return true
  }

  return collided
}

const checkUp = (fromThing:Thing, intoThing:Thing, separates:boolean, intoCollides:Collides):boolean => {
  if (/* fromThing.collides.up && */ intoCollides.down
    && fromThing.last.y >= intoThing.pos.y + intoThing.size.y
    && fromThing.pos.y < intoThing.pos.y + intoThing.size.y) {
    // fromThing.touching.up = true
    if (separates) {
      separateUp(fromThing, intoThing)
      bounceY(fromThing)
    }
    return true
  }

  return false
}

const checkDown = (fromThing:Thing, intoThing:Thing, separates:boolean, intoCollides:Collides):boolean => {
  if (/* fromThing.collides.down && */ intoCollides.up
    && fromThing.last.y + fromThing.size.y <= intoThing.pos.y
    && fromThing.pos.y + fromThing.size.y > intoThing.pos.y) {
    // fromThing.touching.down = true
    if (separates) {
      separateDown(fromThing, intoThing)
      bounceY(fromThing)
    }
    return true
  }

  return false
}

const checkLeft = (fromThing:Thing, intoThing:Thing, separates:boolean, intoCollides:Collides):boolean => {
  if (/* fromThing.collides.left && */ intoCollides.right
    && fromThing.last.x >= intoThing.pos.x + intoThing.size.x
    && fromThing.pos.x < intoThing.pos.x + intoThing.size.x) {
    // fromThing.touching.left = true
    if (separates) {
      separateLeft(fromThing, intoThing)
      bounceX(fromThing)
    }
    return true
  }

  return false
}

const checkRight = (fromThing:Thing, intoThing:Thing, separates:boolean, intoCollides:Collides):boolean => {
  if (/* fromThing.collides.right && */ intoCollides.left
    && fromThing.last.x + fromThing.size.x <= intoThing.pos.x
    && fromThing.pos.x + fromThing.size.x > intoThing.pos.x) {
    // fromThing.touching.right = true
    if (separates) {
      separateRight(fromThing, intoThing)
      bounceX(fromThing)
    }
    return true
  }

  return false
}

// remove fromThing from intoThing
const separateUp = (fromThing:Thing, intoThing:Thing) => {
  fromThing.pos.y = intoThing.pos.y + intoThing.size.y
}

const separateDown = (fromThing:Thing, intoThing:Thing) => {
  fromThing.pos.y = intoThing.pos.y - fromThing.size.y
}

const separateLeft = (fromThing:Thing, intoThing:Thing) => {
  fromThing.pos.x = intoThing.pos.x + intoThing.size.x
}

const separateRight = (fromThing:Thing, intoThing:Thing) => {
  fromThing.pos.x = intoThing.pos.x - fromThing.size.x
}

const bounceX = (thing:Thing) => {
  thing.vel = thing.vel * thing.bounce
  if (Math.abs(thing.vel) < 3) thing.vel = 0
  thing.angle = 180 - thing.angle
}

const bounceY = (thing:Thing) => {
  thing.vel = thing.vel * thing.bounce
  if (Math.abs(thing.vel) < 3) thing.vel = 0
  thing.angle = -thing.angle
}
