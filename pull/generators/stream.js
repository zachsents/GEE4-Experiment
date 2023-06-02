

/**
 * Combines multiple generators into one stream, where each value comes alternatingly
 * from each generator.
 *
 * @export
 * @param {Array<Generator | AsyncGenerator>} generators
 */
export async function* roundRobinStream(...generators) {
    while (true) {
        const slices = await Promise.all(generators.map(generator => generator.next()))

        if (slices.every(slice => slice.done))
            return

        for (const slice of slices)
            if (!slice.done)
                yield slice.value
    }
}

// Test

// function* test1() { yield* [1, 2] }
// function* test2() { yield* ["xxx", "yyy", "zzz"] }
// function* test3() { yield* ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] }

// const roundRobined = roundRobinStream(test1(), test2(), test3())

// for await (const value of roundRobined)
//     console.log(value)


/**
 * Combines multiple generators into one stream, where each value comes from the
 * generator that's next in the array.
 *
 * @export
 * @param {Array<Generator | AsyncGenerator>} generators
 */
export async function* groupedStream(...generators) {
    for (const generator of generators)
        yield* generator
}

// Test

// function* test1() { yield* [1, 2] }
// function* test2() { yield* ["xxx", "yyy", "zzz"] }
// function* test3() { yield* ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] }

// const grouped = groupedStream(test1(), test2(), test3())

// for await (const value of grouped)
//     console.log(value)