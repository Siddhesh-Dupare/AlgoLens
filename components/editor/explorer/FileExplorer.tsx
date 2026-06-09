"use client";

import { useEffect, useState } from "react";
import { FolderOpen } from "lucide-react";
import type { FileNode } from "./explorer.types";
import { openFolder } from "./filesystemUtils";
import {
  TreeProvider,
  TreeView,
  TreeNode,
  TreeNodeTrigger,
  TreeNodeContent,
  TreeExpander,
  TreeIcon,
  TreeLabel,
} from "@/components/kibo-ui/tree";
import { Button } from "@/components/ui/button";

interface FileExplorerProps {
  onFileSelect: (file: FileNode) => void;
  /** id of the file currently open/active in the editor — highlighted in the tree. */
  activeFileId?: string | null;
}

// Recursively render FileNodes as kibo-ui tree nodes. Folders expand/collapse
// (handled internally by the tree); files open in the editor on click. The
// active file is highlighted with an explicit color (the kibo default uses the
// shadcn `bg-accent` token, which isn't defined in this project's theme).
function FileNodes({
  nodes,
  level,
  onOpen,
  activeFileId,
}: {
  nodes: FileNode[];
  level: number;
  onOpen: (node: FileNode) => void;
  activeFileId?: string | null;
}) {
  return (
    <>
      {nodes.map((node, i) => {
        const isFolder = node.type === "folder";
        const isActive = !isFolder && node.id === activeFileId;
        return (
          <TreeNode
            key={node.id}
            nodeId={node.id}
            level={level}
            isLast={i === nodes.length - 1}
          >
            <TreeNodeTrigger
              onClick={() => {
                if (!isFolder) onOpen(node);
              }}
              className={
                isActive
                  ? "bg-neutral-700 text-white hover:bg-neutral-700"
                  : "hover:bg-neutral-700/50"
              }
            >
              <TreeExpander hasChildren={isFolder} />
              <TreeIcon hasChildren={isFolder} />
              <TreeLabel>{node.name}</TreeLabel>
            </TreeNodeTrigger>
            {isFolder && (
              <TreeNodeContent hasChildren>
                <FileNodes
                  nodes={node.children ?? []}
                  level={level + 1}
                  onOpen={onOpen}
                  activeFileId={activeFileId}
                />
              </TreeNodeContent>
            )}
          </TreeNode>
        );
      })}
    </>
  );
}

export default function FileExplorer({
  onFileSelect,
  activeFileId,
}: FileExplorerProps) {
  const [rootName, setRootName] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenFolder = async () => {
    setIsLoading(true);
    try {
      const result = await openFolder();
      if (result) {
        setRootName(result.name);
        setFileTree(result.children);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // File → Open Folder menu item triggers the same picker (synchronous dispatch
  // preserves the user gesture required by showDirectoryPicker).
  useEffect(() => {
    const onOpenFolder = () => handleOpenFolder();
    window.addEventListener("algolens:open-folder", onOpenFolder);
    return () =>
      window.removeEventListener("algolens:open-folder", onOpenFolder);
  }, []);

  const handleOpen = (node: FileNode) => {
    if (node.type === "file" && !node.isNew) onFileSelect(node);
  };

  return (
    <div className="flex h-full flex-col bg-[#181818]">
      {fileTree.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm text-neutral-500">No folder open</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenFolder}
            disabled={isLoading}
            className="text-sm text-neutral-400 rounded-lg cursor-pointer"
          >
            {isLoading ? "Opening…" : "Open Folder"}
          </Button>
        </div>
      ) : (
        <div className="file-explorer-scroll flex-1 overflow-auto">
          {rootName && (
            <div className="truncate px-3 py-1 text-xs font-semibold text-neutral-400">
              {rootName}
            </div>
          )}
          <TreeProvider
            selectable
            showLines={false}
            indent={14}
            className="text-neutral-300"
          >
            <TreeView className="p-1">
              <FileNodes
                nodes={fileTree}
                level={0}
                onOpen={handleOpen}
                activeFileId={activeFileId}
              />
            </TreeView>
          </TreeProvider>
        </div>
      )}
    </div>
  );
}
