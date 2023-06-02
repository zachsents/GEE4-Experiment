import { Graph } from "./graph.js"


const testGraph = {
    nodes: [
        { id: "trigger", type: "trigger", data: { state: {} } },
        { id: "print", type: "singlePrint", data: { state: {} } },
        { id: "number1", type: "number", data: { state: { $: 3 } } },
        { id: "add", type: "add", data: { state: {} } },
        { id: "ask", type: "waitForResponse", data: { state: {} } },
    ],
    edges: [
        { source: "trigger", sourceHandle: "subject", target: "print", targetHandle: "input" },

        { source: "number1", sourceHandle: "value", target: "add", targetHandle: "a" },
        { source: "add", sourceHandle: "sum", target: "print", targetHandle: "input" },

        { source: "trigger", sourceHandle: "subject", target: "ask", targetHandle: "question" },
        { source: "ask", sourceHandle: "answer", target: "print", targetHandle: "input" },
        { source: "ask", sourceHandle: "answer", target: "add", targetHandle: "b" },
    ]
}

console.log("\n")

// Fire start event -- 1st function execution

let graph = new Graph(testGraph)

graph.nodes.forEach(node => node.handler$.subscribe({
    complete: () => console.log(node.id, "handlers complete 👋")
}))

graph.start("gmail.emailReceived", {
    subject: "Hello",
}).then(x => console.log("✅ graph done:", x))


// Fire resume event -- 2nd function execution

global.fire = (payload) => {
    graph.destroy()
    graph = new Graph(testGraph)
    graph.resume("gmail.responseReceived", payload)
        .then(x => console.log("✅ graph done:", x))
}