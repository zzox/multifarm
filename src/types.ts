export enum FacingDir {
  Left,
  Right,
  Up,
  Down
}

export type Vec3 = {
  x:number
  y:number
  z:number
}

export type Vec2 = {
  x:number
  y:number
}

export type Square = {
  x:number
  y:number
  w:number
  h:number
}

export type Collides = {
  left:boolean
  right:boolean
  up:boolean
  down:boolean
}

export const vec3 = (x:number, y:number, z:number):Vec3 => ({ x, y, z })
export const vec2 = (x:number, y:number):Vec2 => ({ x, y })
export const sq = (x:number, y:number, w:number, h:number):Square => ({ x, y, w, h })

export const clone3 = (vec:Vec3) => vec3(vec.x, vec.y, vec.z)

export const collides = (left = true, right = true, up = true, down = true):Collides =>
  ({ left, right, up, down })
