

/**
 * Combines multiple generators into one, where each value from each generator
 * is grouped together in an array.
 *
 * @export
 * @param {Array<Generator | AsyncGenerator>} generators
 */
export async function* combine(...generators) {
    while (true) {
        const slices = await Promise.all(generators.map(generator => generator.next()))

        if (slices.every(slice => slice.done))
            return

        // debating whether or not I should filter out the done slices

        yield slices.map(slice => slice.value)
    }
}

// Test

// function* test(length) {
//     for (let i = 0; i < length; i++)
//         yield i * length
//     // yield Math.floor(Math.random() * 100)
// }

// const combined = combine(test(3), test(10), test(5))
// for await (const value of combined)
//     console.log(value)


/**
 * Combines multiple generators into one, where we have a key for each generator
 * and the value is the value of the generator.
 *
 * @export
 * @param {Object.<string, Generator | AsyncGenerator>} generatorsObj
 */
export async function* combineObject(generatorsObj) {
    while (true) {
        const slices = await Promise.all(
            Object.values(generatorsObj).map(generator => generator.next())
        )

        if (slices.every(slice => slice.done))
            return

        yield Object.fromEntries(
            slices.map((slice, index) => [Object.keys(generatorsObj)[index], slice.value])
        )
    }
}

// Test

// function* test(length) {
//     for (let i = 0; i < length; i++)
//         yield i * length
// }

// const combined = combineObject({
//     a: test(3),
//     b: test(10),
//     c: test(4),
// })

// for await (const value of combined)
//     console.log(value)