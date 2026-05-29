import type { FileNode } from './explorer.types'

const BUBBLE_PY = `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

data = [64, 34, 25, 12, 22, 11, 90]
print(bubble_sort(data))
`

const BUBBLE_JS = `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}
const data = [64, 34, 25, 12, 22, 11, 90];
console.log(bubbleSort(data));
`

const BUBBLE_CPP = `#include <iostream>
#include <vector>
using namespace std;
void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (arr[j] > arr[j + 1])
                swap(arr[j], arr[j + 1]);
}
int main() {
    vector<int> data = {64, 34, 25, 12, 22, 11, 90};
    bubbleSort(data);
    for (int x : data) cout << x << " ";
    return 0;
}
`

const BUBBLE_C = `#include <stdio.h>
void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
}
int main() {
    int data[] = {64, 34, 25, 12, 22, 11, 90};
    bubbleSort(data, 7);
    for (int i = 0; i < 7; i++) printf("%d ", data[i]);
    return 0;
}
`

const BUBBLE_JAVA = `public class BubbleSort {
    static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n - i - 1; j++)
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
    }
    public static void main(String[] args) {
        int[] data = {64, 34, 25, 12, 22, 11, 90};
        bubbleSort(data);
        for (int x : data) System.out.print(x + " ");
    }
}
`

const BFS_PY = `from collections import deque

def bfs(graph, start):
    visited = set()
    queue = deque([start])
    visited.add(start)
    result = []
    while queue:
        node = queue.popleft()
        result.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return result

graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'F'],
    'D': ['B'],
    'E': ['B', 'F'],
    'F': ['C', 'E']
}
print(bfs(graph, 'A'))
`

const DFS_PY = `def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    visited.add(start)
    result = [start]
    for neighbor in graph[start]:
        if neighbor not in visited:
            result.extend(dfs(graph, neighbor, visited))
    return result

graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'F'],
    'D': ['B'],
    'E': ['B', 'F'],
    'F': ['C', 'E']
}
print(dfs(graph, 'A'))
`

const LINKED_LIST_PY = `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, data):
        new_node = Node(data)
        if not self.head:
            self.head = new_node
            return
        current = self.head
        while current.next:
            current = current.next
        current.next = new_node

    def display(self):
        elements = []
        current = self.head
        while current:
            elements.append(current.data)
            current = current.next
        return elements

ll = LinkedList()
for val in [1, 2, 3, 4, 5]:
    ll.append(val)
print(ll.display())
`

export const INITIAL_FILE_TREE: FileNode[] = [
  {
    id: 'project-root',
    name: 'algolens-project',
    type: 'folder',
    children: [
      {
        id: 'src-folder',
        name: 'src',
        type: 'folder',
        children: [
          {
            id: 'sorting-folder',
            name: 'sorting',
            type: 'folder',
            children: [
              {
                id: 'bubble-py',
                name: 'bubble_sort.py',
                type: 'file',
                language: 'python',
                content: BUBBLE_PY,
              },
              {
                id: 'bubble-js',
                name: 'bubble_sort.js',
                type: 'file',
                language: 'javascript',
                content: BUBBLE_JS,
              },
              {
                id: 'bubble-cpp',
                name: 'bubble_sort.cpp',
                type: 'file',
                language: 'cpp',
                content: BUBBLE_CPP,
              },
              {
                id: 'bubble-c',
                name: 'bubble_sort.c',
                type: 'file',
                language: 'c',
                content: BUBBLE_C,
              },
              {
                id: 'bubble-java',
                name: 'BubbleSort.java',
                type: 'file',
                language: 'java',
                content: BUBBLE_JAVA,
              },
            ],
          },
          {
            id: 'graphs-folder',
            name: 'graphs',
            type: 'folder',
            children: [
              {
                id: 'bfs-py',
                name: 'bfs.py',
                type: 'file',
                language: 'python',
                content: BFS_PY,
              },
              {
                id: 'dfs-py',
                name: 'dfs.py',
                type: 'file',
                language: 'python',
                content: DFS_PY,
              },
            ],
          },
          {
            id: 'linkedlist-folder',
            name: 'linked_lists',
            type: 'folder',
            children: [
              {
                id: 'linkedlist-py',
                name: 'linked_list.py',
                type: 'file',
                language: 'python',
                content: LINKED_LIST_PY,
              },
            ],
          },
        ],
      },
      {
        id: 'readme',
        name: 'README.md',
        type: 'file',
        language: 'markdown',
        content: '# AlgoLens\n\nDSA Visualizer — Step through algorithms visually.\n',
      },
      {
        id: 'gitignore',
        name: '.gitignore',
        type: 'file',
        content: '__pycache__/\nnode_modules/\n.env\n',
      },
    ],
  },
]
