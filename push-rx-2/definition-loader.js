
/**
 * @typedef {object} Task
 * 
 * @property {string[]} dependencies
 * @property {function} handler Arguments are the dependencies in the same order. Return value is an object of outputs. If Observables are returned, they will be flattened in the connected targets (input handles).
 */

/**
 * @typedef {object} NodeDefinition
 * 
 * @property {string} id
 * 
 * @property {string[]} inputs
 * @property {string[]} outputs
 * 
 * @property {Task[]} tasks
 */

import { map } from "rxjs"


/** @type {Object.<string, NodeDefinition>} */
const rawDefinitions = {
    trigger: {
        id: "trigger",

        inputs: [],
        outputs: ["subject"],

        tasks: [
            {
                dependencies: ["event:gmail.emailReceived"],
                handler: (event) => ({ subject: event.subject })
            }
        ],
    },

    number: {
        id: "number",

        inputs: [],
        outputs: ["value"],

        $: function () {
            return { value: this.data.state.$ }
        },
    },

    capitalize: {
        id: "capitalize",

        inputs: ["input"],
        outputs: ["out"],

        tasks: [
            {
                dependencies: ["input"],
                handler: input$ => ({
                    out: input$.pipe(map(x => x.toUpperCase()))
                }),
            }
        ]
    },

    lowercase: {
        id: "lowercase",

        inputs: ["input"],
        outputs: ["out"],

        tasks: [
            {
                dependencies: ["input"],
                handler: input$ => ({
                    out: input$.pipe(map(x => x.toLowerCase()))
                }),
            }
        ]
    },

    singlePrint: {
        id: "singlePrint",

        inputs: ["input"],
        outputs: [],

        tasks: [
            {
                dependencies: ["input"],
                // if we're not gonna output anything, we need to subscribe to the input
                handler: input$ => {
                    input$.subscribe(x => console.log("[Single!]", x))
                },
            },
        ]
    },

    // batchPrint: {
    //     id: "batchPrint",

    //     inputs: ["input"],
    //     outputs: [],

    //     inputHandlers: [
    //         ({ input }) => input.pipe(
    //             toArray(),
    //             map(x => console.log("[Batch!]", x))
    //         )
    //     ],
    // },

    // add: {
    //     id: "add",

    //     inputs: ["a", "b"],
    //     outputs: ["sum"],

    //     inputHandlers: [
    //         (inputs) => zipObject(inputs).pipe(
    //             mergeMap(({ a, b }) => Promise.resolve(({ sum: a + b }))),
    //             delay(500),
    //         )
    //     ]
    // },

    // generateId: {
    //     id: "generateId",

    //     outputs: {
    //         id: () => infSingle(() => Math.random().toString(16).slice(2, 8)),
    //     }
    // },

    // loadTable: {
    //     id: "loadTable",

    //     inputs: ["url", "sheet"],
    //     outputs: ["table"],

    //     inputHandlers: [
    //         (inputs) => zipObject(inputs).pipe(
    //             map(({ url, sheet }) => ({ table: { _type: "table", url, sheet } }))
    //         )
    //     ],
    // },

    // waitForResponse: {
    //     id: "waitForResponse",

    //     inputs: ["question"],
    //     outputs: ["answer"],

    //     inputHandlers: [
    //         function (inputs) {
    //             return zipObject(inputs).pipe(
    //                 map(({ question }) => {
    //                     const rl = readline.createInterface({
    //                         input: process.stdin,
    //                         output: process.stdout
    //                     })

    //                     setTimeout(() => {
    //                         rl.question(`Do you approve of this: "${question}"? `, (answer) => {
    //                             // this.graph.resume("gmail.responseReceived", { message: answer })
    //                             // this.graph.emit("gmail.responseReceived", { message: answer })
    //                             global.fire({ message: answer })
    //                             rl.close()
    //                         })
    //                     }, 1000)
    //                 })
    //             )
    //         }
    //     ],

    //     eventHandlers: {
    //         "gmail.responseReceived": [
    //             map(({ message }) => ({ answer: message }))
    //         ],
    //     },
    // },
}


// Process shorthands
export const definitions = mapObject(rawDefinitions, definition => {

    // Fill missing properties
    definition.inputs ??= []
    definition.outputs ??= []
    definition.tasks ??= []

    // Copy the $ property as a "flow.start" event handler
    if (definition.$)
        definition.tasks.push({
            dependencies: ["event:flow.start"],
            handler: definition.$,
        })

    return definition
})


function mapObject(obj, func) {
    return Object.fromEntries(
        Object.entries(obj)
            .map(([key, value]) => [key, func(value, key)])
    )
}