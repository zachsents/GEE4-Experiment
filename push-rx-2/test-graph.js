

export const testGraph = {
    nodes: [
        { id: "trigger", type: "trigger", data: { state: {} } },
        { id: "print", type: "singlePrint", data: { state: {} } },
        { id: "cap", type: "capitalize", data: { state: {} } },
        { id: "low", type: "lowercase", data: { state: {} } },
        { id: "number1", type: "number", data: { state: { $: 3 } } },
        // { id: "add", type: "add", data: { state: {} } },
        // { id: "ask", type: "waitForResponse", data: { state: {} } },
    ],
    edges: [
        { source: "trigger", sourceHandle: "subject", target: "print", targetHandle: "input" },
        { source: "trigger", sourceHandle: "subject", target: "cap", targetHandle: "input" },
        { source: "trigger", sourceHandle: "subject", target: "low", targetHandle: "input" },
        { source: "number1", sourceHandle: "value", target: "print", targetHandle: "input" },
        { source: "cap", sourceHandle: "out", target: "print", targetHandle: "input" },
        { source: "low", sourceHandle: "out", target: "print", targetHandle: "input" },

        // { source: "number1", sourceHandle: "value", target: "add", targetHandle: "a" },
        // { source: "add", sourceHandle: "sum", target: "print", targetHandle: "input" },

        // { source: "trigger", sourceHandle: "subject", target: "ask", targetHandle: "question" },
        // { source: "ask", sourceHandle: "answer", target: "print", targetHandle: "input" },
        // { source: "ask", sourceHandle: "answer", target: "add", targetHandle: "b" },
    ]
}
