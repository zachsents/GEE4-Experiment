import { map, zip } from "rxjs"


/**
 * Creates an operator function that zips the passed object with Observable
 * values into an Observable that emits objects with the same keys as the
 * passed object, but with values from the passed Observables.
 *
 * @export
 * @param {Object.<string, import("rxjs").Observable>} obj
 */
export function zipObject(obj) {
    const keys = Object.keys(obj)

    return zip(...Object.values(obj)).pipe(
        map(values => Object.fromEntries(
            keys.map((key, i) => [key, values[i]])
        ))
    )
}
