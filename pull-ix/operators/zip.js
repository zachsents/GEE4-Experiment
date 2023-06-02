import { AsyncIterable } from "ix"
import { zip } from "ix/asynciterable/zip.js"


/**
 * @typedef {object} ZipOptions
 * @property {boolean} [includeUndefined=true]
 */


/**
 * Zips multiple AsyncIterables into a single AsyncIterable with array elements containing
 * elements from each constituent.
 * 
 * The original zip operator stops when the shortest iterable is exhausted. This version
 * will continue until all iterables are exhausted. If an iterable is exhausted, the
 * value will be undefined.
 * 
 * @export
 * @param {...AsyncIterable} sources
 */
export function zipAll(...sources) {
    return AsyncIterable.from(
        (async function* () {
            const iterators = sources.map(source => source[Symbol.asyncIterator]())

            while (true) {
                const slices = await Promise.all(iterators.map(iterator => iterator.next()))

                if (slices.every(({ done }) => done))
                    break

                yield slices.map(({ value }) => value)
            }
        })()
    )
}


/**
 * Zips an object with AsyncIterable values into an AsyncIterable of objects.
 *
 * @param {Object.<string, AsyncIterable>} obj
 * @param {boolean} [all=true] Whether to exhaust all iterables or stop at the shortest. Defaults to true.
 * @param {string[]} [keys] The keys to include in the output. Defaults to all keys in the object.
 */
export function zipObject(obj, all = true, keys) {
    keys ??= Object.keys(obj)
    const iterables = keys.map(key => obj[key])

    const zipFunc = all ? zipAll : zip

    return zipFunc(...iterables)
        .map(values => Object.fromEntries(keys.map((key, index) => [key, values[index]])))
}
