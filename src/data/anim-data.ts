import { Actor, AnimThingState, Thing, ThingState, ThingType } from './actor-data'

type Anim = {
  repeats:boolean
  frames:number[]
  speed:number
}

export const anims = new Map<ThingType, Map<ThingState | AnimThingState, Anim>>()

const ballAnims = new Map()
ballAnims.set(ThingState.None, { repeats: false, frames: [0], speed: 1 })
ballAnims.set(ThingState.Moving, { repeats: true, frames: [0, 1], speed: 5 })
anims.set(ThingType.Rock, ballAnims)

const guyAnims = new Map()
guyAnims.set(ThingState.None, { repeats: false, frames: [0], speed: 1 })
guyAnims.set(ThingState.Moving, { repeats: true, frames: [0, 1, 0, 2], speed: 10 })
guyAnims.set(ThingState.PreThrow, { repeats: false, frames: [3], speed: 1 })
guyAnims.set(AnimThingState.PreThrowWalk, { repeats: true, frames: [3, 4, 3, 5], speed: 12 })
guyAnims.set(AnimThingState.JumpUp, { repeats: true, frames: [6, 7], speed: 8 })
guyAnims.set(AnimThingState.JumpDown, { repeats: true, frames: [8, 9], speed: 8 })
anims.set(ThingType.Guy, guyAnims)

export const getAnim = (thing:Thing):number => {
  const anim = anims.get(thing.type)!.get(thing.state)!
  if (anim.repeats) {
    return thing.type + anim.frames[Math.floor(thing.stateTime / anim.speed) % anim.frames.length]
  } else {
    return thing.type + anim.frames[Math.min(Math.floor(thing.stateTime / anim.speed), anim.frames.length - 1)]
  }
}

export const getActorAnim = (actor:Actor):number => {
  let anim = anims.get(actor.type)!.get(ThingState.None)!
  if (actor.state === ThingState.PreThrow && actor.pos.z === 0) {
    if (actor.vel > 0) {
      anim = anims.get(actor.type)!.get(AnimThingState.PreThrowWalk)!
    } else {
      anim = anims.get(actor.type)!.get(ThingState.PreThrow)!
    }
  } else if (actor.pos.z > 0) {
    if (actor.zVel > 0) {
      anim = anims.get(actor.type)!.get(AnimThingState.JumpUp)!
    } else {
      anim = anims.get(actor.type)!.get(AnimThingState.JumpDown)!
    }
  } else if (actor.vel > 0) {
    anim = anims.get(actor.type)!.get(ThingState.Moving)!
  }

  if (anim.repeats) {
    return actor.type + actor.facing * actor.animsLength + anim.frames[Math.floor(actor.stateTime / anim.speed) % anim.frames.length]
  } else {
    return actor.type + actor.facing * actor.animsLength + anim.frames[Math.min(Math.floor(actor.stateTime / anim.speed), anim.frames.length - 1)]
  }
}
