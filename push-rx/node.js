import { catchError, filter, forkJoin, last, map, merge, of, scan, share } from "rxjs"
import { definitions } from "./definition-loader.js"


/** @typedef {import("./graph.js").Graph} Graph */


export class Node {

    constructor(graph, nodeObj) {
        /** @type {Graph} */
        this.graph = graph
        this._node = nodeObj
    }


    // Node Info Getters
    get id() { return this._node.id }
    get type() { return this._node.type }

    /** @type {import("./definition-loader.js").NodeDefinition} */
    get definition() { return definitions[this.type] }

    get state() { return this._node.data.state }


    /**
     * Create input & event handlers then merge them into a single stream
     * @type {import("rxjs").Observable}
     */
    get handler$() {
        this._handler$ ??= merge(
            // Create and share input handlers
            ...this.definition.inputHandlers.map(
                handler => handler.call(this, this.inputs$).pipe(share())
            ),

            // Create and share event handlers
            ...Object.entries(this.definition.eventHandlers).map(([eventName, handler]) => {
                // const event$ = fromEvent(this.graph.ee, eventName)
                const event$ = this.graph.listen(eventName)
                return handler.call(this, event$).pipe(share())
            })
        )

        return this._handler$
    }


    /** 
     * @type {Object.<string, import("rxjs").Observable>} 
     */
    get inputs$() {
        this._inputs$ ??= Object.fromEntries(
            this.definition.inputs.map(inputKey => {
                // Find connected outputs
                const connectedOutputs$ = this.graph.edges
                    .filter(edge => edge.target === this.id && edge.targetHandle === inputKey)
                    .map(edge => this.graph.nodes.find(node => node.id === edge.source).outputs$[edge.sourceHandle])

                // Handle multiple edges on one input by merging -- might add ability to specify strategy later
                const data$ = merge(...connectedOutputs$)

                // Share the data stream
                return [inputKey, data$.pipe(share())]
            })
        )

        return this._inputs$
    }


    /** 
     * @type {Object.<string, import("rxjs").Observable>} 
     */
    get outputs$() {
        this._outputs$ ??= Object.fromEntries(
            this.definition.outputs.map(outputKey => [
                outputKey,
                this.handler$.pipe(
                    filter(result => typeof result === "object" && outputKey in result),
                    map(result => result[outputKey]),
                    share(),
                )
            ])
        )

        return this._outputs$
    }


    // Cumulative inputs
    get inputCum$() {
        // Merge all input streams into one of form { inputKey: value }
        return merge(
            ...Object.entries(this.inputs$).map(
                ([inputKey, input$]) => input$.pipe(
                    map(value => ({ [inputKey]: value }))
                )
            )
        ).pipe(
            // Reduce all inputs into one object of form { inputKey1: [value1, value2, ...], ... }
            scan((acc, input) => {
                Object.entries(input).forEach(([key, value]) => {
                    acc[key] ??= []
                    acc[key].push(value)
                })
                return acc
            }, {}),
            last(),
            catchError(() => of({})),
        )
    }


    // Cumulative outputs
    get outputCum$() {
        // Merge all output streams into one of form { outputKey: value }
        return merge(
            ...Object.entries(this.outputs$).map(
                ([outputKey, output$]) => output$.pipe(
                    map(value => ({ [outputKey]: value }))
                )
            )
        ).pipe(
            // Reduce all outputs into one object of form { outputKey1: [value1, value2, ...], ... }
            scan((acc, output) => {
                Object.entries(output).forEach(([key, value]) => {
                    acc[key] ??= []
                    acc[key].push(value)
                })
                return acc
            }, {}),
            last(),
            catchError(() => of({})),
        )
    }

    get finished$() {
        return forkJoin([
            this.handler$.pipe(
                // sometimes handlers don't have values, which gets in forkJoin's head
                last(),
                catchError(() => of(null)),
            ),
            this.inputCum$,
            this.outputCum$,
        ]).pipe(
            map(([, inputs, outputs]) => ({ inputs, outputs }))
        )
    }

    startSubscriptions() {
        // This is the only subscription we actually need for everything to run
        this.graph.subscriptions.push(
            this.handler$.subscribe(() => { })
        )
    }
}