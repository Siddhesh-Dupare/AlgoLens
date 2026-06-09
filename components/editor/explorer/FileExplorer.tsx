"use client";

import { Tree } from "react-arborist";
import type { NodeApi, TreeApi } from "react-arborist";
import { useState, useEffect, useRef } from "react";
import { FolderOpen, ChevronDown, FilePlus, FolderPlus } from "lucide-react";
import type { FileNode, ContextMenuState } from "./explorer.types";
import {
  openFolder,
  createNewFile,
  createNewFolder,
  deleteFileOrFolder,
  renameFile,
  getLanguageFromFilename,
} from "./filesystemUtils";
import FileTreeNode from "./FileTreeNode";
import FileExplorerContextMenu from "./FileExplorerContextMenu";

import { Button } from "@/components/ui/button";

interface FileExplorerProps {
  onFileSelect: (file: FileNode) => void;
}

// ---- Immutable tree helpers -------------------------------------------------

function findNodeById(tree: FileNode[], id: string): FileNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function insertChild(
  tree: FileNode[],
  parentId: string | null,
  rootName: string | null,
  newNode: FileNode,
): FileNode[] {
  if (parentId === null || parentId === rootName) {
    return [...tree, newNode];
  }
  return tree.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children ?? []), newNode] };
    }
    if (node.children) {
      return {
        ...node,
        children: insertChild(node.children, parentId, rootName, newNode),
      };
    }
    return node;
  });
}

function updateNodeById(
  tree: FileNode[],
  id: string,
  patch: Partial<FileNode>,
): FileNode[] {
  return tree.map((node) => {
    if (node.id === id) return { ...node, ...patch };
    if (node.children) {
      return { ...node, children: updateNodeById(node.children, id, patch) };
    }
    return node;
  });
}

function removeNodeById(tree: FileNode[], id: string): FileNode[] {
  return tree
    .filter((node) => node.id !== id)
    .map((node) =>
      node.children
        ? { ...node, children: removeNodeById(node.children, id) }
        : node,
    );
}

