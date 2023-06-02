import { merge } from "ix/asynciterable/merge.js"
import { infSingle } from "./operators/infinite-singleton.js"
import { zipObject } from "./operators/zip.js"
import { fromState } from "./provider-factories/from-state.js"
import readline from "readline"
import { empty } from "ix/asynciterable/empty.js"


const rawDefinitions = {
    trigger: {
        id: "trigger",

        outputs: {
            subject: fromState("subject"),
            number1: fromState("number1"),
            number2: fromState("number2"),
        },

        handlers: {
            "gmail.emailReceived": function (payload) {
                this.state.subject = payload.subject
                this.state.number1 = payload.number1
                this.state.number2 = payload.number2
            },
        }
    },

    capitalize: {
        id: "capitalize",

        inputs: ["input"],

        outputs: {
            out: ({ inputs: { input } }) => input.map(x => x.toUpperCase()),
        },
    },

    lowercase: {
        id: "lowercase",

        inputs: ["input"],

        outputs: {
            out: ({ inputs: { input } }) => input.map(x => x.toLowerCase()),
        },
    },

    singlePrint: {
        id: "singlePrint",

        inputs: {
            input: {
                multipleStrategy: merge,
            }
        },

        body: ({ inputs: { input } }) => input.tap(console.log),
    },

    batchPrint: {
        id: "batchPrint",

        inputs: {
            input: {
                multipleStrategy: merge,
            }
        },

        body: ({ inputs: { input } }) => input
            .buffer(Infinity)
            .tap(console.log)
        ,
    },

    add: {
        id: "add",

        inputs: ["a", "b"],

        outputs: {
            out: ({ inputs }) => zipObject(inputs)
                .map(async ({ a, b }) => a + b)
                .delayEach(500)
        }
    },

    generateId: {
        id: "generateId",

        outputs: {
            id: () => infSingle(() => Math.random().toString(16).slice(2, 8)),
        }
    },

    loadTable: {
        id: "loadTable",

        inputs: ["url", "sheet"],

        body: ({ inputs }) => zipObject(inputs)
            .take(1)
            .map(({ url, sheet }) => ({ _type: "table", url, sheet })),

        outputs: {
            table: ({ body }) => body,
        }
    },

    waitForResponse: {
        id: "waitForResponse",

        inputs: ["input"],

        body: function ({ inputs }) {
            // We've received the response, provide it
            if (this.state.message !== undefined)
                return infSingle(this.state.message)

            // We haven't received the response yet, so do the action
            inputs.input.take(1).forEach(x => {
                global.rl.question(`Do you approve of this: "${x}"? `, (answer) => {
                    this.state.message = answer
                })
            })

            return empty()
        },

        outputs: {
            message: ({ body }) => body,
        },

        handlers: {
            "gmail.responseReceived": function (payload) {
                this.state.message = payload.message
            },
        }
    }
}


// Process shorthands
export const definitions = mapObject(rawDefinitions, definition => {

    // Fill missing properties
    definition.inputs ??= {}
    definition.outputs ??= {}

    // Convert array of strings for inputs to object with empty objects as values
    if (Array.isArray(definition.inputs))
        definition.inputs = Object.fromEntries(definition.inputs.map(input => [input, {}]))

    // If just a function is provided for the body, convert to provider
    if (typeof definition.body === "function")
        definition.body = { provider: definition.body }

    // Do the same for each output
    definition.outputs = mapObject(definition.outputs, output =>
        typeof output === "function" ?
            { provider: output } :
            output
    )

    return definition
})


function mapObject(obj, func) {
    return Object.fromEntries(
        Object.entries(obj)
            .map(([key, value]) => [key, func(value, key)])
    )
}