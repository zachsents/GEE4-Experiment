import { EventEmitter } from "events"
import { Subject, fromEvent, mergeMap, of, share, tap, toArray } from "rxjs"

const events = ["pee pee", "poo poo"]


// From event
const ee = new EventEmitter()
const ev = fromEvent(ee, "start")
const evSubscriber = ev.subscribe(x => console.log("ev sub 1 (regular):", x))
evSubscriber.add(
    ev.pipe(toArray()).subscribe(x => console.log("ev sub 2 (cum):", x))
)


// With subject
const subj = new Subject()
subj.subscribe(x => console.log("subj sub 1 (regular):", x))
subj.pipe(toArray()).subscribe(x => console.log("subj sub 2 (cum):", x))


let intervalId = setInterval(() => {
    if (events.length === 0) {
        subj.complete()
        evSubscriber.unsubscribe()
        return clearInterval(intervalId)
    }

    const event = events.pop()
    console.log("emitting", event)
    ee.emit("start", event)
    subj.next(event)
}, 1000)