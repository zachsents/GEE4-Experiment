import { empty } from "ix/asynciterable/empty.js"
import { definitions } from "./definition-loader.js"
import { multicast } from "./operators/multicast.js"
import { EventEmitter } from "events"
import readline from "readline"


class Graph {

    variables = {}

    constructor(graphObj) {
        this.ee = new EventEmitter()

        this.nodes = graphObj.nodes.map(nodeObj => new Node(this, nodeObj))
        this.edges = graphObj.edges
    }

    emit(event, ...args) {
        this.ee.emit(event, ...args)
    }

    start(payload) {
        this.ee.emit("flow.start", { payload })
    }
}


class Node {

    constructor(graph, nodeObj) {
        this.graph = graph
        this._node = nodeObj

        // Bind event handlers
        Object.entries(this.definition.handlers ?? {})
            .forEach(([eventName, handler]) => {
                this.graph.ee.on(eventName, handler.bind(this))
            })

        // Bind flow.start handler
        this.graph.ee.on("flow.start", () => {
            if (this.shouldRunOnStart)
                this.run()
        })
    }

    get id() { return this._node.id }
    get type() { return this._node.type }
    get definition() { return definitions[this.type] }
    get state() { return this._node.data.state }

    _sources = {}

    sources = new Proxy(this._sources, {
        get: (target, sourceKey) => {

            if (!(sourceKey in target)) {
                const inputs = this.inputs

                target[sourceKey] = multicast(
                    this.definition.outputs[sourceKey].provider.call(this, {
                        inputs,
                        body: this.hasBody && multicast(
                            this.definition.body?.provider.call(this, { inputs })
                        ),
                    }),
                    this.id
                )
            }

            return target[sourceKey]
        },
    })

    get inputs() {
        return Object.fromEntries(
            Object.keys(this.definition.inputs)
                .map(inputKey => {
                    const connectedSources = this.graph.edges
                        .filter(edge => edge.target === this.id && edge.targetHandle === inputKey)
                        .map(edge => this.graph.nodes.find(node => node.id === edge.source).sources[edge.sourceHandle])

                    // Handle multiple inputs using the inputs specified strategy -- default to first
                    const strategy = this.definition.inputs[inputKey].multipleStrategy ?? (source => source ?? empty())

                    return [inputKey, strategy(...connectedSources)]
                })
        )
    }

    get hasBody() {
        return !!this.definition.body
    }

    get hasOutputEdges() {
        return !!this.graph.edges.find(edge => edge.source === this.id)
    }

    get shouldRunOnStart() {
        return this.hasBody && !this.hasOutputEdges
    }

    async run() {
        if (!this.hasBody)
            return

        this.definition.body.provider.call(this, {
            inputs: this.inputs,
        })
            .forEach(() => { })
    }
}


const testGraph = {
    nodes: [
        { id: "trigger", type: "trigger", data: { state: {} } },
        { id: "id", type: "generateId", data: { state: {} } },
        { id: "add", type: "add", data: { state: {} } },
        { id: "add2", type: "add", data: { state: {} } },
        { id: "print", type: "batchPrint", data: { state: {} } },
        { id: "print2", type: "singlePrint", data: { state: {} } },
        { id: "table", type: "loadTable", data: { state: {} } },
    ],
    edges: [
        { source: "trigger", sourceHandle: "subject", target: "add", targetHandle: "b" },
        { source: "id", sourceHandle: "id", target: "add", targetHandle: "a" },
        { source: "id", sourceHandle: "id", target: "print2", targetHandle: "input" },
        { source: "add", sourceHandle: "out", target: "print", targetHandle: "input" },
        { source: "trigger", sourceHandle: "number1", target: "add2", targetHandle: "a" },
        { source: "trigger", sourceHandle: "number2", target: "add2", targetHandle: "b" },
        { source: "add2", sourceHandle: "out", target: "print2", targetHandle: "input" },
        { source: "table", sourceHandle: "table", target: "print2", targetHandle: "input" },
    ]
}

global.rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const graph = new Graph(testGraph)

graph.emit("gmail.emailReceived", {
    subject: "Hello",
    number1: 3,
    number2: 5,
})

graph.start()


// global.rl.close()