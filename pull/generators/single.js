import { combineObject } from "./combine.js"


/**
 * Factory for a generator that runs an operation on a single set of inputs.
 *
 * @export
 * @param {() => (any | Promise<any>)} operation
 */
export function single(operation) {
    return async function* (inputsObj) {
        const inputsGenerator = combineObject(inputsObj)

        for await (const inputs of inputsGenerator)
            yield await operation(inputs)
    }
}

// Test

// async function* test() {
//     yield await Promise.resolve("HelLo")
//     yield await Promise.resolve("WorLd")
//     yield await Promise.resolve("People")
// }

// const gen = single(({ str }) => str.toUpperCase())({ str: test() })
// for await (const value of gen)
//     console.log(value)


/**
 * Factory for a generator that runs an operation on a single input.
 *
 * @export
 * @param {string} key
 * @param {() => (any | Promise<any>)} operation
 */
export function singleUnary(key, operation) {
    return async function* (inputsObj) {
        for await (const value of inputsObj[key])
            yield await operation(value)
    }
}

// async function* test() {
//     yield await Promise.resolve("HelLo")
//     yield await Promise.resolve("WorLd")
//     yield await Promise.resolve("People")
// }

// const gen = singleUnary("str", str => str.toLowerCase())({ str: test() })
// for await (const value of gen)
//     console.log(value)