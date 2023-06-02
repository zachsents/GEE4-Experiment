import { EMPTY, Observable } from "rxjs"


export function zipTrack(...sources) {

    if (!sources.length)
        return [EMPTY, EMPTY]

    const zipped$ = new Observable(subscriber => {
        const buffers = sources.map(() => [])
        const complete = sources.map(() => false)

        sources.forEach((source, i) => {
            source.subscribe({
                next: value => {
                    // Add value to buffer
                    buffers[i].push(value)

                    // Check if all arrays have at least one value
                    if (buffers.every(buffer => buffer.length)) {
                        // Emit the zipped value off the front of the buffers
                        subscriber.next(buffers.map(buffer => buffer.shift()))
                    }
                },
                complete: () => {
                    complete[i] = true

                    // Check if all sources are complete
                    if (complete.every(c => c))
                        subscriber.complete()
                },
            })
        })
    })

    const remainder$ = new Observable(subscriber => {
        const buffers = sources.map(() => [])
        const complete = sources.map(() => false)

        sources.forEach((source, i) => {
            source.subscribe({
                next: value => {
                    // Add value to buffer
                    buffers[i].push(value)

                    // Check if all arrays have at least one value
                    if (buffers.every(buffer => buffer.length))
                        // Remove the zipped value off the front of the buffers
                        buffers.forEach(buffer => buffer.shift())
                },
                complete: () => {
                    complete[i] = true

                    // Check if all sources are complete
                    if (complete.every(c => c)) {
                        // Zip the remaining values
                        const longest = Math.max(...buffers.map(buffer => buffer.length))

                        for (let i = 0; i < longest; i++) {
                            subscriber.next(buffers.map(buffer => buffer.shift()))
                        }
                        subscriber.complete()
                    }
                },
            })
        })
    })

    return [zipped$, remainder$]
}
