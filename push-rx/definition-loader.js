import readline from "readline"
import { Observable, delay, map, mergeMap, toArray } from "rxjs"
import { zipObject } from "./operator-factories/zip-object.js"


/**
 * @typedef {Array<import("rxjs").OperatorFunction>} Pipeline
 */


/**
 * @typedef {object} NodeDefinition
 * 
 * @property {string} id
 * 
 * @property {string[]} inputs
 * @property {Array<(inputObservables: Object.<string, Observable>) => Observable<object>>} inputHandlers
 * 
 * @property {string[]} outputs
 * 
 * @property {Object.<string, Pipeline | ((event$: Observable) => Observable<object>)>} eventHandlers
 * 
 * @property {() => Observable<object>} $ Alias for an event handler pipeline for the "flow.start" event
 * of this form: [map(yourFunction)]. This will overwrite any existing "flow.start" event handler.
 */


/** @type {Object.<string, NodeDefinition>} */
const rawDefinitions = {
    trigger: {
        id: "trigger",

        inputs: [],
        outputs: ["subject"],

        eventHandlers: {
            "gmail.emailReceived": [
                map(({ subject }) => ({ subject }))
            ],
        }
    },

    number: {
        id: "number",

        inputs: [],
        outputs: ["value"],

        $: function () {
            return ({ value: this.state.$ })
        },
    },

    capitalize: {
        id: "capitalize",

        inputs: ["input"],
        outputs: ["out"],

        inputHandlers: [
            ({ input }) => input.pipe(
                map(x => ({ out: x.toUpperCase() }))
            )
        ]
    },

    lowercase: {
        id: "lowercase",

        inputs: ["input"],
        outputs: ["out"],

        inputHandlers: [
            ({ input }) => input.pipe(
                map(x => ({ out: x.toLowerCase() }))
            )
        ],
    },

    singlePrint: {
        id: "singlePrint",

        inputs: ["input"],
        outputs: [],

        inputHandlers: [
            ({ input }) => input.pipe(
                map(x => console.log("[Print!]", x))
            )
        ],
    },

    batchPrint: {
        id: "batchPrint",

        inputs: ["input"],
        outputs: [],

        inputHandlers: [
            ({ input }) => input.pipe(
                toArray(),
                map(x => console.log("[Batch!]", x))
            )
        ],
    },

    add: {
        id: "add",

        inputs: ["a", "b"],
        outputs: ["sum"],

        inputHandlers: [
            (inputs) => zipObject(inputs).pipe(
                mergeMap(({ a, b }) => Promise.resolve(({ sum: a + b }))),
                delay(500),
            )
        ]
    },

    // generateId: {
    //     id: "generateId",

    //     outputs: {
    //         id: () => infSingle(() => Math.random().toString(16).slice(2, 8)),
    //     }
    // },

    loadTable: {
        id: "loadTable",

        inputs: ["url", "sheet"],
        outputs: ["table"],

        inputHandlers: [
            (inputs) => zipObject(inputs).pipe(
                map(({ url, sheet }) => ({ table: { _type: "table", url, sheet } }))
            )
        ],
    },

    waitForResponse: {
        id: "waitForResponse",

        inputs: ["question"],
        outputs: ["answer"],

        inputHandlers: [
            function (inputs) {
                return zipObject(inputs).pipe(
                    map(({ question }) => {
                        const rl = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout
                        })

                        setTimeout(() => {
                            rl.question(`Do you approve of this: "${question}"? `, (answer) => {
                                // this.graph.resume("gmail.responseReceived", { message: answer })
                                // this.graph.emit("gmail.responseReceived", { message: answer })
                                global.fire({ message: answer })
                                rl.close()
                            })
                        }, 1000)
                    })
                )
            }
        ],

        eventHandlers: {
            "gmail.responseReceived": [
                map(({ message }) => ({ answer: message }))
            ],
        },
    },
}


// Process shorthands
export const definitions = mapObject(rawDefinitions, definition => {

    // Fill missing properties
    definition.inputs ??= []
    definition.outputs ??= []
    definition.inputHandlers ??= []
    definition.eventHandlers ??= {}

    // Copy the $ property to the "flow.start" event handler
    if (definition.$)
        definition.eventHandlers["flow.start"] = function (event$) {
            return event$.pipe(map(definition.$.bind(this)))
        }

    // If an array is provided for an event handler, convert it to a pipeline
    definition.eventHandlers = mapObject(definition.eventHandlers,
        handler => Array.isArray(handler) ?
            function (event$) {
                return event$.pipe(...handler)
            } :
            handler
    )

    return definition
})


function mapObject(obj, func) {
    return Object.fromEntries(
        Object.entries(obj)
            .map(([key, value]) => [key, func(value, key)])
    )
}