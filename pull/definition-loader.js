import { batchUnary } from "./generators/batch.js"
import { single, singleUnary } from "./generators/single.js"
import { roundRobinStream } from "./generators/stream.js"


const trigger = {
    id: "trigger",

    inputs: {},

    sources: {
        subject: {
            provider: async function* () {
                yield* ["This is the Subject", "aNother Subject", "Subject 3"]
            },
        },
        number1: {
            provider: async function* () {
                yield 6
            },
        },
        number2: {
            provider: async function* () {
                yield 9
            },
        },
    }
}

const capitalize = {
    id: "capitalize",

    inputs: {
        input: {}
    },

    sources: {
        out: {
            provider: singleUnary("input", value => value.toUpperCase()),
        },
    },
}

const lowercase = {
    id: "lowercase",

    inputs: {
        input: {}
    },

    sources: {
        out: {
            provider: singleUnary("input", value => value.toLowerCase()),
        },
    },
}

const singlePrint = {
    id: "singlePrint",

    inputs: {
        input: {
            multipleStrategy: roundRobinStream,
        }
    },

    body: {
        provider: singleUnary("input", value => console.log(value) || value),
    },

    sources: {},
}

const batchPrint = {
    id: "batchPrint",

    inputs: {
        input: {
            multipleStrategy: roundRobinStream,
        }
    },

    body: {
        provider: batchUnary("input", values => console.log(values) || values),
    },

    sources: {},
}

const add = {
    id: "add",

    inputs: {
        a: {},
        b: {},
    },

    sources: {
        out: {
            provider: single(({ a, b }) => new Promise(resolve => setTimeout(() => resolve(a + b), 500)))
        }
    }
}

const generateId = {
    id: "generateId",

    inputs: {},
    sources: {
        id: {
            provider: async function* () {
                let i = 1
                while (true) {
                    yield i++
                }
            },
        },
    }
}

export const definitions = {
    trigger,
    capitalize,
    lowercase,
    singlePrint,
    batchPrint,
    add,
    generateId,
}