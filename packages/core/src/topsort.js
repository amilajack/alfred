/* eslint-disable */

function uniqueNodes(arr) {
  const res = new Set();
  for (let i = 0, len = arr.length; i < len; i += 1) {
    const edge = arr[i];
    res.add(edge[0]);
    res.add(edge[1]);
  }
  return Array.from(res);
}

function makeOutgoingEdges(arr) {
  const edges = new Map();
  for (let i = 0, len = arr.length; i < len; i += 1) {
    const edge = arr[i];
    if (!edges.has(edge[0])) edges.set(edge[0], new Set());
    if (!edges.has(edge[1])) edges.set(edge[1], new Set());
    edges.get(edge[0]).add(edge[1]);
  }
  return edges;
}

function makeNodesHash(arr) {
  const res = new Map();
  for (let i = 0, len = arr.length; i < len; i += 1) {
    res.set(arr[i], i);
  }
  return res;
}

/**
 * Topological sorting function
 *
 * @param {Array} edges
 * @returns {Array}
 */

function toposort(nodes, edges) {
  let cursor = nodes.length;
  const sorted = new Array(cursor);
  const visited = {};
  let i = cursor;
  // Better data structures make algorithm much faster.
  const outgoingEdges = makeOutgoingEdges(edges);
  const nodesHash = makeNodesHash(nodes);

  // check for unknown nodes
  edges.forEach(function(edge) {
    if (!nodesHash.has(edge[0]) || !nodesHash.has(edge[1])) {
      throw new Error(
        'Unknown node. There is an unknown node in the supplied edges.'
      );
    }
  });

  while (i--) {
    if (!visited[i]) visit(nodes[i], i, new Set());
  }

  return sorted;

  function visit(node, i, predecessors) {
    if (predecessors.has(node)) {
      let nodeRep;
      try {
        nodeRep = `, node was:${JSON.stringify(node)}`;
      } catch (e) {
        nodeRep = '';
      }
      console.warn(`Cyclic dependency${nodeRep}`);
    }

    if (!nodesHash.has(node)) {
      throw new Error(
        `Found unknown node. Make sure to provided all involved nodes. Unknown node: ${JSON.stringify(
          node
        )}`
      );
    }

    if (visited[i]) return;
    visited[i] = true;

    let outgoing = outgoingEdges.get(node) || new Set();
    outgoing = Array.from(outgoing);

    if ((i = outgoing.length)) {
      predecessors.add(node);
      do {
        const child = outgoing[--i];
        visit(child, nodesHash.get(child), predecessors);
      } while (i);
      predecessors.delete(node);
    }

    sorted[--cursor] = node;
  }
}

export default function(edges) {
  return toposort(uniqueNodes(edges), edges);
}
