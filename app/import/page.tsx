"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { ImportUploader } from "@/components/import/import-uploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CUSTOMER_TEMPLATE_DATA } from "@/lib/import/customer-import";
import { INVOICE_TEMPLATE_DATA } from "@/lib/import/invoice-import";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function ImportPage() {
  return (
    <AppLayout
      pageTitle="Importación Masiva"
      pageDescription="Importe clientes y facturas desde archivos Excel"
    >
      <div className="space-y-6">
        {/* Instrucciones generales */}
        <Alert>
          <InfoIcon />
          <AlertTitle>Instrucciones</AlertTitle>
          <AlertDescription>
            <ol className="ml-4 mt-2 list-decimal space-y-1 text-sm">
              <li>Descargue la plantilla Excel correspondiente</li>
              <li>Complete los datos siguiendo el formato del ejemplo</li>
              <li>Guarde el archivo como Excel (.xlsx o .xls)</li>
              <li>Suba el archivo usando el botón &quot;Importar&quot;</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Tabs para diferentes tipos de importación */}
        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customers">Clientes</TabsTrigger>
            <TabsTrigger value="invoices">Facturas</TabsTrigger>
          </TabsList>

          {/* Importación de Clientes */}
          <TabsContent value="customers" className="space-y-4">
            <ImportUploader
              title="Importar Clientes"
              description="Importe múltiples clientes desde un archivo Excel. El RUT debe ser único."
              templateData={CUSTOMER_TEMPLATE_DATA}
              templateFilename="plantilla-clientes.xlsx"
              apiEndpoint="/api/import/customers"
              entityName="Cliente"
              onSuccess={() => {
                // Aquí podrías invalidar queries de React Query si lo usas
                console.log("Clientes importados exitosamente");
              }}
            />

            <Alert>
              <InfoIcon />
              <AlertTitle>Formato de Clientes</AlertTitle>
              <AlertDescription>
                <ul className="ml-4 mt-2 list-disc space-y-1 text-sm">
                  <li>
                    <strong>rut:</strong> RUT único del cliente (ej:
                    12.345.678-9)
                  </li>
                  <li>
                    <strong>razonSocial:</strong> Nombre legal de la empresa
                    (requerido)
                  </li>
                  <li>
                    <strong>tradeName:</strong> Nombre de fantasía (opcional)
                  </li>
                  <li>
                    <strong>businessActivity:</strong> Actividad económica
                    (opcional)
                  </li>
                  <li>
                    <strong>contact:</strong> Nombre de la persona de contacto
                    (requerido)
                  </li>
                  <li>
                    <strong>phone:</strong> Teléfono de contacto (requerido)
                  </li>
                  <li>
                    <strong>email:</strong> Correo electrónico (opcional)
                  </li>
                  <li>
                    <strong>street:</strong> Calle y numeración (requerido)
                  </li>
                  <li>
                    <strong>apartment:</strong> Casa/Depto (opcional)
                  </li>
                  <li>
                    <strong>region:</strong> Región de Chile (requerido)
                  </li>
                  <li>
                    <strong>comuna:</strong> Comuna (requerido)
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Importación de Facturas */}
          <TabsContent value="invoices" className="space-y-4">
            <ImportUploader
              title="Importar Facturas"
              description="Importe múltiples facturas desde un archivo Excel. Los clientes deben existir previamente. El IVA y total se calculan automáticamente."
              templateData={INVOICE_TEMPLATE_DATA}
              templateFilename="plantilla-facturas.xlsx"
              apiEndpoint="/api/import/invoices"
              entityName="Factura"
              onSuccess={() => {
                console.log("Facturas importadas exitosamente");
              }}
            />

            <Alert>
              <InfoIcon />
              <AlertTitle>Formato de Facturas</AlertTitle>
              <AlertDescription>
                <ul className="ml-4 mt-2 list-disc space-y-1 text-sm">
                  <li>
                    <strong>invoiceNumber:</strong> Número único de factura
                    (requerido)
                  </li>
                  <li>
                    <strong>customerRut:</strong> RUT del cliente (debe existir
                    en el sistema)
                  </li>
                  <li>
                    <strong>subtotal:</strong> Monto sin IVA (requerido, ej:
                    100000 o 100.000)
                  </li>
                  <li>
                    <strong>taxAmount:</strong> Monto del IVA (OPCIONAL). Si se
                    deja vacío, se calcula automáticamente (19%). Para facturas
                    exentas, ingresar 0
                  </li>
                  <li>
                    <strong>issueDate:</strong> Fecha de emisión (DD/MM/YYYY)
                  </li>
                  <li>
                    <strong>dueDate:</strong> Fecha de vencimiento (DD/MM/YYYY)
                  </li>
                  <li>
                    <strong>notes:</strong> Notas adicionales (opcional)
                  </li>
                </ul>
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  Nota: El total se calcula automáticamente como subtotal + IVA.
                  Los pagos deben registrarse después de importar las facturas.
                </p>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
