"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Folder, ChevronRight, ArrowUp, Loader2 } from "lucide-react"
import type { BrowseDirEntry } from "@/lib/luban-api"

interface FolderPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (path: string) => void
  browseDir: (path: string) => Promise<{ path: string; entries: BrowseDirEntry[] }>
}

export function FolderPickerDialog({ open, onOpenChange, onSelect, browseDir }: FolderPickerDialogProps) {
  const [currentPath, setCurrentPath] = useState("")
  const [entries, setEntries] = useState<BrowseDirEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const navigate = useCallback(
    async (path: string) => {
      setLoading(true)
      setError(null)
      try {
        const result = await browseDir(path)
        setCurrentPath(result.path)
        setEntries(result.entries)
        setInputValue(result.path)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to browse directory")
      } finally {
        setLoading(false)
      }
    },
    [browseDir],
  )

  useEffect(() => {
    if (open) {
      navigate("")
    }
  }, [open, navigate])

  const pathSegments = currentPath.split("/").filter(Boolean)

  const handleBreadcrumbClick = (index: number) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/")
    void navigate(path)
  }

  const handleGoUp = () => {
    const parent = currentPath.replace(/\/[^/]+\/?$/, "") || "/"
    void navigate(parent)
  }

  const handleEntryClick = (entry: BrowseDirEntry) => {
    void navigate(entry.path)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      void navigate(inputValue)
    }
  }

  const handleSelect = () => {
    onSelect(currentPath)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] flex flex-col max-h-[80vh]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Select a project folder</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="flex-1 rounded-md border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Type a path and press Enter"
          />
          <Button variant="outline" size="sm" onClick={handleGoUp} title="Go up" disabled={currentPath === "/"}>
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-0.5 text-xs text-muted-foreground overflow-x-auto flex-shrink-0">
          <button
            onClick={() => void navigate("/")}
            className="hover:text-foreground px-1 py-0.5 rounded hover:bg-accent transition-colors shrink-0"
          >
            /
          </button>
          {pathSegments.map((segment, i) => (
            <span key={i} className="flex items-center gap-0.5 shrink-0">
              <ChevronRight className="h-3 w-3 shrink-0" />
              <button
                onClick={() => handleBreadcrumbClick(i)}
                className="hover:text-foreground px-1 py-0.5 rounded hover:bg-accent transition-colors"
              >
                {segment}
              </button>
            </span>
          ))}
        </div>

        {/* Directory listing */}
        <div className="border rounded-md overflow-y-auto min-h-[200px] max-h-[400px] flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full py-8 text-sm text-destructive px-4 text-center">
              {error}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex items-center justify-center h-full py-8 text-sm text-muted-foreground">
              No subdirectories
            </div>
          ) : (
            <div className="divide-y">
              {entries.map((entry) => (
                <button
                  key={entry.path}
                  onClick={() => handleEntryClick(entry)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                >
                  <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{entry.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!currentPath || loading}>
            Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
