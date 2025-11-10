import { PrismaClient } from "@prisma/client";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

/**
 * Hash password usando scrypt (mismo algoritmo que Better Auth por defecto)
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  console.log("🌱 Seeding database...");

  // ========================================
  // CREAR USUARIO ADMIN INICIAL
  // ========================================
  console.log("\n👤 Creating initial admin user...");

  const adminEmail = "mvial@cristaluxspa.cl";
  const adminPassword = "Pirula4180";

  // Verificar si ya existe el admin
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    // Crear usuario admin
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        role: "admin", // ROL DE ADMINISTRADOR
        emailVerified: true, // Pre-verificado
      },
    });

    // Hashear la contraseña
    const hashedPassword = await hashPassword(adminPassword);

    // Crear cuenta con contraseña (Better Auth Account model)
    await prisma.account.create({
      data: {
        userId: adminUser.id,
        accountId: adminUser.id, // Better Auth usa esto
        providerId: "credential", // Provider de email/password
        password: hashedPassword,
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(
      "⚠️  IMPORTANTE: Cambia esta contraseña después del primer login",
    );
  } else {
    console.log("✅ Admin user already exists");
    console.log(`📧 Email: ${adminEmail}`);

    // Actualizar role a admin si no lo es
    if (adminUser.role !== "admin") {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { role: "admin" },
      });
      console.log("✅ Updated existing user to admin role");
    }
  }

  // Example: Create demo users (sin contraseñas, solo para referencias)
  const user1 = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      role: "user", // Usuario normal
    },
  });

  console.log("✅ Demo users seed completed");
  console.log("📊 Created/Updated users:", { adminUser, user1 });

  // Seed customers (actualizado con campos completos)
  const customer1 = await prisma.customer.upsert({
    where: { rut: "76543210-1" },
    update: {},
    create: {
      rut: "76543210-1",
      razonSocial: "Comercial Juan Pérez SpA",
      tradeName: "Ferretería El Martillo",
      contact: "Juan Pérez",
      phone: "+56912345678",
      email: "juan.perez@ejemplo.com",
      street: "Av. Providencia 1234",
      apartment: "Local 5",
      region: "Metropolitana de Santiago",
      comuna: "Providencia",
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { rut: "87654321-2" },
    update: {},
    create: {
      rut: "87654321-2",
      razonSocial: "Distribuidora González Ltda",
      tradeName: null,
      contact: "María González",
      phone: "+56987654321",
      email: "maria.gonzalez@ejemplo.com",
      street: "Calle Moneda 567",
      apartment: null,
      region: "Metropolitana de Santiago",
      comuna: "Santiago",
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { rut: "98765432-3" },
    update: {},
    create: {
      rut: "98765432-3",
      razonSocial: "Constructora Sánchez y Asociados SA",
      tradeName: "ConstructoraSA",
      contact: "Pedro Sánchez",
      phone: "+56955555555",
      email: "pedro.sanchez@ejemplo.com",
      street: "Los Aromos 890",
      apartment: null,
      region: "Metropolitana de Santiago",
      comuna: "Las Condes",
    },
  });

  console.log("✅ Customers seed completed");
  console.log("📊 Created/Updated customers:", {
    customer1,
    customer2,
    customer3,
  });

  // Seed badge colors
  const badgeColors = [
    { name: "Gris", key: "gray", bgClass: "bg-gray-500", order: 1 },
    { name: "Rojo", key: "red", bgClass: "bg-red-500", order: 2 },
    { name: "Naranja", key: "orange", bgClass: "bg-orange-500", order: 3 },
    { name: "Amarillo", key: "yellow", bgClass: "bg-yellow-500", order: 4 },
    { name: "Verde", key: "green", bgClass: "bg-green-500", order: 5 },
    { name: "Azul", key: "blue", bgClass: "bg-blue-500", order: 6 },
    { name: "Índigo", key: "indigo", bgClass: "bg-indigo-500", order: 7 },
    { name: "Púrpura", key: "purple", bgClass: "bg-purple-500", order: 8 },
    { name: "Rosa", key: "pink", bgClass: "bg-pink-500", order: 9 },
  ];

  for (const color of badgeColors) {
    await prisma.badgeColor.upsert({
      where: { key: color.key },
      update: {},
      create: color,
    });
  }

  console.log("✅ Badge colors seed completed");
  console.log(`📊 Created/Updated ${badgeColors.length} badge colors`);

  // ========================================
  // SEED INVOICE STATUSES (Temporal)
  // ========================================
  const blueColor = await prisma.badgeColor.findUnique({
    where: { key: "blue" },
  });
  const redColor = await prisma.badgeColor.findUnique({
    where: { key: "red" },
  });
  const greenColor = await prisma.badgeColor.findUnique({
    where: { key: "green" },
  });

  if (!blueColor || !redColor || !greenColor) {
    throw new Error("Badge colors not found");
  }

  // InvoiceStatus: Estados temporales (basados en dueDate)
  const statusCurrent = await prisma.invoiceStatus.upsert({
    where: { name: "current" },
    update: { order: 0 },
    create: {
      name: "current",
      colorId: blueColor.id,
      order: 0,
      isInitial: true,
      isActive: true,
    },
  });

  const statusOverdue = await prisma.invoiceStatus.upsert({
    where: { name: "overdue" },
    update: { order: 10 },
    create: {
      name: "overdue",
      colorId: redColor.id,
      order: 10,
      isActive: true,
    },
  });

  const statusCompleted = await prisma.invoiceStatus.upsert({
    where: { name: "completed" },
    update: { order: 999 },
    create: {
      name: "completed",
      colorId: greenColor.id,
      order: 999,
      isFinal: true,
      isActive: true,
    },
  });

  console.log("✅ Invoice statuses (temporal) seed completed");
  console.log("📊 Created/Updated invoice statuses:", {
    statusCurrent,
    statusOverdue,
    statusCompleted,
  });

  // ========================================
  // SEED PAYMENT INVOICE STATUSES (Financiero)
  // ========================================

  // PaymentInvoiceStatus: Estados financieros (basados en balance/paidAmount)
  const paymentStatusPending = await prisma.paymentInvoiceStatus.upsert({
    where: { name: "pending-payment" },
    update: { order: 0 },
    create: {
      name: "pending-payment",
      colorId: redColor.id,
      order: 0,
      isInitial: true,
      isActive: true,
    },
  });

  const paymentStatusPartial = await prisma.paymentInvoiceStatus.upsert({
    where: { name: "partial-payment" },
    update: { order: 10 },
    create: {
      name: "partial-payment",
      colorId: blueColor.id,
      order: 10,
      isActive: true,
    },
  });

  const paymentStatusPaid = await prisma.paymentInvoiceStatus.upsert({
    where: { name: "paid" },
    update: { order: 999 },
    create: {
      name: "paid",
      colorId: greenColor.id,
      order: 999,
      isFinal: true,
      isActive: true,
    },
  });

  console.log("✅ Payment invoice statuses (financial) seed completed");
  console.log("📊 Created/Updated payment statuses:", {
    paymentStatusPending,
    paymentStatusPartial,
    paymentStatusPaid,
  });

  // Seed payment methods
  const paymentMethods = [
    { name: "Efectivo", icon: "Banknote", order: 1 },
    { name: "Transferencia Bancaria", icon: "ArrowRightLeft", order: 2 },
    { name: "Tarjeta de Débito", icon: "CreditCard", order: 3 },
    { name: "Tarjeta de Crédito", icon: "CreditCard", order: 4 },
    { name: "WebPay", icon: "Smartphone", order: 5 },
    { name: "Khipu", icon: "Smartphone", order: 6 },
    { name: "Mercado Pago", icon: "Wallet", order: 7 },
    { name: "Cheque", icon: "FileText", order: 8 },
  ];

  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { name: method.name },
      update: {},
      create: method,
    });
  }

  console.log("✅ Payment methods seed completed");
  console.log(`📊 Created/Updated ${paymentMethods.length} payment methods`);

  // ========================================
  // TODO: Descomentar cuando se necesiten crear pagos de ejemplo
  // ========================================
  // const efectivo = await prisma.paymentMethod.findUnique({ where: { name: 'Efectivo' } })
  // const transferencia = await prisma.paymentMethod.findUnique({
  //   where: { name: 'Transferencia Bancaria' },
  // })
  // const webpay = await prisma.paymentMethod.findUnique({ where: { name: 'WebPay' } })

  // if (!efectivo || !transferencia || !webpay) {
  //   throw new Error('Payment methods not found')
  // }

  // ========================================
  // NOTA: AftersaleStatus fue removido
  // ========================================
  // Este modelo era específico de Cobralon (ventanas) y no aplica para Cobrolox (facturas)

  // ========================================
  // TODO: Reemplazar con INVOICES cuando se cree el modelo
  // ========================================
  // console.log('\n🧾 Seeding invoices with payment data...')

  /*
  // Cliente 1 (Juan Perez) - 3 facturas antiguas con balance pendiente
  const invoice1 = await prisma.invoice.upsert({
    where: { id: 'b048e142-9cd1-4fd5-834b-51c865d41048' },
    update: {},
    create: {
      id: 'b048e142-9cd1-4fd5-834b-51c865d41048',
      invoiceNumber: '2024-001',
      customerId: customer1.id,
      issueDate: new Date('2024-06-15'),
      dueDate: new Date('2024-07-15'),
      subtotal: 420168.07,
      taxRate: 19,
      total: 500000,
      currency: 'CLP',
      statusId: statusPendiente.id,
      description: 'Servicios de consultoría',
    },
  })

  const project2 = await prisma.project.upsert({
    where: { id: 'a95e768c-fc22-4a4a-91b6-f0f55d318efa' },
    update: {},
    create: {
      id: 'a95e768c-fc22-4a4a-91b6-f0f55d318efa',
      projectNumber: '2024-002',
      projectName: 'Puertas Bodega Norte',
      customerId: customer1.id,
      phone: customer1.phone,
      street: 'Calle Los Aromos 567',
      apartment: null,
      comuna: 'Quilicura',
      region: 'Metropolitana de Santiago',
      projectStatusId: statusEnProgreso.id,
      date: new Date('2024-08-20'), // Agosto 2024
      subtotal: 336134.45,
      taxRate: 19,
      total: 400000,
      totalAmount: 400000,
      currency: 'CLP',
      windowsCount: 4,
      squareMeters: 18.0,
      description: 'Puertas de seguridad para bodega industrial',
    },
  })

  const _project3 = await prisma.project.upsert({
    where: { id: '9304ab76-5508-4c1f-a612-59bbf030b5cb' },
    update: {},
    create: {
      id: '9304ab76-5508-4c1f-a612-59bbf030b5cb',
      projectNumber: '2024-003',
      projectName: 'Ventanas Casa Particular',
      customerId: customer1.id,
      phone: customer1.phone,
      street: 'Pasaje El Roble 89',
      apartment: null,
      comuna: 'Las Condes',
      region: 'Metropolitana de Santiago',
      projectStatusId: statusPendiente.id,
      date: new Date('2024-10-10'), // Octubre 2024
      subtotal: 252100.84,
      taxRate: 19,
      total: 300000,
      totalAmount: 300000,
      currency: 'CLP',
      windowsCount: 6,
      squareMeters: 15.0,
    },
  })

  // Cliente 2 (Maria Gonzalez) - 1 proyecto totalmente pagado
  const project4 = await prisma.project.upsert({
    where: { id: '4de213f6-ccf5-4d66-ac32-37cdb0487e16' },
    update: {},
    create: {
      id: '4de213f6-ccf5-4d66-ac32-37cdb0487e16',
      projectNumber: '2024-004',
      projectName: 'Fachada Completa Edificio',
      customerId: customer2.id,
      phone: customer2.phone,
      street: "Av. Libertador Bernardo O'Higgins 999",
      apartment: null,
      comuna: 'Santiago',
      region: 'Metropolitana de Santiago',
      projectStatusId: statusCompletado.id,
      date: new Date('2024-09-01'), // Septiembre 2024
      subtotal: 672268.91,
      taxRate: 19,
      total: 800000,
      totalAmount: 800000,
      currency: 'CLP',
      windowsCount: 20,
      squareMeters: 80.0,
      description: 'Reemplazo completo de fachada de vidrio',
    },
  })

  // Cliente 3 (Pedro Sanchez) - 2 proyectos sin pagos
  const _project5 = await prisma.project.upsert({
    where: { id: '2f2d9ccf-9fb4-468c-893d-7933c1f9d914' },
    update: {},
    create: {
      id: '2f2d9ccf-9fb4-468c-893d-7933c1f9d914',
      projectNumber: '2024-005',
      projectName: 'Ventanas Departamento',
      customerId: customer3.id,
      phone: customer3.phone,
      street: 'Calle Nueva 456',
      apartment: 'Depto 301',
      comuna: 'Ñuñoa',
      region: 'Metropolitana de Santiago',
      projectStatusId: statusPendiente.id,
      date: new Date('2024-10-25'), // Octubre 2024
      subtotal: 504201.68,
      taxRate: 19,
      total: 600000,
      totalAmount: 600000,
      currency: 'CLP',
      windowsCount: 10,
      squareMeters: 30.0,
    },
  })

  const _project6 = await prisma.project.upsert({
    where: { id: '4931d40a-8e54-4671-a9c8-456ca9334340' },
    update: {},
    create: {
      id: '4931d40a-8e54-4671-a9c8-456ca9334340',
      projectNumber: '2024-006',
      projectName: 'Puertas Local Comercial',
      customerId: customer3.id,
      phone: customer3.phone,
      street: 'Av. Vicuña Mackenna 2000',
      apartment: 'Local 5',
      comuna: 'La Florida',
      region: 'Metropolitana de Santiago',
      projectStatusId: statusPendiente.id,
      date: new Date('2024-11-05'), // Noviembre 2024
      subtotal: 378151.26,
      taxRate: 19,
      total: 450000,
      totalAmount: 450000,
      currency: 'CLP',
      windowsCount: 3,
      squareMeters: 12.0,
    },
  })

  console.log('✅ Projects seed completed')
  console.log('📊 Created/Updated 6 projects with payment data')

  // ========================================
  // SEED PAYMENTS WITH ALLOCATIONS
  // ========================================

  console.log('\n💰 Seeding payments with allocations...')

  // Pago 1 (Cliente 1): $200,000 → Abono parcial a Proyecto #2024-001
  const _payment1 = await prisma.payment.upsert({
    where: { id: '7b8a6d79-2e10-4ae3-b45a-fa06d5fa38b8' },
    update: {},
    create: {
      id: '7b8a6d79-2e10-4ae3-b45a-fa06d5fa38b8',
      amount: 200000,
      currency: 'CLP',
      date: new Date('2024-07-15'),
      reference: null,
      notes: 'Primer abono proyecto oficinas',
      customerId: customer1.id,
      paymentMethodId: efectivo.id,
      allocations: {
        create: [
          {
            projectId: project1.id,
            allocatedAmount: 200000, // Abono parcial
          },
        ],
      },
    },
  })

  // Pago 2 (Cliente 1): $500,000 → FIFO: Cierra #2024-001 ($300k) + Abono a #2024-002 ($200k)
  const _payment2 = await prisma.payment.upsert({
    where: { id: 'e2a0d0dc-d5ad-4cbb-af6f-025b13121a6c' },
    update: {},
    create: {
      id: 'e2a0d0dc-d5ad-4cbb-af6f-025b13121a6c',
      amount: 500000,
      currency: 'CLP',
      date: new Date('2024-09-10'),
      reference: 'TRX-98765432',
      notes: 'Pago que cierra proyecto 001 y abona a 002',
      customerId: customer1.id,
      paymentMethodId: transferencia.id,
      allocations: {
        create: [
          {
            projectId: project1.id,
            allocatedAmount: 300000, // Cierra el balance de 001
          },
          {
            projectId: project2.id,
            allocatedAmount: 200000, // Abono a 002
          },
        ],
      },
    },
  })

  // Pago 3 (Cliente 2): $800,000 → Cierra completamente #2024-004
  const _payment3 = await prisma.payment.upsert({
    where: { id: '2b2d5846-de72-42d2-bc61-3041302498cc' },
    update: {},
    create: {
      id: '2b2d5846-de72-42d2-bc61-3041302498cc',
      amount: 800000,
      currency: 'CLP',
      date: new Date('2024-09-15'),
      reference: 'TRX-11111111',
      notes: 'Pago completo fachada edificio',
      customerId: customer2.id,
      paymentMethodId: transferencia.id,
      allocations: {
        create: [
          {
            projectId: project4.id,
            allocatedAmount: 800000, // Pago completo
          },
        ],
      },
    },
  })

  // Pago 4 (Cliente 1): $100,000 → Abono adicional a #2024-002 (ya tiene $200k, total $300k)
  const _payment4 = await prisma.payment.upsert({
    where: { id: 'b168368d-40d1-4503-8f2a-7133beab3eed' },
    update: {},
    create: {
      id: 'b168368d-40d1-4503-8f2a-7133beab3eed',
      amount: 100000,
      currency: 'CLP',
      date: new Date('2024-10-20'),
      reference: 'WP-555666777',
      notes: 'Abono adicional bodega norte',
      customerId: customer1.id,
      paymentMethodId: webpay.id,
      allocations: {
        create: [
          {
            projectId: project2.id,
            allocatedAmount: 100000, // Segundo abono a 002
          },
        ],
      },
    },
  })

  console.log('✅ Payments seed completed')
  console.log('📊 Created/Updated 4 payments')

  console.log('\n📈 Balance summary:')
  console.log(`  Cliente 1 (${customer1.name}):`)
  console.log(`    - Proyecto 001: $500k - $500k = $0 (PAGADO)`)
  console.log(`    - Proyecto 002: $400k - $300k = $100k pendiente`)
  console.log(`    - Proyecto 003: $300k - $0 = $300k pendiente`)
  console.log(`    Total pendiente: $400k`)
  console.log(`  Cliente 2 (${customer2.name}):`)
  console.log(`    - Proyecto 004: $800k - $800k = $0 (PAGADO)`)
  console.log(`  Cliente 3 (${customer3.name}):`)
  console.log(`    - Proyecto 005: $600k - $0 = $600k pendiente`)
  console.log(`    - Proyecto 006: $450k - $0 = $450k pendiente`)
  console.log(`    Total pendiente: $1,050k`)

  */

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
