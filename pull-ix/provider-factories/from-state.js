import { infSingle } from "../operators/infinite-singleton.js"


export function fromState(key) {
    return function () {
        return infSingle(this.state[key])
    }
}