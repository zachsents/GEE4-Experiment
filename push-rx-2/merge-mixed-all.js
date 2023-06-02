import { isObservable, mergeMap, of } from "rxjs"


export function mergeMixedAll() {
    return mergeMap(x => isObservable(x) ? x : of(x))
}