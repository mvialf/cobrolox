"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

interface DataTableSettingsProps {
  showCompleted: boolean;
  onToggleCompleted: (show: boolean) => void;
}

export function DataTableSettings({
  showCompleted,
  onToggleCompleted,
}: DataTableSettingsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Configuración</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onToggleCompleted(!showCompleted);
          }}
        >
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-sm">Mostrar completadas</span>
            <Switch
              checked={showCompleted}
              onCheckedChange={onToggleCompleted}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
