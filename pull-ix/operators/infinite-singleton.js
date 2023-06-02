import { AsyncIterable } from "ix"


export class InfiniteSingletonAsyncIterable extends AsyncIterable {

    /**
     * Creates an instance of InfiniteSingletonAsyncIterable.
     * @param {(index: number) => (Promise | *) | *} createValue
     * @memberof InfiniteSingletonAsyncIterable
     */
    constructor(createValue) {
        super()
        this.createValue = typeof createValue === "function" ?
            createValue :
            () => createValue
    }

    [Symbol.asyncIterator]() {
        let index = 0

        return {
            next: async () => {
                return {
                    // return done after the first value, but keep generating values
                    value: await this.createValue(index),
                    done: index++ > 0,
                }
            }
        }
    }
}



/**
 * Creates an AsyncIterable that is marked done after the first value,
 * but continues to generate values if yanked on.
 *
 * @export
 * @param {(index: number) => (Promise | *) | *} createValue
 */
export function infSingle(createValue) {
    return new InfiniteSingletonAsyncIterable(createValue)
}