import { Subject, filter, lastValueFrom, map } from "rxjs"
import { Node } from "./node.js"
import { zipObject } from "./operator-factories/zip-object.js"


/**
 * @typedef {object} Edge
 * @property {string} source
 * @property {string} sourceHandle
 * @property {string} target
 * @property {string} targetHandle
 */


export class Graph {

    variables = {}
    subscriptions = []

    constructor(graphObj) {
        this.ee$ = new Subject()

        /** @type {Node[]} */
        this.nodes = graphObj.nodes.map(nodeObj => new Node(this, nodeObj))

        /** @type {Edge[]} */
        this.edges = graphObj.edges
    }

    stopEvents() {
        this.ee$.complete()
    }

    emit(event, data) {
        this.ee$.next({ event, data })
    }

    listen(event) {
        return this.ee$.pipe(
            filter(({ event: e }) => e === event),
            map(({ data }) => data),
        )
    }

    start(triggerEvent, payload) {

        // Subscriptions -- have to happen first
        this.nodes.forEach(node => node.startSubscriptions())
        const finishProm = this.untilFinished()

        // Emissions
        this.emit("flow.start", { payload })
        triggerEvent && this.emit(triggerEvent, payload)

        // Stop events -- needed for stream completion
        this.stopEvents()

        return finishProm
    }

    resume(triggerEvent, payload, previousState) {

        // Restore previous state
        // never ended up getting this

        // Subscriptions -- have to happen first
        this.nodes.forEach(node => node.startSubscriptions())
        const finishProm = this.untilFinished()

        // Emissions
        this.emit("flow.resume", { payload })
        triggerEvent && this.emit(triggerEvent, payload)

        // Stop events -- needed for stream completion
        this.stopEvents()

        return finishProm
    }

    destroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe())
    }

    get finished$() {

        const inputs = zipObject(
            Object.fromEntries(
                this.nodes.map(node => [node.id, node.finished$.pipe(
                    map(x => x.inputs),
                )])
            )
        )

        const outputs = zipObject(
            Object.fromEntries(
                this.nodes.map(node => [node.id, node.finished$.pipe(
                    map(x => x.outputs),
                )])
            )
        )

        return zipObject({ inputs, outputs })
    }

    untilFinished() {
        return lastValueFrom(this.finished$)
    }
}