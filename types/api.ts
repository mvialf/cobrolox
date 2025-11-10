/**
 * Types for API Routes
 *
 * Este archivo contiene tipos TypeScript para las API routes del proyecto.
 */

import { Prisma } from "@prisma/client";

/**
 * Allocation input para crear pagos
 */
export interface AllocationInput {
  invoiceId: string;
  allocatedAmount: number;
}

/**
 * Tipo para filtros de Prisma Payment
 */
export type PaymentWhereInput = Prisma.PaymentWhereInput;

/**
 * Tipo para filtros de Prisma Invoice
 */
export type InvoiceWhereInput = Prisma.InvoiceWhereInput;

/**
 * Tipo para actualizaciones de Prisma Invoice
 */
export type InvoiceUpdateInput = Prisma.InvoiceUpdateInput;
