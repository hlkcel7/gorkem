import { useState } from 'react';
import { graphService, GraphNode, GraphEdge } from '../services/graph-service';

export function useDocumentGraph() {
  const [graphData, setGraphData] = useState<{nodes: GraphNode[], edges: GraphEdge[]}>()
  const [selectedNode, setSelectedNode] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const loadGraph = async (rootDocId: string) => {
    try {
      setLoading(true);
      setError(undefined);
      const data = await graphService.buildDocumentGraph(rootDocId);
      setGraphData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Graph yüklenirken bir hata oluştu');
      console.error('Graph yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleNodeClick = async (nodeId: string) => {
    try {
      setSelectedNode(nodeId);
      const details = await graphService.getDocumentDetails(nodeId);
      
      // Eğer webUrl varsa, yeni sekmede aç
      if (details?.weburl) {
        window.open(details.weburl, '_blank');
      }
    } catch (err) {
      console.error('Düğüm tıklama hatası:', err);
    }
  }

  return { 
    graphData, 
    loading, 
    error,
    selectedNode, 
    loadGraph, 
    handleNodeClick 
  }
}