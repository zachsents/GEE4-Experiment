

/**
 * Buffers a generator into an array and yields that array.
 *
 * @export
 * @param {Generator | AsyncGenerator} generator
 */
export async function* buffer(generator) {
    yield await bufferIntoArray(generator)
}


/**
 * Buffers a generator into an array.
 *
 * @export
 * @param {Generator | AsyncGenerator} generator
 */
export async function bufferIntoArray(generator) {
    const buffer = []

    for await (const value of generator)
        buffer.push(value)

    return buffer
}