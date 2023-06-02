import { EMPTY, Subject, filter, from, map, mergeMap, of, reduce, zipAll } from "rxjs"
import { definitions } from "./definition-loader.js"
import { mergeMixedAll } from "./merge-mixed-all.js"
import { testGraph } from "./test-graph.js"
import { zipTrack } from "./zip-track.js"

const EVENT_PREFIX = "event:"

const ee$ = new Subject()

console.log()

// Set up subjects for each edge
const edges = testGraph.edges.map(edge => ({
    ...edge,
    $: new Subject(),
}))

// Make each task subscribe to its dependencies and emit to its outputs
testGraph.nodes.forEach(node => {
    /** @type {import("./definition-loader.js").NodeDefinition} */
    const def = definitions[node.type]

    def.tasks.forEach(({ dependencies, handler }) => {
        const deps$ = dependencies.map(dep => {
            // Events
            if (dep.startsWith(EVENT_PREFIX)) {
                const eventName = dep.slice(EVENT_PREFIX.length)
                return ee$.pipe(
                    filter(event => event.type == eventName),
                    map(event => event.data),
                )
            }

            // Inputs
            // We're not tracking remainders for multiple inputs
            // to one handle yet. To do this, we should convert
            // the deps$ map op to a flatMap, return an array here,
            // and then do all the combining in the next step.
            return from(edges).pipe(
                filter(edge => edge.target == node.id && edge.targetHandle == dep),
                map(edge => edge.$),
                zipAll(),
                map(values => from(values).pipe(
                    mergeMixedAll(),
                )),
            )
        })

        // Zip -- keep remainders for resuming later
        const [zipped, remainder] = zipTrack(...deps$)
        remainder.subscribe(console.log)

        // Pipe to handler and emit to outputs
        zipped.pipe(
            map(zipped => handler.call(node, ...zipped)),
            mergeMap(result => result ? from(Object.entries(result)) : EMPTY),
        ).subscribe(([output, value]) => {
            edges
                .filter(edge => edge.source == node.id && edge.sourceHandle == output)
                .forEach(edge => {
                    edge.$.next(value)
                    // for now, we'll complete the edge after 1 emission
                    edge.$.complete()
                })
        })
    })
})

// Accumulate edge values
from(edges).pipe(
    mergeMap(edge => edge.$.pipe(
        mergeMixedAll(),
        reduce((acc, value) => {
            acc[1].push(value)
            return acc
        }, [
            `${edge.source}:${edge.sourceHandle} -> ${edge.target}:${edge.targetHandle}`,
            []
        ]),
    )),
    reduce((acc, [key, values]) => ({ ...acc, [key]: values }), {}),
).subscribe(console.log)

// Fire events
of({
    type: "gmail.emailReceived",
    data: {
        subject: "Hello",
    },
}, {
    type: "flow.start",
    data: {},
}).subscribe(ee$)