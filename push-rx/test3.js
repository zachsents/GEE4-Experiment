import { from, map, mergeMap, of, toArray } from "rxjs"
import { zipObject } from "./operator-factories/zip-object.js"


const a$ = of(1, 2, 3, 4)
const b1$ = of("a", "b", "c", "d")
const b2$ = of("a", "b")
const b3$ = of("a")

