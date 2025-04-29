"use client"

import { Input } from "@/components/ui/input"
import { SearchIcon, UserIcon } from "lucide-react"

export default function FilterBar({ issuerFilter, nameFilter, onFilterChange }) {
  return (
    <div className="sticky top-[65px] z-10 grid grid-cols-2 gap-4 p-4 bg-muted/30 border-b">
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Filter by issuer"
          value={issuerFilter}
          onChange={(e) => onFilterChange("issuer", e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="relative">
        <UserIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Filter by name"
          value={nameFilter}
          onChange={(e) => onFilterChange("name", e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  )
}
