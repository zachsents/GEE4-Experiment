import { AsyncIterable } from "ix"


export class MulticastedAsyncIterable extends AsyncIterable {

    /**
     * Creates an instance of MulticastedAsyncIterable.
     * @param {AsyncIterable} source
     * @memberof MulticastedAsyncIterable
     */
    constructor(source) {
        super()

        // only one iterator is ever created from the source
        this.iterator = source[Symbol.asyncIterator]()

        // for cached slices
        this.slices = []
    }

    /**
     * Returns an AsyncIterator that will iterate over the source.
     *
     * @memberof MulticastedAsyncIterable
     */
    [Symbol.asyncIterator]() {
        let index = 0

        return {
            next: async () => {
                // only create a new slice if one doesn't exist
                this.slices[index] ??= this.iterator.next()

                return this.slices[index++]
            }
        }
    }
}

/**
 * Creates an AsyncIterable that can be iterated over multiple times.
 * Whenever its iterated over, it will start from the beginning of the source,
 * but values will be cached so that the source is only iterated over once.
 *
 * @export
 * @param {AsyncIterable} source
 */
export function multicast(source) {
    return new MulticastedAsyncIterable(source)
}