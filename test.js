import { AsyncIterable } from "ix"
import { infSingle } from "./pull-ix/operators/infinite-singleton.js"
import { zipAll, zipObject } from "./pull-ix/operators/zip.js"


const a = AsyncIterable.of(3, 5, 13, 8, 340, 23)
const b = AsyncIterable.of(4, 6, 14, 9, 341, 24, 34, 95, 2, 43)


const c = infSingle(() => Math.random().toString(16).slice(2, 8))
const d = infSingle(3)


const inputs = { a, b, c, d }


zipObject(inputs, true, ["a", "c"]).forEach(console.log)