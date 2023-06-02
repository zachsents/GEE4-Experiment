import { bufferIntoArray } from "./buffer.js"
import { combineObject } from "./combine.js"


/**
 * Factory for a generator that runs a batch operation.
 *
 * @export
 * @param {() => (any | Promise<any>)} operation
 */
export function batch(operation) {
    return async function* (inputsObj) {
        const inputsGenerator = combineObject(inputsObj)
        const buffer = await bufferIntoArray(inputsGenerator)

        yield await operation(buffer)
    }
}


/**
 * Factory for a generator that runs a batch operation on a single input.
 *
 * @export
 * @param {string} key
 * @param {() => (any | Promise<any>)} operation
 */
export function batchUnary(key, operation) {
    return async function* (inputsObj) {
        const buffer = await bufferIntoArray(inputsObj[key])

        yield await operation(buffer)
    }
}