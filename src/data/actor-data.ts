import { clone3, FacingDir, vec2, Vec2, vec3, Vec3 } from '../types'

// type Wall = {
//   // size:Vec3 <- all are asummed 24x16
//   pos:Vec3
// }

// tile index of the thing
export enum ThingType {
  Nothing = -1,
  Guy = 64,
  Greenguy = 112,
  Rock = 192,
  Ball = 194
}

export enum ThingState {
  None,
  Moving,
  Hurt,
  // player
  PreThrow,
  Throw
}

// anim states that aren't covered in our normal thing states
// high numbers not to interfere with `ThingState`!
export enum AnimThingState {
  JumpUp = 800,
  JumpDown = 801,
  PreThrowWalk = 802,
}

type PhysicsObject = {
  pos:Vec3
  last:Vec3
  vel:number
  zVel:number
  angle:number
  size:Vec3
  gravityFactor:number
}

// thing is a physical object that can move.
export type Thing = PhysicsObject & {
  dead:boolean
  health:number
  type:ThingType
  state:ThingState
  stateTime:number
  offset:Vec2
  animsLength:number
  bounce:number
  held:boolean
  isActor:boolean
}

// actor is a thing that is alive
export type Actor = Thing & {
  isActor:boolean
  facing:FacingDir
  hurtFrames:number
  holding?:Thing
}

const defaultThing:Thing = {
  pos: vec3(0, 0, 0),
  last: vec3(0, 0, 0),
  vel: 0,
  zVel: 0,
  angle: 0,
  size: vec3(16, 16, 16),
  gravityFactor: 1,
  dead: false,
  health: 1,
  type: ThingType.Nothing,
  state: ThingState.None,
  stateTime: 0,
  offset: vec2(0, 0),
  animsLength: 1,
  bounce: 0.0,
  held: false,
  isActor: false
}

const thingData:{ [index: number]:Thing } = {
  [ThingType.Rock]: {
    ...defaultThing,
    size: vec3(3, 3, 3),
    offset: vec2(6, 6),
    animsLength: 2,
    gravityFactor: 1,
    bounce: 0.5,
    health: 5,
  }, [ThingType.Ball]: {
    ...defaultThing,
    size: vec3(4, 4, 4),
    offset: vec2(6, 6),
    animsLength: 2,
    gravityFactor: 1,
    bounce: 0.9,
    health: Infinity,
  }
}

const defaultActor:Actor = {
  ...defaultThing,
  isActor: true,
  facing: FacingDir.Down,
  hurtFrames: 0
}

const actorData: { [index:number]: Actor } = {
  [ThingType.Guy]: {
    ...defaultActor,
    offset: vec2(4, 8),
    size: vec3(8, 8, 8),
    animsLength: 10,
    health: 10
  }, [ThingType.Greenguy]: {
    ...defaultActor,
    offset: vec2(4, 8),
    size: vec3(8, 8, 8),
    animsLength: 3,
    health: 3
  }
}

export const newThing = (type:ThingType, pos:Vec3, angle:number = 0, held:boolean = false, vel?:number, zVel?:number):Thing => {
  const data = thingData[type]

  return {
    ...data,
    type,
    pos,
    last: clone3(pos),
    vel: vel || 0,
    zVel: zVel || 0,

    state: held ? ThingState.None : ThingState.Moving,
    // stateTime: 0,

    angle,
    held
  }
}

export const newActor = (type:ThingType, pos:Vec3):Actor => {
  const data = actorData[type]

  return {
    ...data,
    type,
    pos,
    last: clone3(pos)
  }
}

export const centerX = (thing:Thing):number => thing.pos.x + thing.size.x / 2
export const centerY = (thing:Thing):number => thing.pos.y + thing.size.y / 2
export const bottomY = (thing:Thing):number => thing.pos.y + thing.size.y

export const throwPos = (actor:Actor):Vec3 => {
  switch (actor.facing) {
    case FacingDir.Left: return vec3(centerX(actor) - 6, centerY(actor) - 6, actor.pos.z + 6)
    case FacingDir.Right: return vec3(centerX(actor) + 6, centerY(actor) + 6, actor.pos.z + 6)
    case FacingDir.Up: return vec3(centerX(actor) + 6, centerY(actor) - 6, actor.pos.z + 6)
    case FacingDir.Down: return vec3(centerX(actor) - 6, centerY(actor) + 6, actor.pos.z + 6)
    default: throw new Error('Bad facing dir')
  }
}

export const holdPos = (actor:Actor):Vec3 => {
  switch (actor.facing) {
    case FacingDir.Left: return vec3(centerX(actor), centerY(actor) - 6, actor.pos.z + 6)
    case FacingDir.Right: return vec3(centerX(actor), centerY(actor) + 6, actor.pos.z + 6)
    case FacingDir.Up: return vec3(centerX(actor) + 6, centerY(actor), actor.pos.z + 6)
    case FacingDir.Down: return vec3(centerX(actor) - 6, centerY(actor), actor.pos.z + 6)
    default: throw new Error('Bad facing dir')
  }
}

export const pickupPos = (actor:Actor):Vec2 => {
  switch (actor.facing) {
    case FacingDir.Left: return vec2(centerX(actor) - 16 - 8, centerY(actor) - 8)
    case FacingDir.Right: return vec2(centerX(actor) + 16 - 8, centerY(actor) - 8)
    case FacingDir.Up: return vec2(centerX(actor) - 8, centerY(actor) - 16 - 8)
    case FacingDir.Down: return vec2(centerX(actor) - 8, centerY(actor) + 16 - 8)
    default: throw new Error('Bad facing dir')
  }
}

export const dropPos = (actor:Actor):Vec2 => {
  switch (actor.facing) {
    case FacingDir.Left: return vec2(centerX(actor) - 8, centerY(actor))
    case FacingDir.Right: return vec2(centerX(actor) + 8, centerY(actor))
    case FacingDir.Up: return vec2(centerX(actor), centerY(actor) - 8)
    case FacingDir.Down: return vec2(centerX(actor), centerY(actor) + 8)
    default: throw new Error('Bad facing dir')
  }
}

export const facingAngle = (facing:FacingDir):number => {
  switch (facing) {
    case FacingDir.Left: return 180
    case FacingDir.Right: return 0
    case FacingDir.Up: return 270
    case FacingDir.Down: return 90
    default: throw new Error('Bad facing dir')
  }
}

export const setState = (thing:Thing, state:ThingState) => {
  thing.stateTime = 0
  thing.state = state
}

export const hurtActor = (actor:Actor) => {
  if (actor.hurtFrames === 0) {
    actor.health--
    setState(actor, ThingState.Hurt)
    actor.hurtFrames = 30
  }
}

export const pickupTypes = [ThingType.Rock, ThingType.Ball]
