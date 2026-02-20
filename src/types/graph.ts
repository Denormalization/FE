export interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
    type: 'main' | 'sub';
    label: string;
    description: string;
    quote?: string;
    author?: string;
    radius: number;
    color: string;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
    source: string | GraphNode;
    target: string | GraphNode;
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}