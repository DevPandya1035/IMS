import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';

function generateInvoiceNumber(prefix: string = 'INV'): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `${prefix}-${dateStr}-${seq}`;
}

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export const invoiceService = {
  async generateFromSalesOrder(salesOrderId: string, tx?: TransactionClient) {
    const client = tx || prisma;
    const so = await client.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: { items: true },
    });

    if (!so) throw new AppError('Sales order not found.', 404);

    // Check if invoice already exists
    const existing = await client.invoice.findUnique({
      where: { salesOrderId },
    });
    if (existing) return existing;

    // Calculate GST per item
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTaxableAmount = 0;

    const invoiceItems: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      taxableValue: number;
      cgst: number;
      sgst: number;
      lineTotal: number;
    }> = [];

    for (const item of so.items) {
      const netValue = Number(item.quantity) * Number(item.unitPrice);
      const discount = Number(item.discount);
      const taxableValue = netValue - discount;
      const cgst = Math.round(taxableValue * 0.09 * 100) / 100; // 9% CGST
      const sgst = Math.round(taxableValue * 0.09 * 100) / 100; // 9% SGST
      const lineTotal = Math.round((taxableValue + cgst + sgst) * 100) / 100;

      subtotal += netValue;
      totalDiscount += discount;
      totalTaxableAmount += taxableValue;

      invoiceItems.push({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discount,
        taxableValue: Math.round(taxableValue * 100) / 100,
        cgst,
        sgst,
        lineTotal,
      });
    }

    const orderDiscount = Number(so.discount) || 0;
    const orderAdjustment = Number(so.adjustment) || 0;

    totalTaxableAmount = Math.max(0, totalTaxableAmount - orderDiscount);
    totalDiscount += orderDiscount;

    const totalCgst = Math.round(totalTaxableAmount * 0.09 * 100) / 100;
    const totalSgst = Math.round(totalTaxableAmount * 0.09 * 100) / 100;
    const taxAmount = Math.round((totalCgst + totalSgst) * 100) / 100;
    const totalAmount = Math.round((totalTaxableAmount + taxAmount + orderAdjustment) * 100) / 100;

    // Due date: 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await client.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber('INV'),
        salesOrderId,
        customerId: so.customerId,
        subtotal: Math.round(subtotal * 100) / 100,
        discount: Math.round(totalDiscount * 100) / 100,
        adjustment: Math.round(orderAdjustment * 100) / 100,
        taxableAmount: Math.round(totalTaxableAmount * 100) / 100,
        cgstAmount: Math.round(totalCgst * 100) / 100,
        sgstAmount: Math.round(totalSgst * 100) / 100,
        taxAmount,
        totalAmount,
        dueDate,
        items: {
          create: invoiceItems,
        },
      },
      include: { items: true },
    });

    return invoice;
  },

  async generateFromPurchaseOrder(purchaseOrderId: string, tx?: TransactionClient) {
    const client = tx || prisma;
    const po = await client.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: { include: { product: true } } },
    });

    if (!po) throw new AppError('Purchase order not found.', 404);

    // Check if invoice already exists
    const existing = await client.invoice.findUnique({
      where: { purchaseOrderId },
    });
    if (existing) return existing;

    // Calculate GST per item
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTaxableAmount = 0;

    const invoiceItems: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      taxableValue: number;
      cgst: number;
      sgst: number;
      lineTotal: number;
    }> = [];

    for (const item of po.items) {
      const netValue = Number(item.quantity) * Number(item.unitPrice);
      const discount = 0;
      const taxableValue = netValue - discount;
      const cgst = Math.round(taxableValue * 0.09 * 100) / 100; // 9% CGST
      const sgst = Math.round(taxableValue * 0.09 * 100) / 100; // 9% SGST
      const lineTotal = Math.round((taxableValue + cgst + sgst) * 100) / 100;

      subtotal += netValue;
      totalDiscount += discount;
      totalTaxableAmount += taxableValue;

      invoiceItems.push({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discount,
        taxableValue: Math.round(taxableValue * 100) / 100,
        cgst,
        sgst,
        lineTotal,
      });
    }

    const orderDiscount = Number(po.discount) || 0;
    const orderAdjustment = Number(po.adjustment) || 0;

    totalTaxableAmount = Math.max(0, totalTaxableAmount - orderDiscount);
    totalDiscount += orderDiscount;

    const totalCgst = Math.round(totalTaxableAmount * 0.09 * 100) / 100;
    const totalSgst = Math.round(totalTaxableAmount * 0.09 * 100) / 100;
    const taxAmount = Math.round((totalCgst + totalSgst) * 100) / 100;
    const totalAmount = Math.round((totalTaxableAmount + taxAmount + orderAdjustment) * 100) / 100;

    // Due date: 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await client.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber('BILL'),
        purchaseOrderId,
        supplierId: po.supplierId,
        subtotal: Math.round(subtotal * 100) / 100,
        discount: Math.round(totalDiscount * 100) / 100,
        adjustment: Math.round(orderAdjustment * 100) / 100,
        taxableAmount: Math.round(totalTaxableAmount * 100) / 100,
        cgstAmount: Math.round(totalCgst * 100) / 100,
        sgstAmount: Math.round(totalSgst * 100) / 100,
        taxAmount,
        totalAmount,
        dueDate,
        items: {
          create: invoiceItems,
        },
      },
      include: { items: true },
    });

    return invoice;
  },

  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    supplierId?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.customerId) where.customerId = params.customerId;
    if (params.supplierId) where.supplierId = params.supplierId;

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          salesOrder: { select: { id: true, orderNumber: true, customerName: true } },
          purchaseOrder: { select: { id: true, orderNumber: true, supplier: { select: { supplierName: true } } } },
          customer: { select: { id: true, name: true, email: true } },
          supplier: { select: { id: true, supplierName: true, email: true } },
          items: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        salesOrder: {
          include: {
            items: true,
            warehouse: { select: { id: true, warehouseName: true, location: true } },
          },
        },
        purchaseOrder: {
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, sku: true, price: true } },
              },
            },
            supplier: true,
          },
        },
        customer: true,
        supplier: true,
        items: true,
        payments: true,
      },
    });
    if (!invoice) throw new AppError('Invoice not found.', 404);
    return invoice;
  },

  async updateStatus(id: string, status: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new AppError('Invoice not found.', 404);

    const validStatuses = ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid invoice status: ${status}`, 400);
    }

    return prisma.invoice.update({
      where: { id },
      data: { status },
    });
  },

  async recordPayment(input: {
    salesOrderId?: string;
    purchaseOrderId?: string;
    invoiceId?: string;
    amount: number;
    paymentMethod: string;
    reference?: string;
  }) {
    let invoiceId = input.invoiceId;
    let salesOrderId = input.salesOrderId;
    let purchaseOrderId = input.purchaseOrderId;

    if (invoiceId) {
      const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!inv) throw new AppError('Invoice not found.', 404);
      salesOrderId = inv.salesOrderId || undefined;
      purchaseOrderId = inv.purchaseOrderId || undefined;
    }

    if (!salesOrderId && !purchaseOrderId) {
      throw new AppError('Either salesOrderId, purchaseOrderId, or invoiceId is required.', 400);
    }

    if (salesOrderId) {
      const so = await prisma.salesOrder.findUnique({
        where: { id: salesOrderId },
        include: { invoice: true, payments: true },
      });
      if (!so) throw new AppError('Sales order not found.', 404);
      if (!so.invoice) throw new AppError('No invoice found for this sales order.', 404);

      const totalPaid = so.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const invoiceTotal = Number(so.invoice.totalAmount);
      const balance = invoiceTotal - totalPaid;

      if (input.amount > balance) {
        throw new AppError(
          `Payment amount exceeds balance. Remaining: ${balance.toFixed(2)}`,
          400
        );
      }

      return prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            salesOrderId,
            invoiceId: so.invoice!.id,
            amount: input.amount,
            paymentMethod: input.paymentMethod,
            reference: input.reference || null,
          },
        });

        const newTotalPaid = totalPaid + input.amount;
        const newBalance = invoiceTotal - newTotalPaid;

        let invoiceStatus = 'PARTIAL';
        if (newBalance <= 0) {
          invoiceStatus = 'PAID';
          await tx.salesOrder.update({
            where: { id: salesOrderId! },
            data: { isPaid: true },
          });
        }

        await tx.invoice.update({
          where: { id: so.invoice!.id },
          data: { status: invoiceStatus },
        });

        return payment;
      });
    } else {
      // purchaseOrderId is provided
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: { invoice: true, payments: true },
      });
      if (!po) throw new AppError('Purchase order not found.', 404);
      if (!po.invoice) throw new AppError('No invoice found for this purchase order.', 404);

      const totalPaid = po.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const invoiceTotal = Number(po.invoice.totalAmount);
      const balance = invoiceTotal - totalPaid;

      if (input.amount > balance) {
        throw new AppError(
          `Payment amount exceeds balance. Remaining: ${balance.toFixed(2)}`,
          400
        );
      }

      return prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            purchaseOrderId,
            invoiceId: po.invoice!.id,
            amount: input.amount,
            paymentMethod: input.paymentMethod,
            reference: input.reference || null,
          },
        });

        const newTotalPaid = totalPaid + input.amount;
        const newBalance = invoiceTotal - newTotalPaid;

        let invoiceStatus = 'PARTIAL';
        if (newBalance <= 0) {
          invoiceStatus = 'PAID';
        }

        await tx.invoice.update({
          where: { id: po.invoice!.id },
          data: { status: invoiceStatus },
        });

        return payment;
      });
    }
  },

  async listPayments(params: {
    page?: number;
    limit?: number;
    salesOrderId?: string;
    purchaseOrderId?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};
    if (params.salesOrderId) where.salesOrderId = params.salesOrderId;
    if (params.purchaseOrderId) where.purchaseOrderId = params.purchaseOrderId;

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          salesOrder: { select: { id: true, orderNumber: true, customerName: true } },
          purchaseOrder: { select: { id: true, orderNumber: true, supplier: { select: { supplierName: true } } } },
          invoice: { select: { id: true, invoiceNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
};
