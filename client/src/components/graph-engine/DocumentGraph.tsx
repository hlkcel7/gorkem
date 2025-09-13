import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { GraphNode, GraphEdge } from '../../services/graph-service';

// dagre layout plugin'ini kaydet
cytoscape.use(dagre);

interface DocumentGraphProps {
  data: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  onNodeClick: (nodeId: string) => void;
}

export function DocumentGraph({ data, onNodeClick }: DocumentGraphProps) {
  const cyRef = useRef(null);

  useEffect(() => {
    if (!cyRef.current || !data) return;

    const cy = cytoscape({
      container: cyRef.current,
      elements: {
        nodes: data.nodes.map(node => ({
          data: {
            id: node.id,
            label: `${node.data.letterNo}\n${node.data.date}`,
            ...node.data
          }
        })),
        edges: data.edges.map(edge => ({
          data: {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type
          }
        }))
      },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#4299e1',
            'label': 'data(label)',
            'color': '#2d3748',
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'font-size': '10px',
            'text-valign': 'center',
            'text-halign': 'center',
            'padding': '10px',
            'shape': 'rectangle',
            'width': 'label',
            'height': 'label'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#a0aec0',
            'target-arrow-color': '#a0aec0',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        }
      ],
      layout: {
        name: 'dagre',
        rankDir: 'LR',
        spacingFactor: 1.5,
        nodeSep: 50,
        rankSep: 100,
        fit: true,
        padding: 50
      },
      wheelSensitivity: 0.2
    });

    // Event handlers
    cy.on('tap', 'node', evt => {
      evt.preventDefault();
      onNodeClick(evt.target.id());
    });

    // Cleanup
    return () => {
      cy.destroy();
    };
  }, [data, onNodeClick]);

  return (
    <div 
      ref={cyRef} 
      style={{ 
        width: '100%', 
        height: '600px',
        backgroundColor: '#f7fafc',
        borderRadius: '0.5rem'
      }} 
    />
  );
}