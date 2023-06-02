
/**
 * Factory for a generator that can be consumed by multiple consumers,
 * and each consumer will receive the same values.
 *
 * @export
 * @param {Generator | AsyncGenerator} generator
 * @param {...any} args
 */
export function multicast(generator) {

    const slices = []

    return async function* () {
        let index = 0

        while (true) {
            slices[index] ??= generator.next()
            const { value, done } = await slices[index]

            if (done) return

            yield value
            index++
        }
    }
}


// Test

// async function* test() {
//     for (let i = 0; i < 3; i++)
//         yield Math.floor(Math.random() * 100)
// }

// async function consume(gen, prefix) {
//     const { value, done } = await gen.next()

//     if (done)
//         return

//     console.log(prefix, value)
//     await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000)))
//     return consume(gen, prefix)
// }

// console.log("\nBefore multicast:")
// await Promise.all([
//     consume(test(), "consumer 1:"),
//     consume(test(), "consumer 2:"),
// ])

// console.log("\nAfter multicast:")

// const multi = multicast(test())

// await Promise.all([
//     consume(multi(), "consumer 1:"),
//     consume(multi(), "consumer 2:"),
// ])