export default function FileExplorer({ onFileSelect }: FileExplorerProps) {
  const [rootName, setRootName] = useState<string | null>(null);
  const [rootHandle, setRootHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    node: null,
  });

  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 240,
    height: 500,
  });
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<TreeApi<FileNode> | null>(null);

  useEffect(() => {
    const el = treeContainerRef.current;
    if (!el) return;
    const update = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fileTree.length, isLoading]);

  const handleOpenFolder = async () => {
    setIsLoading(true);
    try {
      const result = await openFolder();
      if (result) {
        setRootName(result.name);
        setRootHandle(result.handle);
        setFileTree(result.children);
        setSelectedId(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Let the File → Open Folder menu item trigger the same picker. The event is
  // dispatched synchronously from the menu click, so the browser's user-gesture
  // requirement for showDirectoryPicker() is preserved.
  useEffect(() => {
    const onOpenFolder = () => handleOpenFolder();
    window.addEventListener("algolens:open-folder", onOpenFolder);
    return () =>
      window.removeEventListener("algolens:open-folder", onOpenFolder);
  }, []);

  const handleSelect = (nodes: NodeApi<FileNode>[]) => {
    const node = nodes[0];
    if (node && node.data.type === "file" && !node.data.isNew) {
      setSelectedId(node.data.id);
      onFileSelect(node.data);
    }
  };

  const getParentDirHandle = (
    parentId?: string | null,
  ): FileSystemDirectoryHandle | null => {
    if (!parentId || parentId === rootName) return rootHandle;
    return findNodeById(fileTree, parentId)?.dirHandle ?? null;
  };

  // react-arborist create: insert a placeholder, then it enters edit mode.
  const handleCreate = ({
    parentId,
    type,
  }: {
    parentId: string | null;
    type: "internal" | "leaf";
  }) => {
    const tempId = `__new__/${Date.now()}/${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const newNode: FileNode = {
      id: tempId,
      name: "",
      type: type === "internal" ? "folder" : "file",
      parentId: parentId ?? rootName ?? "",
      isNew: true,
      children: type === "internal" ? [] : undefined,
    };
    setFileTree((prev) => insertChild(prev, parentId, rootName, newNode));
    return { id: tempId };
  };

  // react-arborist rename submit: finalize a new node, or rename an existing one.
  const handleRename = async ({
    id,
    name,
    node,
  }: {
    id: string;
    name: string;
    node: NodeApi<FileNode>;
  }) => {
    const data = node.data;
    const base =
      data.parentId && data.parentId !== "" ? data.parentId : rootName;
    const realId = `${base}/${name}`;
    const parentDir = getParentDirHandle(data.parentId);

    if (data.isNew) {
      if (!parentDir) {
        setFileTree((prev) => removeNodeById(prev, id));
        return;
      }
      if (data.type === "folder") {
        const dh = await createNewFolder(parentDir, name);
        if (!dh) {
          setFileTree((prev) => removeNodeById(prev, id));
          return;
        }
        setFileTree((prev) =>
          updateNodeById(prev, id, {
            id: realId,
            name,
            isNew: false,
            dirHandle: dh,
            children: [],
          }),
        );
      } else {
        const fh = await createNewFile(parentDir, name);
        if (!fh) {
          setFileTree((prev) => removeNodeById(prev, id));
          return;
        }
        setFileTree((prev) =>
          updateNodeById(prev, id, {
            id: realId,
            name,
            isNew: false,
            handle: fh,
            language: getLanguageFromFilename(name),
          }),
        );
      }
      return;
    }

    // Rename existing node.
    if (data.type === "folder") {
      window.alert("Folder rename is not supported yet.");
      return;
    }
    if (!parentDir) return;
    const ok = await renameFile(parentDir, data.name, name);
    if (!ok) return;
    const newHandle = await parentDir
      .getFileHandle(name)
      .catch(() => undefined);
    setFileTree((prev) =>
      updateNodeById(prev, id, {
        id: realId,
        name,
        handle: newHandle ?? data.handle,
        language: getLanguageFromFilename(name),
      }),
    );
  };

  // react-arborist delete: remove from disk + state, and close any open tabs.
  const handleTreeDelete = async ({
    nodes,
  }: {
    nodes: NodeApi<FileNode>[];
  }) => {
    for (const node of nodes) {
      const data = node.data;
      const parentDir = getParentDirHandle(data.parentId);
      if (parentDir) {
        await deleteFileOrFolder(parentDir, data.name, data.type === "folder");
      }
      window.dispatchEvent(
        new CustomEvent("algolens:file-deleted", { detail: { id: data.id } }),
      );
      setFileTree((prev) => removeNodeById(prev, data.id));
    }
  };

  const handleCancelNew = (id: string) => {
    setFileTree((prev) => removeNodeById(prev, id));
  };

  // ---- Context menu ---------------------------------------------------------

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, node });
  };

  const closeContextMenu = () =>
    setContextMenu({ isOpen: false, x: 0, y: 0, node: null });

  const handleContextDelete = (node: FileNode) => {
    const confirmed = window.confirm(
      `Delete ${node.name}? This cannot be undone.`,
    );
    if (confirmed) treeRef.current?.delete(node.id);
  };

  return (
    <div className="h-full w-full flex flex-col bg-neutral-900 select-none overflow-hidden">
      {/* Header */}
      <div className="h-8 pr-2 pl-3 shrink-0 flex items-center bg-neutral-900 gap-2">
        <span className="flex-1 text-xs font-semibold tracking-tighter text-neutral-300">
          EXPLORER
        </span>

        <Button
          aria-label="New File"
          title="New File"
          size="icon-sm"
          variant="ghost"
          onClick={() =>
            treeRef.current?.create({ type: "leaf", parentId: null })
          }
          className="flex items-center justify-center cursor-pointer p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-300"
        >
          <FilePlus size={14} />
        </Button>

        <Button
          aria-label="New Folder"
          title="New Folder"
          size="icon-sm"
          variant="ghost"
          onClick={() =>
            treeRef.current?.create({ type: "internal", parentId: null })
          }
          className="flex items-center justify-center cursor-pointer p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-300"
        >
          <FolderPlus size={14} />
        </Button>

        <Button
          aria-label="Open folder"
          title="Open Folder"
          size="icon-sm"
          variant="ghost"
          onClick={handleOpenFolder}
          className="flex items-center justify-center cursor-pointer p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-300"
        >
          <FolderOpen size={15} />
        </Button>
      </div>

      {/* Body */}
      <div
        ref={treeContainerRef}
        className="file-explorer-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex-col"
      >
        {isLoading ? (
          <div className="h-20 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-neutral-800 border-t-sky-600 rounded-lg animate-spin" />
          </div>
        ) : rootName === null ? (
          <div className="px-5 py-4">
            <div className="text-sm text-neutral-600 mb-3">No folder open</div>
            <Button
              onClick={handleOpenFolder}
              variant="outline"
              className="w-full py-1.5 px-3 text-xs border-neutral-700 text-neutral-300 hover:bg-neutral-800 rounded-lg cursor-pointer"
            >
              Open Folder
            </Button>
          </div>
        ) : (
          <>
            <div className="flex h-5 px-2 py-2 items-center cursor-pointer shrink-0">
              <ChevronDown
                size={14}
                color="#8a8a8a"
                style={{ flexShrink: 0 }}
              />
              <span className="text-base font-semibold text-neutral-300 tracking-tighter uppercase ml-1 overflow-hidden text-ellipsis whitespace-nowrap">
                {rootName}
              </span>
            </div>

            {fileTree.length === 0 && (
              <div className="text-md text-neutral-600 px-1 pl-6 pr-2">
                Empty folder — use the + buttons to add files.
              </div>
            )}

            <div className="flex-1 min-h-0">
              <Tree<FileNode>
                ref={treeRef}
                data={fileTree}
                onSelect={handleSelect}
                onCreate={handleCreate}
                onRename={handleRename}
                onDelete={handleTreeDelete}
                disableDrag
                openByDefault={false}
                width={size.width}
                height={Math.max(size.height - 24, 0)}
                indent={16}
                rowHeight={24}
                overscanCount={4}
              >
                {(props) => (
                  <FileTreeNode
                    {...props}
                    selectedId={selectedId}
                    onContextMenu={handleContextMenu}
                    onCancelNew={handleCancelNew}
                  />
                )}
              </Tree>
            </div>
          </>
        )}
      </div>

      {contextMenu.isOpen && contextMenu.node && (
        <FileExplorerContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={closeContextMenu}
          onNewFile={(parentId) =>
            treeRef.current?.create({ type: "leaf", parentId })
          }
          onNewFolder={(parentId) =>
            treeRef.current?.create({ type: "internal", parentId })
          }
          onRename={(node) => treeRef.current?.edit(node.id)}
          onDelete={handleContextDelete}
          onCopyPath={(node) => navigator.clipboard.writeText(node.id)}
        />
      )}
    </div>
  );
}
