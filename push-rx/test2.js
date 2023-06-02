import { EventEmitter } from "events"
import { Subject, fromEvent, takeUntil, toArray } from "rxjs"


// From event
const ee = new EventEmitter()
const stop$ = new Subject()
const ev = fromEvent(ee, "start").pipe(takeUntil(stop$))
// const subscriber = ev.subscribe(x => console.log("ev sub 1 (regular):", x))
const subscriber = ev.pipe(toArray()).subscribe(x => console.log("ev sub 2 (cum):", x))

ee.emit("start", "pee pee")
setTimeout(() => ee.emit("start", "poo poo"), 1000)
setTimeout(() => stop$.next(), 2000)



