import { copyArray, makeArray } from '../util/utils'

export type Grid<T> = {
  width:number
  height:number
  items:T[]
}

export const makeGrid = <T>(width:number, height:number, initialValue:T):Grid<T> => ({
  width: width,
  height: height,
  items: makeArray(width * height, initialValue)
})

export const forEachGI = <T>(grid:Grid<T>, callback:(x:number, y:number, item:T) => void) => {
  for (let x = 0; x < grid.width; x++) {
    for (let y = 0; y < grid.height; y++) {
      callback(x, y, grid.items[x + y * grid.width])
    }
  }
}

const mapGI = <T, TT>(grid:Grid<T>, callback:(x:number, y:number, item:T) => TT):Grid<TT> => {
  const items:TT[] = []
  // ATTN: these are flipped so they are pushed to be accessed by grid.items[x + y * grid.width];
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      items.push(callback(x, y, grid.items[x + y * grid.width]))
    }
  }

  return {
    width: grid.width,
    height: grid.height,
    items: items
  }
}

export const getGridItem = <T>(grid:Grid<T>, x:number, y:number):T | undefined => {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) {
    return
  }

  return grid.items[x + y * grid.width]
}

export const setGridItem = <T>(grid:Grid<T>, x:number, y:number, item:T) => {
  grid.items[x + y * grid.width] = item
}

const gridFromItems = <T>(width:number, height:number, items:Array<T>):Grid<T> => {
  return {
    width: width,
    height: height,
    items: items
  }
}

const copyGrid = <T>(grid:Grid<T>):Grid<T> => {
  return {
    width: grid.width,
    height: grid.height,
    items: copyArray(grid.items)
  }
}
