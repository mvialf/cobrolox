"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Check, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type InvitationStatus = "active" | "used" | "expired";

type Invitation = {
  id: string;
  email: string;
  token: string;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    name: string;
    email: string;
  };
  status: InvitationStatus;
  url: string;
};

type InvitationsResponse = {
  invitations: Invitation[];
  total: number;
  active: number;
  used: number;
  expired: number;
};

/**
 * Página de Gestión de Invitaciones (Solo Admin)
 *
 * Permite a usuarios admin:
 * - Generar links de invitación para nuevos usuarios
 * - Ver todas las invitaciones generadas
 * - Copiar links de invitación
 * - Ver el estado de cada invitación
 */
export default function InvitationsPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingInvitations, setFetchingInvitations] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [invitations, setInvitations] = useState<InvitationsResponse | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Cargar invitaciones al montar el componente
  useEffect(() => {
    fetchInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInvitations = async () => {
    try {
      setFetchingInvitations(true);
      const response = await fetch("/api/invitations");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al cargar invitaciones");
      }

      const data = await response.json();
      setInvitations(data);
    } catch (err) {
      console.error("Error fetching invitations:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Error al cargar invitaciones",
        variant: "destructive",
      });
    } finally {
      setFetchingInvitations(false);
    }
  };

  const handleGenerateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/invitations/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al generar invitación");
      }

      setSuccess(data.message);
      setEmail(""); // Limpiar el input

      // Copiar automáticamente la URL al portapapeles
      await navigator.clipboard.writeText(data.invitation.url);

      toast({
        title: "¡Invitación generada!",
        description: "El link ha sido copiado al portapapeles.",
      });

      // Recargar la lista de invitaciones
      await fetchInvitations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al generar invitación",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (url: string, invitationId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(invitationId);
      toast({
        title: "Copiado",
        description: "Link de invitación copiado al portapapeles.",
      });

      // Resetear el estado de copiado después de 2 segundos
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (_err) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: InvitationStatus) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500">
            Activa
          </Badge>
        );
      case "used":
        return (
          <Badge variant="secondary" className="bg-blue-500">
            Usada
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive" className="bg-gray-500">
            Expirada
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Card para generar invitación */}
      <Card>
        <CardHeader>
          <CardTitle>Generar Invitación</CardTitle>
          <CardDescription>
            Crea un link de invitación para un nuevo usuario. El link expirará
            en 7 días.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateInvitation} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50">
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email del Usuario</Label>
              <Input
                id="email"
                type="email"
                placeholder="[email protected]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Generando..." : "Generar Invitación"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Card para listar invitaciones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invitaciones Generadas</CardTitle>
            <CardDescription>
              {invitations &&
                `Total: ${invitations.total} | Activas: ${invitations.active} | Usadas: ${invitations.used} | Expiradas: ${invitations.expired}`}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchInvitations}
            disabled={fetchingInvitations}
          >
            <RefreshCw
              className={`h-4 w-4 ${fetchingInvitations ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>
        <CardContent>
          {fetchingInvitations ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : invitations && invitations.invitations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Usada</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.email}
                    </TableCell>
                    <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(invitation.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(invitation.expiresAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invitation.usedAt ? formatDate(invitation.usedAt) : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(invitation.url, invitation.id)
                        }
                        disabled={invitation.status !== "active"}
                      >
                        {copiedId === invitation.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay invitaciones generadas aún.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
