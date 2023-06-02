import { definitions } from "./definition-loader.js"
import { empty } from "./generators/empty.js"
import { multicast } from "./generators/multicast.js"


class Graph {

    constructor(graphObj) {
        this.nodes = graphObj.nodes.map(nodeObj => new Node(this, nodeObj))
        this.edges = graphObj.edges
    }
}

class Node {

    constructor(graph, nodeObj) {
        this.graph = graph
        this.id = nodeObj.id
        this.type = nodeObj.type
        this.definition = definitions[this.type]
    }

    _sources = {}

    sources = new Proxy(this._sources, {
        get: (target, sourceKey) => {
            if (!(sourceKey in target))
                target[sourceKey] = multicast(this.definition.sources[sourceKey].provider(this.inputs))

            return target[sourceKey]
        },
    })

    get inputs() {
        return Object.fromEntries(
            Object.keys(this.definition.inputs)
                .map(inputKey => {
                    const connectedSources = this.graph.edges
                        .filter(edge => edge.target === this.id && edge.targetHandle === inputKey)
                        .map(edge => this.graph.nodes.find(node => node.id === edge.source).sources[edge.sourceHandle]())

                    // For now, we're gonna limit each input to a single source
                    if (connectedSources.length > 1)
                        console.warn(`Multiple sources connected to input (Node: ${this.id}, Input: ${inputKey})`)

                    // Handle multiple inputs using the inputs specified strategy -- default to first
                    const strategy = this.definition.inputs[inputKey].multipleStrategy ?? (source => source ?? empty())

                    return [inputKey, strategy(...connectedSources)]
                })
        )
    }

    async run() {
        const body = this.definition.body.provider(this.inputs)

        // eslint-disable-next-line no-unused-vars
        for await (const result of body) {
            // console.log(this.id, res)
        }
    }
}


const testGraph = {
    nodes: [
        { id: "trigger", type: "trigger" },
        { id: "id", type: "generateId" },
        { id: "add", type: "add" },
        { id: "print", type: "singlePrint" },
        { id: "print2", type: "singlePrint" },
    ],
    edges: [
        { source: "trigger", sourceHandle: "subject", target: "add", targetHandle: "b" },
        { source: "id", sourceHandle: "id", target: "add", targetHandle: "a" },
        { source: "id", sourceHandle: "id", target: "print2", targetHandle: "input" },
        { source: "add", sourceHandle: "out", target: "print", targetHandle: "input" },
        // { source: "trigger", sourceHandle: "subject", target: "low1", targetHandle: "input" },
        // { source: "trigger", sourceHandle: "subject", target: "low1", targetHandle: "input" },
        // { source: "cap1", sourceHandle: "out", target: "print", targetHandle: "input" },
        // { source: "cap1", sourceHandle: "out", target: "print2", targetHandle: "input" },
        // { source: "low1", sourceHandle: "out", target: "print", targetHandle: "input" },
        // { source: "low1", sourceHandle: "out", target: "print2", targetHandle: "input" },
    ]
}

// 🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟
// One huge problem with this approach:
// Infinite generators blow up the whole thing 😭
// This was one of the main points of using generators in the first place
// 🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟
// 
// Idea for a solution:
// 1. Do pull, but with regular functions. The key difference is that we know
//    the size of the inputs when we call them, so we can request certain amounts
//    of data from the inputs.
// 2. We could go back to a push model, but with a hybrid approach where we can
//    provide functions from sources that can be called with info about what to
//    generate.
//
// Getting a little lost. Need to write down the pros/cons and motivations behind
// each approach.

const graph = new Graph(testGraph)

graph.nodes.find(node => node.id === "print").run()
graph.nodes.find(node => node.id === "print2").run()