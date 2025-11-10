"use client";

import { useState } from "react";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { utils, write } from "xlsx";
import { ImportResultDialog } from "./import-result-dialog";

interface ImportResult {
  success: boolean;
  imported?: number;
  summary?: {
    total: number;
    valid: number;
    invalid: number;
  };
  errors?: Array<{
    row: number;
    field?: string;
    message: string;
    value?: unknown;
  }>;
  duplicates?: string[];
  missingCustomers?: string[];
  missingInvoiceStatuses?: string[];
  missingPaymentStatuses?: string[];
  message?: string;
  error?: string;
}

interface ImportUploaderProps {
  title: string;
  description: string;
  templateData: (string | Date | number)[][]; // Array de arrays para generar Excel (soporta Date objects para fechas formateadas)
  templateFilename: string;
  apiEndpoint: string;
  entityName?: string; // Nombre de la entidad ("Factura", "Cliente", etc.)
  onSuccess?: () => void;
}

export function ImportUploader({
  title,
  description,
  templateData,
  templateFilename,
  apiEndpoint,
  entityName = "Registro",
  onSuccess,
}: ImportUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(apiEndpoint, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, ...data });
        setFile(null);
        setDialogOpen(true); // Abrir dialog con resultados
        onSuccess?.();
      } else {
        setResult({ success: false, ...data });
        setDialogOpen(true); // Abrir dialog con errores
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      });
      setDialogOpen(true); // Abrir dialog con error
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Crear worksheet desde array de arrays
    const ws = utils.aoa_to_sheet(templateData);

    // Crear workbook
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Plantilla");

    // Generar archivo Excel
    const excelBuffer = write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    // Descargar archivo
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = templateFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Descargar template */}
        <div>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full"
          >
            <FileText />
            Descargar plantilla Excel
          </Button>
        </div>

        {/* Upload file */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                disabled={isUploading}
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="min-w-[120px]"
            >
              {isUploading ? (
                <>Importando...</>
              ) : (
                <>
                  <Upload />
                  Importar
                </>
              )}
            </Button>
          </div>

          {file && (
            <p className="text-sm text-muted-foreground">
              Archivo seleccionado: {file.name}
            </p>
          )}
        </div>

        {/* Dialog de resultados */}
        {result && (
          <ImportResultDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            result={result}
            entityName={entityName}
          />
        )}
      </CardContent>
    </Card>
  );
}
