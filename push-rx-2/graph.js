import { Subject } from "rxjs"


export class Graph {



    constructor(graphObj) {
        this.ee$ = new Subject()

        /** @type {Node[]} */
        this.nodes = graphObj.nodes.map(nodeObj => new Node(this, nodeObj))

        /** @type {Edge[]} */
        this.edges = graphObj.edges
    }

}