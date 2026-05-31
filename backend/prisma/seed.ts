import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const PERMISSIONS = [
  'VIEW_PRODUCT',
  'CREATE_PRODUCT',
  'UPDATE_PRODUCT',
  'DELETE_PRODUCT',
  'STOCK_IN',
  'STOCK_OUT',
  'TRANSFER_STOCK',
  'CREATE_PO',
  'APPROVE_PO',
  'RECEIVE_PO',
  'CREATE_SO',
  'CONFIRM_SO',
  'SHIP_SO',
  'PAY_SO',
  'VIEW_INVOICE',
  'SEND_INVOICE',
  'VIEW_REPORTS',
  'VIEW_FORECAST',
  'VIEW_AUDIT_LOGS',
  'MANAGE_USERS',
  'MANAGE_WAREHOUSES',
  'MANAGE_CATEGORIES',
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: PERMISSIONS,
  Manager: [
    'VIEW_PRODUCT', 'CREATE_PRODUCT', 'UPDATE_PRODUCT',
    'STOCK_IN', 'STOCK_OUT', 'TRANSFER_STOCK',
    'CREATE_PO', 'APPROVE_PO', 'RECEIVE_PO',
    'CREATE_SO', 'CONFIRM_SO', 'SHIP_SO', 'PAY_SO',
    'VIEW_INVOICE', 'SEND_INVOICE',
    'VIEW_REPORTS', 'VIEW_FORECAST',
    'MANAGE_WAREHOUSES', 'MANAGE_CATEGORIES',
  ],
  Staff: [
    'VIEW_PRODUCT', 'CREATE_PRODUCT', 'UPDATE_PRODUCT',
    'STOCK_IN', 'STOCK_OUT', 'TRANSFER_STOCK',
    'CREATE_PO', 'RECEIVE_PO',
    'CREATE_SO', 'CONFIRM_SO', 'SHIP_SO',
  ],
  Auditor: [
    'VIEW_PRODUCT',
    'VIEW_INVOICE',
    'VIEW_REPORTS',
    'VIEW_FORECAST',
    'VIEW_AUDIT_LOGS',
  ],
};

async function main() {
  console.log('Clearing database tables...');
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.salesOrderItem.deleteMany({});
  await prisma.salesOrder.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.inventoryMovement.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding database with Enthrall Foods Private Limited data...');

  // Create permissions
  const permissionRecords: Record<string, string> = {};
  for (const perm of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { permissionName: perm },
      update: {},
      create: { permissionName: perm },
    });
    permissionRecords[perm] = record.id;
  }
  console.log(`Created ${PERMISSIONS.length} permissions`);

  // Create roles and assign permissions
  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { roleName },
      update: {},
      create: { roleName },
    });

    for (const perm of perms) {
      const permId = permissionRecords[perm];
      if (!permId) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permId },
        },
        update: {},
        create: { roleId: role.id, permissionId: permId },
      });
    }
    console.log(`Role "${roleName}" created/updated with ${perms.length} permissions`);
  }

  // Retrieve roles for users
  const adminRole = await prisma.role.findUnique({ where: { roleName: 'Admin' } });
  const managerRole = await prisma.role.findUnique({ where: { roleName: 'Manager' } });
  const staffRole = await prisma.role.findUnique({ where: { roleName: 'Staff' } });
  const auditorRole = await prisma.role.findUnique({ where: { roleName: 'Auditor' } });

  if (!adminRole || !managerRole || !staffRole || !auditorRole) {
    throw new Error('Failed to retrieve seeded roles');
  }

  // Create users
  const pwAdmin = await argon2.hash('Admin@1234', { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
  const pwManager = await argon2.hash('Manager@1234', { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
  const pwStaff = await argon2.hash('Staff@1234', { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
  const pwAuditor = await argon2.hash('Auditor@1234', { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
  const pwSysAdmin = await argon2.hash('Admin@123', { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });

  const usersData = [
    { id: "usr-001", name: "S. Dave", email: "sdave@enthrallfoods.com", passwordHash: pwAdmin, roleId: adminRole.id, isActive: true },
    { id: "usr-002", name: "Ravi Mehta", email: "ravi.mehta@enthrallfoods.com", passwordHash: pwManager, roleId: managerRole.id, isActive: true },
    { id: "usr-003", name: "Priya Shah", email: "priya.shah@enthrallfoods.com", passwordHash: pwStaff, roleId: staffRole.id, isActive: true },
    { id: "usr-004", name: "Ankit Joshi", email: "ankit.joshi@enthrallfoods.com", passwordHash: pwAuditor, roleId: auditorRole.id, isActive: true },
    { id: "admin-system", name: "System Admin", email: "admin@ims.com", passwordHash: pwSysAdmin, roleId: adminRole.id, isActive: true }
  ];

  for (const user of usersData) {
    await prisma.user.create({ data: user });
  }
  console.log(`Seeded ${usersData.length} users`);

  // Seed Categories
  const categoriesData = [
    { id: "cat-001", categoryName: "Food Seasoning",   description: "Oregano, cheese, Italian, BBQ and other food seasonings" },
    { id: "cat-002", categoryName: "Chilli Flakes",    description: "Dried and crushed red chilli flakes in various pack sizes" },
    { id: "cat-003", categoryName: "Spice Herbs",      description: "Dried mixed herbs, thyme, rosemary, basil leaves" },
    { id: "cat-004", categoryName: "Garlic Products",  description: "Dry garlic powder and garlic flakes" },
    { id: "cat-005", categoryName: "Ginger Products",  description: "Dried ginger powder and related products" },
    { id: "cat-006", categoryName: "Oregano",          description: "Oregano leaves and herbs in bulk and retail packs" },
    { id: "cat-007", categoryName: "Paprika",          description: "Red paprika powder" },
    { id: "cat-008", categoryName: "Marinades",        description: "Ready-mix marinades for tikka, tandoori, and grilling" }
  ];

  for (const cat of categoriesData) {
    await prisma.category.create({ data: cat });
  }
  console.log(`Seeded ${categoriesData.length} categories`);

  // Seed Suppliers
  const suppliersData = [
    {
      id: "sup-001",
      supplierName: "Agro Fresh Spices Pvt. Ltd.",
      contactPerson: "Harish Patel",
      email: "supply@agrofresh.in",
      phone: "+91-7600112233",
      address: "Unjha, Mehsana, Gujarat – 384170",
      avgLeadTimeDays: 7,
      maxLeadTimeDays: 14,
      isActive: true
    },
    {
      id: "sup-002",
      supplierName: "Herb World Exports",
      contactPerson: "Sunita Varma",
      email: "orders@herbworld.co.in",
      phone: "+91-9920445566",
      address: "APMC Market, Vashi, Navi Mumbai – 400703",
      avgLeadTimeDays: 5,
      maxLeadTimeDays: 12,
      isActive: true
    },
    {
      id: "sup-003",
      supplierName: "Rajasthan Masala House",
      contactPerson: "Vikram Singh",
      email: "vikram@rajmasala.com",
      phone: "+91-9414223344",
      address: "Jodhpur Industrial Area, Jodhpur, Rajasthan – 342001",
      avgLeadTimeDays: 10,
      maxLeadTimeDays: 17,
      isActive: true
    },
    {
      id: "sup-004",
      supplierName: "Gujarat Packaging Solutions",
      contactPerson: "Nilesh Bhatt",
      email: "nilesh@gpsolns.in",
      phone: "+91-9904567890",
      address: "Naroda Industrial Estate, Ahmedabad – 382330",
      avgLeadTimeDays: 3,
      maxLeadTimeDays: 10,
      isActive: true
    }
  ];

  for (const sup of suppliersData) {
    await prisma.supplier.create({ data: sup });
  }
  console.log(`Seeded ${suppliersData.length} suppliers`);

  // Seed Products
  const productsData = [
    {
      id: "prd-001",
      name: "Invictus Oregano Seasoning 500g",
      sku: "INV-SEA-ORE-500",
      barcode: "8901234560010",
      categoryId: "cat-001",
      supplierId: "sup-002",
      description: "Premium dried oregano seasoning in 500g resealable pack. Ideal for pizzas and pasta.",
      price: 280.00,
      costPrice: 160.00,
      quantity: 350,
      reorderLevel: 50,
      expiryDate: new Date("2026-08-31"),
      isActive: true
    },
    {
      id: "prd-002",
      name: "Invictus Oregano Seasoning Sachet 10g",
      sku: "INV-SEA-ORE-10S",
      barcode: "8901234560011",
      categoryId: "cat-001",
      supplierId: "sup-002",
      description: "Single-serve oregano seasoning sachet, 0.8g each. Supplied in box of 100 sachets.",
      price: 150.00,
      costPrice: 80.00,
      quantity: 800,
      reorderLevel: 100,
      expiryDate: new Date("2026-11-30"),
      isActive: true
    },
    {
      id: "prd-003",
      name: "Invictus Tandoori Tikka Marinade 500g",
      sku: "INV-MAR-TAN-500",
      barcode: "8901234560012",
      categoryId: "cat-008",
      supplierId: "sup-003",
      description: "Ready-mix marinade for tandoori tikka. Blend of spices for authentic flavour.",
      price: 280.00,
      costPrice: 155.00,
      quantity: 220,
      reorderLevel: 40,
      expiryDate: new Date("2026-07-15"),
      isActive: true
    },
    {
      id: "prd-004",
      name: "Invictus Cheese Seasoning 500g",
      sku: "INV-SEA-CHE-500",
      barcode: "8901234560013",
      categoryId: "cat-001",
      supplierId: "sup-002",
      description: "Flavoured cheese seasoning for snacks, popcorn, and baked goods.",
      price: 350.00,
      costPrice: 195.00,
      quantity: 180,
      reorderLevel: 30,
      expiryDate: new Date("2026-10-31"),
      isActive: true
    },
    {
      id: "prd-005",
      name: "Invictus Italian Seasoning 250g",
      sku: "INV-SEA-ITA-250",
      barcode: "8901234560014",
      categoryId: "cat-001",
      supplierId: "sup-002",
      description: "Classic Italian herb blend: oregano, basil, thyme, rosemary and marjoram.",
      price: 97.00,
      costPrice: 55.00,
      quantity: 400,
      reorderLevel: 60,
      expiryDate: new Date("2026-12-31"),
      isActive: true
    },
    {
      id: "prd-006",
      name: "Invictus Chilli Flakes Sprinkler 500g",
      sku: "INV-CFL-SPR-500",
      barcode: "8901234560020",
      categoryId: "cat-002",
      supplierId: "sup-001",
      description: "Coarse red chilli flakes in a convenient sprinkler bottle. Hot and spicy.",
      price: 380.00,
      costPrice: 210.00,
      quantity: 270,
      reorderLevel: 45,
      expiryDate: new Date("2027-01-31"),
      isActive: true
    },
    {
      id: "prd-007",
      name: "Invictus Chilli Flakes Sachet 0.8g",
      sku: "INV-CFL-SAC-08",
      barcode: "8901234560021",
      categoryId: "cat-002",
      supplierId: "sup-001",
      description: "Single-serve chilli flakes sachet pack of 100. Used in QSR and food service.",
      price: 150.00,
      costPrice: 75.00,
      quantity: 1200,
      reorderLevel: 200,
      expiryDate: new Date("2026-09-30"),
      isActive: true
    },
    {
      id: "prd-008",
      name: "Invictus Chilli Flakes 1kg Bulk",
      sku: "INV-CFL-BLK-1KG",
      barcode: "8901234560022",
      categoryId: "cat-002",
      supplierId: "sup-001",
      description: "Bulk 1kg pack of premium chilli flakes for restaurants and food processors.",
      price: 260.00,
      costPrice: 140.00,
      quantity: 500,
      reorderLevel: 80,
      expiryDate: new Date("2027-03-31"),
      isActive: true
    },
    {
      id: "prd-009",
      name: "Invictus Hot Red Chilli Flakes 200g",
      sku: "INV-CFL-HOT-200",
      barcode: "8901234560023",
      categoryId: "cat-002",
      supplierId: "sup-001",
      description: "Extra-hot red chilli flakes in a 200g retail pack.",
      price: 110.00,
      costPrice: 60.00,
      quantity: 320,
      reorderLevel: 50,
      expiryDate: new Date("2026-08-15"),
      isActive: true
    },
    {
      id: "prd-010",
      name: "Invictus Dried Mixed Herbs 37g",
      sku: "INV-HRB-MIX-37",
      barcode: "8901234560030",
      categoryId: "cat-003",
      supplierId: "sup-002",
      description: "Mixed dried herbs blend — thyme, oregano, basil, marjoram. 37g retail shaker.",
      price: 22.57,
      costPrice: 12.00,
      quantity: 650,
      reorderLevel: 100,
      expiryDate: new Date("2026-11-15"),
      isActive: true
    },
    {
      id: "prd-011",
      name: "Invictus Dry Thyme Leaves 1kg",
      sku: "INV-HRB-THY-1KG",
      barcode: "8901234560031",
      categoryId: "cat-003",
      supplierId: "sup-002",
      description: "Sun-dried thyme leaves, premium quality. 1kg bulk pack.",
      price: 595.00,
      costPrice: 340.00,
      quantity: 140,
      reorderLevel: 25,
      expiryDate: new Date("2027-02-28"),
      isActive: true
    },
    {
      id: "prd-012",
      name: "Invictus Oregano Herbs 500g",
      sku: "INV-HRB-ORE-500",
      barcode: "8901234560032",
      categoryId: "cat-006",
      supplierId: "sup-002",
      description: "Whole dried oregano herb leaves in 500g pack.",
      price: 140.00,
      costPrice: 78.00,
      quantity: 430,
      reorderLevel: 60,
      expiryDate: new Date("2027-01-15"),
      isActive: true
    },
    {
      id: "prd-013",
      name: "Invictus Dried Rosemary Leaves 100g",
      sku: "INV-HRB-ROS-100",
      barcode: "8901234560033",
      categoryId: "cat-003",
      supplierId: "sup-002",
      description: "Fragrant dried rosemary leaves for Mediterranean and grilled dishes.",
      price: 120.00,
      costPrice: 65.00,
      quantity: 190,
      reorderLevel: 30,
      expiryDate: new Date("2026-10-01"),
      isActive: true
    },
    {
      id: "prd-014",
      name: "Invictus Dried Basil Leaves 1kg",
      sku: "INV-HRB-BAS-1KG",
      barcode: "8901234560034",
      categoryId: "cat-003",
      supplierId: "sup-002",
      description: "Premium dried sweet basil leaves in 1kg bulk pack.",
      price: 220.00,
      costPrice: 120.00,
      quantity: 210,
      reorderLevel: 35,
      expiryDate: new Date("2027-04-30"),
      isActive: true
    },
    {
      id: "prd-015",
      name: "Invictus Ginger Powder 500g",
      sku: "INV-GNG-PWD-500",
      barcode: "8901234560040",
      categoryId: "cat-005",
      supplierId: "sup-001",
      description: "Pure sun-dried ginger powder with no additives. 500g packet.",
      price: 385.00,
      costPrice: 220.00,
      quantity: 280,
      reorderLevel: 40,
      expiryDate: new Date("2026-12-15"),
      isActive: true
    },
    {
      id: "prd-016",
      name: "Invictus Dry Garlic Powder 1kg",
      sku: "INV-GAR-PWD-1KG",
      barcode: "8901234560041",
      categoryId: "cat-004",
      supplierId: "sup-003",
      description: "Fine-grind dry garlic powder from dehydrated garlic cloves. 1kg bulk.",
      price: 210.00,
      costPrice: 115.00,
      quantity: 360,
      reorderLevel: 55,
      expiryDate: new Date("2027-06-30"),
      isActive: true
    },
    {
      id: "prd-017",
      name: "Invictus Dry Garlic Flakes 1kg",
      sku: "INV-GAR-FLK-1KG",
      barcode: "8901234560042",
      categoryId: "cat-004",
      supplierId: "sup-003",
      description: "Coarse-cut dehydrated garlic flakes for soups, sauces and marinades.",
      price: 100.00,
      costPrice: 52.00,
      quantity: 480,
      reorderLevel: 70,
      expiryDate: new Date("2027-05-31"),
      isActive: true
    },
    {
      id: "prd-018",
      name: "Invictus Oregano Leaves 1kg Bulk",
      sku: "INV-ORE-LVS-1KG",
      barcode: "8901234560050",
      categoryId: "cat-006",
      supplierId: "sup-002",
      description: "Whole dried oregano leaves in 1kg bulk catering pack.",
      price: 280.00,
      costPrice: 155.00,
      quantity: 310,
      reorderLevel: 50,
      expiryDate: new Date("2027-02-14"),
      isActive: true
    },
    {
      id: "prd-019",
      name: "Invictus Thyme Leaves 500g",
      sku: "INV-THY-LVS-500",
      barcode: "8901234560051",
      categoryId: "cat-003",
      supplierId: "sup-002",
      description: "Dried thyme leaves in 500g resealable packet.",
      price: 152.50,
      costPrice: 86.00,
      quantity: 175,
      reorderLevel: 30,
      expiryDate: new Date("2026-09-20"),
      isActive: true
    },
    {
      id: "prd-020",
      name: "Invictus Red Paprika Powder 1kg",
      sku: "INV-PAP-PWD-1KG",
      barcode: "8901234560060",
      categoryId: "cat-007",
      supplierId: "sup-001",
      description: "Vibrant red paprika powder from premium Kashmiri and Hungarian varieties.",
      price: 120.00,
      costPrice: 65.00,
      quantity: 390,
      reorderLevel: 60,
      expiryDate: new Date("2027-03-15"),
      isActive: true
    }
  ];

  for (const prod of productsData) {
    await prisma.product.create({ data: prod });
  }
  console.log(`Seeded ${productsData.length} products`);

  // Seed Warehouses
  const warehousesData = [
    {
      id: "wh-001",
      warehouseName: "Odhav Main Warehouse",
      location: "Plot 14, GIDC Odhav, Ahmedabad – 382415",
      isActive: true
    },
    {
      id: "wh-002",
      warehouseName: "Naroda Storage Facility",
      location: "Shed 7B, Naroda Industrial Area, Ahmedabad – 382330",
      isActive: true
    },
    {
      id: "wh-003",
      warehouseName: "Surat Distribution Centre",
      location: "Sachin GIDC, Surat, Gujarat – 394230",
      isActive: true
    }
  ];

  for (const wh of warehousesData) {
    await prisma.warehouse.create({ data: wh });
  }
  console.log(`Seeded ${warehousesData.length} warehouses`);

  // Seed Inventory records
  const inventoryData = [
    { productId: "prd-001", warehouseId: "wh-001", quantity: 200, binLocation: "A-01-R1-B2" },
    { productId: "prd-001", warehouseId: "wh-002", quantity: 150, binLocation: "B-02-R3-B1" },
    { productId: "prd-002", warehouseId: "wh-001", quantity: 500, binLocation: "A-01-R1-B3" },
    { productId: "prd-002", warehouseId: "wh-003", quantity: 300, binLocation: "C-01-R2-B1" },
    { productId: "prd-003", warehouseId: "wh-001", quantity: 220, binLocation: "A-02-R1-B1" },
    { productId: "prd-004", warehouseId: "wh-001", quantity: 100, binLocation: "A-02-R1-B2" },
    { productId: "prd-004", warehouseId: "wh-002", quantity: 80,  binLocation: "B-01-R1-B4" },
    { productId: "prd-005", warehouseId: "wh-001", quantity: 250, binLocation: "A-02-R2-B1" },
    { productId: "prd-005", warehouseId: "wh-003", quantity: 150, binLocation: "C-01-R3-B2" },
    { productId: "prd-006", warehouseId: "wh-001", quantity: 180, binLocation: "A-03-R1-B1" },
    { productId: "prd-006", warehouseId: "wh-002", quantity: 90,  binLocation: "B-02-R2-B2" },
    { productId: "prd-007", warehouseId: "wh-001", quantity: 700, binLocation: "A-03-R1-B2" },
    { productId: "prd-007", warehouseId: "wh-003", quantity: 500, binLocation: "C-02-R1-B1" },
    { productId: "prd-008", warehouseId: "wh-001", quantity: 300, binLocation: "A-03-R2-B1" },
    { productId: "prd-009", warehouseId: "wh-001", quantity: 200, binLocation: "A-03-R2-B2" },
    { productId: "prd-010", warehouseId: "wh-001", quantity: 400, binLocation: "A-04-R1-B1" },
    { productId: "prd-010", warehouseId: "wh-003", quantity: 250, binLocation: "C-02-R2-B1" },
    { productId: "prd-011", warehouseId: "wh-001", quantity: 100, binLocation: "A-04-R1-B2" },
    { productId: "prd-012", warehouseId: "wh-001", quantity: 300, binLocation: "A-04-R2-B1" },
    { productId: "prd-013", warehouseId: "wh-001", quantity: 120, binLocation: "A-04-R2-B2" },
    { productId: "prd-014", warehouseId: "wh-001", quantity: 130, binLocation: "A-04-R3-B1" },
    { productId: "prd-015", warehouseId: "wh-001", quantity: 200, binLocation: "A-05-R1-B1" },
    { productId: "prd-015", warehouseId: "wh-002", quantity: 80,  binLocation: "B-03-R1-B1" },
    { productId: "prd-016", warehouseId: "wh-001", quantity: 220, binLocation: "A-05-R1-B2" },
    { productId: "prd-017", warehouseId: "wh-001", quantity: 300, binLocation: "A-05-R2-B1" },
    { productId: "prd-017", warehouseId: "wh-002", quantity: 180, binLocation: "B-03-R2-B1" },
    { productId: "prd-018", warehouseId: "wh-001", quantity: 200, binLocation: "A-05-R2-B2" },
    { productId: "prd-019", warehouseId: "wh-001", quantity: 120, binLocation: "A-05-R3-B1" },
    { productId: "prd-020", warehouseId: "wh-001", quantity: 250, binLocation: "A-06-R1-B1" },
    { productId: "prd-020", warehouseId: "wh-003", quantity: 140, binLocation: "C-03-R1-B1" }
  ];

  for (const inv of inventoryData) {
    await prisma.inventory.create({ data: inv });
  }
  console.log(`Seeded ${inventoryData.length} inventory records`);

  // Seed Customers
  const customersData = [
    {
      id: "cus-001",
      name: "Pizza Express Ahmedabad",
      email: "purchase@pizzaexpressahm.com",
      phone: "+91-9099001122",
      address: "SG Highway, Prahlad Nagar, Ahmedabad – 380015",
      gstin: "24AABCP1234L1ZA",
      isActive: true
    },
    {
      id: "cus-002",
      name: "Reliance Smart Point – Surat",
      email: "reliance.surat.purchase@ril.com",
      phone: "+91-9825334455",
      address: "VR Mall, Dumas Road, Surat – 395007",
      gstin: "24AAACR5055R1ZA",
      isActive: true
    },
    {
      id: "cus-003",
      name: "Hotel Grand Bhagwati",
      email: "kitchen@grandbhagwati.com",
      phone: "+91-9825112200",
      address: "SG Highway, Bodakdev, Ahmedabad – 380054",
      gstin: "24AABCH4567M1ZB",
      isActive: true
    },
    {
      id: "cus-004",
      name: "Swiggy Instamart Fulfilment – Vadodara",
      email: "vendor.vadodara@swiggy.in",
      phone: "+91-9067889900",
      address: "Waghodia Road, Vadodara – 390019",
      gstin: "24AAACS6070R1Z5",
      isActive: true
    },
    {
      id: "cus-005",
      name: "Kirana King Wholesale Mart",
      email: "jaimin@kiranaking.in",
      phone: "+91-9824556677",
      address: "Maninagar Commercial Zone, Ahmedabad – 380008",
      gstin: "24AABCK9876K1ZC",
      isActive: true
    },
    {
      id: "cus-006",
      name: "Domino's Franchisee – Rajkot",
      email: "ops.rajkot@dpzfranchise.in",
      phone: "+91-9033112345",
      address: "Kalawad Road, Rajkot – 360005",
      gstin: "24AABCD2201F1ZD",
      isActive: true
    }
  ];

  for (const cust of customersData) {
    await prisma.customer.create({ data: cust });
  }
  console.log(`Seeded ${customersData.length} customers`);

  // Seed Purchase Orders
  const purchaseOrdersData = [
    {
      id: "po-001",
      orderNumber: "PO-20260412-0001",
      supplierId: "sup-002",
      status: "RECEIVED",
      totalAmount: 48500.00,
      approvedBy: "usr-002",
      approvedAt: new Date("2026-04-12T10:30:00Z"),
      createdBy: "usr-003",
      notes: "Monthly herb restock — Herb World Exports",
      items: [
        { productId: "prd-001", quantity: 100, unitPrice: 160.00 },
        { productId: "prd-005", quantity: 100, unitPrice: 55.00 },
        { productId: "prd-012", quantity: 150, unitPrice: 78.00 },
        { productId: "prd-014", quantity: 80,  unitPrice: 120.00 }
      ]
    },
    {
      id: "po-002",
      orderNumber: "PO-20260501-0002",
      supplierId: "sup-001",
      status: "APPROVED",
      totalAmount: 72800.00,
      approvedBy: "usr-001",
      approvedAt: new Date("2026-05-02T09:00:00Z"),
      createdBy: "usr-003",
      notes: "Large chilli flakes restock. Above ₹50K — Manager approved.",
      items: [
        { productId: "prd-006", quantity: 120, unitPrice: 210.00 },
        { productId: "prd-008", quantity: 140, unitPrice: 140.00 },
        { productId: "prd-020", quantity: 80,  unitPrice: 65.00 }
      ]
    },
    {
      id: "po-003",
      orderNumber: "PO-20260518-0003",
      supplierId: "sup-003",
      status: "PENDING",
      totalAmount: 35700.00,
      approvedBy: null,
      approvedAt: null,
      createdBy: "usr-003",
      notes: "Garlic product restock from Rajasthan Masala House",
      items: [
        { productId: "prd-016", quantity: 150, unitPrice: 115.00 },
        { productId: "prd-017", quantity: 200, unitPrice: 52.00 }
      ]
    }
  ];

  for (const po of purchaseOrdersData) {
    const { items, ...poData } = po;
    await prisma.purchaseOrder.create({
      data: {
        ...poData,
        items: {
          create: items
        }
      }
    });
  }
  console.log(`Seeded ${purchaseOrdersData.length} purchase orders`);

  // Seed Sales Orders
  const salesOrdersData = [
    {
      id: "so-001",
      orderNumber: "SO-20260510-0001",
      customerId: "cus-001",
      customerName: "Pizza Express Ahmedabad",
      warehouseId: "wh-001",
      status: "DELIVERED",
      isPaid: true,
      totalAmount: 22392.98,
      createdBy: "usr-003",
      items: [
        { productId: "prd-001", productName: "Invictus Oregano Seasoning 500g", quantity: 40, unitPrice: 280.00, discount: 0 },
        { productId: "prd-006", productName: "Invictus Chilli Flakes Sprinkler 500g", quantity: 20, unitPrice: 380.00, discount: 500.00 },
        { productId: "prd-010", productName: "Invictus Dried Mixed Herbs 37g", quantity: 30, unitPrice: 22.57, discount: 0 }
      ]
    },
    {
      id: "so-002",
      orderNumber: "SO-20260515-0002",
      customerId: "cus-005",
      customerName: "Kirana King Wholesale Mart",
      warehouseId: "wh-001",
      status: "SHIPPED",
      isPaid: false,
      totalAmount: 61124.00,
      createdBy: "usr-002",
      items: [
        { productId: "prd-008", productName: "Invictus Chilli Flakes 1kg Bulk", quantity: 100, unitPrice: 260.00, discount: 0 },
        { productId: "prd-016", productName: "Invictus Dry Garlic Powder 1kg", quantity: 80,  unitPrice: 210.00, discount: 0 },
        { productId: "prd-017", productName: "Invictus Dry Garlic Flakes 1kg", quantity: 100, unitPrice: 100.00, discount: 1000.00 }
      ]
    },
    {
      id: "so-003",
      orderNumber: "SO-20260520-0003",
      customerId: "cus-004",
      customerName: "Swiggy Instamart Fulfilment – Vadodara",
      warehouseId: "wh-003",
      status: "CONFIRMED",
      isPaid: false,
      totalAmount: 16992.00,
      createdBy: "usr-003",
      items: [
        { productId: "prd-002", productName: "Invictus Oregano Seasoning Sachet 10g", quantity: 50, unitPrice: 150.00, discount: 0 },
        { productId: "prd-007", productName: "Invictus Chilli Flakes Sachet 0.8g", quantity: 30, unitPrice: 150.00, discount: 0 },
        { productId: "prd-020", productName: "Invictus Red Paprika Powder 1kg", quantity: 20, unitPrice: 120.00, discount: 0 }
      ]
    }
  ];

  for (const so of salesOrdersData) {
    const { items, ...soData } = so;
    await prisma.salesOrder.create({
      data: {
        ...soData,
        items: {
          create: items
        }
      }
    });
  }
  console.log(`Seeded ${salesOrdersData.length} sales orders`);

  // Seed Invoices (including line items matching the sample GST format)
  await prisma.invoice.create({
    data: {
      id: "inv-001",
      invoiceNumber: "INV-20260510-0001",
      salesOrderId: "so-001",
      customerId: "cus-001",
      subtotal: 19577.10,
      discount: 500.00,
      adjustment: 0.00,
      taxableAmount: 18977.10,
      cgstAmount: 1707.94,
      sgstAmount: 1707.94,
      taxAmount: 3415.88,
      totalAmount: 22392.98,
      status: "PAID",
      dueDate: new Date("2026-05-25"),
      createdAt: new Date("2026-05-10T10:00:00Z"),
      items: {
        create: [
          {
            productId: "prd-001",
            productName: "Invictus Oregano Seasoning 500g",
            quantity: 40,
            unitPrice: 280.00,
            discount: 0,
            taxableValue: 11200.00,
            cgst: 1008.00,
            sgst: 1008.00,
            lineTotal: 13216.00
          },
          {
            productId: "prd-006",
            productName: "Invictus Chilli Flakes Sprinkler 500g",
            quantity: 20,
            unitPrice: 380.00,
            discount: 500.00,
            taxableValue: 7100.00,
            cgst: 639.00,
            sgst: 639.00,
            lineTotal: 8378.00
          },
          {
            productId: "prd-010",
            productName: "Invictus Dried Mixed Herbs 37g",
            quantity: 30,
            unitPrice: 22.57,
            discount: 0,
            taxableValue: 677.10,
            cgst: 60.94,
            sgst: 60.94,
            lineTotal: 798.98
          }
        ]
      }
    }
  });

  // Seed invoices/bills for PO-20260412-0001 (RECEIVED) and PO-20260501-0002 (APPROVED)
  await prisma.invoice.create({
    data: {
      id: "inv-po-001",
      invoiceNumber: "BILL-20260412-0001",
      purchaseOrderId: "po-001",
      supplierId: "sup-002",
      subtotal: 48500.00,
      discount: 0,
      adjustment: 0,
      taxableAmount: 48500.00,
      cgstAmount: 4365.00,
      sgstAmount: 4365.00,
      taxAmount: 8730.00,
      totalAmount: 57230.00,
      status: "PAID",
      dueDate: new Date("2026-05-12T10:30:00Z"),
      createdAt: new Date("2026-04-12T10:30:00Z"),
      items: {
        create: [
          {
            productId: "prd-001",
            productName: "Invictus Oregano Seasoning 500g",
            quantity: 100,
            unitPrice: 160.00,
            discount: 0,
            taxableValue: 16000.00,
            cgst: 1440.00,
            sgst: 1440.00,
            lineTotal: 18880.00
          },
          {
            productId: "prd-005",
            productName: "Invictus Italian Seasoning 250g",
            quantity: 100,
            unitPrice: 55.00,
            discount: 0,
            taxableValue: 5500.00,
            cgst: 495.00,
            sgst: 495.00,
            lineTotal: 6490.00
          },
          {
            productId: "prd-012",
            productName: "Invictus Oregano Herbs 500g",
            quantity: 150,
            unitPrice: 78.00,
            discount: 0,
            taxableValue: 11700.00,
            cgst: 1053.00,
            sgst: 1053.00,
            lineTotal: 13806.00
          },
          {
            productId: "prd-014",
            productName: "Invictus Dried Basil Leaves 1kg",
            quantity: 80,
            unitPrice: 120.00,
            discount: 0,
            taxableValue: 9600.00,
            cgst: 864.00,
            sgst: 864.00,
            lineTotal: 11328.00
          }
        ]
      }
    }
  });

  await prisma.invoice.create({
    data: {
      id: "inv-po-002",
      invoiceNumber: "BILL-20260501-0002",
      purchaseOrderId: "po-002",
      supplierId: "sup-001",
      subtotal: 72800.00,
      discount: 0,
      adjustment: 0,
      taxableAmount: 72800.00,
      cgstAmount: 6552.00,
      sgstAmount: 6552.00,
      taxAmount: 13104.00,
      totalAmount: 85904.00,
      status: "PENDING",
      dueDate: new Date("2026-06-01T09:00:00Z"),
      createdAt: new Date("2026-05-02T09:00:00Z"),
      items: {
        create: [
          {
            productId: "prd-006",
            productName: "Invictus Chilli Flakes Sprinkler 500g",
            quantity: 120,
            unitPrice: 210.00,
            discount: 0,
            taxableValue: 25200.00,
            cgst: 2268.00,
            sgst: 2268.00,
            lineTotal: 29736.00
          },
          {
            productId: "prd-008",
            productName: "Invictus Chilli Flakes 1kg Bulk",
            quantity: 140,
            unitPrice: 140.00,
            discount: 0,
            taxableValue: 19600.00,
            cgst: 1764.00,
            sgst: 1764.00,
            lineTotal: 23128.00
          },
          {
            productId: "prd-020",
            productName: "Invictus Red Paprika Powder 1kg",
            quantity: 80,
            unitPrice: 65.00,
            discount: 0,
            taxableValue: 5200.00,
            cgst: 468.00,
            sgst: 468.00,
            lineTotal: 6136.00
          }
        ]
      }
    }
  });

  // Seed invoices/bills for remaining SOs (SO-002: SHIPPED, SO-003: CONFIRMED)
  await prisma.invoice.create({
    data: {
      id: "inv-002",
      invoiceNumber: "INV-20260515-0002",
      salesOrderId: "so-002",
      customerId: "cus-005",
      subtotal: 52800.00,
      discount: 1000.00,
      adjustment: 0.00,
      taxableAmount: 51800.00,
      cgstAmount: 4662.00,
      sgstAmount: 4662.00,
      taxAmount: 9324.00,
      totalAmount: 61124.00,
      status: "OVERDUE",
      dueDate: new Date("2026-05-22T00:00:00Z"),
      createdAt: new Date("2026-05-15T00:00:00Z"),
      items: {
        create: [
          {
            productId: "prd-008",
            productName: "Invictus Chilli Flakes 1kg Bulk",
            quantity: 100,
            unitPrice: 260.00,
            discount: 0,
            taxableValue: 26000.00,
            cgst: 2340.00,
            sgst: 2340.00,
            lineTotal: 30680.00
          },
          {
            productId: "prd-016",
            productName: "Invictus Dry Garlic Powder 1kg",
            quantity: 80,
            unitPrice: 210.00,
            discount: 0,
            taxableValue: 16800.00,
            cgst: 1512.00,
            sgst: 1512.00,
            lineTotal: 19824.00
          },
          {
            productId: "prd-017",
            productName: "Invictus Dry Garlic Flakes 1kg",
            quantity: 100,
            unitPrice: 100.00,
            discount: 1000.00,
            taxableValue: 9000.00,
            cgst: 810.00,
            sgst: 810.00,
            lineTotal: 10620.00
          }
        ]
      }
    }
  });

  await prisma.invoice.create({
    data: {
      id: "inv-003",
      invoiceNumber: "INV-20260520-0003",
      salesOrderId: "so-003",
      customerId: "cus-004",
      subtotal: 14400.00,
      discount: 0,
      adjustment: 0.00,
      taxableAmount: 14400.00,
      cgstAmount: 1296.00,
      sgstAmount: 1296.00,
      taxAmount: 2592.00,
      totalAmount: 16992.00,
      status: "PENDING",
      dueDate: new Date("2026-05-27T00:00:00Z"),
      createdAt: new Date("2026-05-20T00:00:00Z"),
      items: {
        create: [
          {
            productId: "prd-002",
            productName: "Invictus Oregano Seasoning Sachet 10g",
            quantity: 50,
            unitPrice: 150.00,
            discount: 0,
            taxableValue: 7500.00,
            cgst: 675.00,
            sgst: 675.00,
            lineTotal: 8850.00
          },
          {
            productId: "prd-007",
            productName: "Invictus Chilli Flakes Sachet 0.8g",
            quantity: 30,
            unitPrice: 150.00,
            discount: 0,
            taxableValue: 4500.00,
            cgst: 405.00,
            sgst: 405.00,
            lineTotal: 5310.00
          },
          {
            productId: "prd-020",
            productName: "Invictus Red Paprika Powder 1kg",
            quantity: 20,
            unitPrice: 120.00,
            discount: 0,
            taxableValue: 2400.00,
            cgst: 216.00,
            sgst: 216.00,
            lineTotal: 2832.00
          }
        ]
      }
    }
  });
  console.log(`Seeded invoices/bills`);

  // Seed Payments
  await prisma.payment.create({
    data: {
      id: "pay-001",
      salesOrderId: "so-001",
      invoiceId: "inv-001",
      amount: 22392.98,
      paymentMethod: "NEFT",
      status: "SUCCESS",
      reference: "REF-NEFT-998877",
      createdAt: new Date("2026-05-14T14:22:00Z")
    }
  });

  await prisma.payment.create({
    data: {
      id: "pay-po-001",
      purchaseOrderId: "po-001",
      invoiceId: "inv-po-001",
      amount: 57230.00,
      paymentMethod: "NEFT",
      status: "SUCCESS",
      reference: "REF-NEFT-883311",
      createdAt: new Date("2026-04-15T11:00:00Z")
    }
  });
  console.log(`Seeded payments`);

  // Seed Notifications
  const notificationsData = [
    {
      type: "NEAR_EXPIRY",
      title: "Near-Expiry Alert: Tandoori Tikka Marinade",
      message: "Product 'Invictus Tandoori Tikka Marinade 500g' (SKU: INV-MAR-TAN-500) expires on 15 Jul 2026 — within 90 days. Consider running a promotional offer.",
      entity: "Product",
      entityId: "prd-003",
      isRead: false
    },
    {
      type: "LOW_STOCK",
      title: "Low Stock Warning: Dry Thyme Leaves",
      message: "Invictus Dry Thyme Leaves 1kg (SKU: INV-HRB-THY-1KG) has 100 units remaining at Odhav Main Warehouse — below reorder level of 25. Consider raising a PO.",
      entity: "Product",
      entityId: "prd-011",
      isRead: false
    },
    {
      type: "PO_PENDING",
      title: "PO Approval Required: PO-20260518-0003",
      message: "Purchase Order PO-20260518-0003 (₹35,700 from Rajasthan Masala House) is awaiting Manager/Admin approval.",
      entity: "PurchaseOrder",
      entityId: "po-003",
      isRead: false
    },
    {
      type: "OVERDUE_INVOICE",
      title: "Overdue Invoice: SO-20260515-0002",
      message: "Invoice for Sales Order SO-20260515-0002 (Kirana King Wholesale Mart, ₹64,920) is unpaid and past due date.",
      entity: "Invoice",
      entityId: "inv-002",
      isRead: false
    }
  ];

  for (const notif of notificationsData) {
    await prisma.notification.create({ data: notif });
  }
  console.log(`Seeded notifications`);

  // ─── Seed Inventory Movements ─────────────────────────────
  // These provide data for "Live Stock Movements" panel + forecasting history
  const today = new Date();
  const movementsData: Array<{
    productId: string;
    warehouseId: string;
    movementType: string;
    quantity: number;
    reference: string;
    notes: string;
    performedBy: string;
    createdAt: Date;
  }> = [];

  // Generate 60 days of STOCK_OUT movements for popular products
  const popularProducts = [
    { id: 'prd-001', name: 'Oregano Seasoning 500g', wh: 'wh-001', avgDaily: 5 },
    { id: 'prd-002', name: 'Oregano Sachet 10g', wh: 'wh-001', avgDaily: 12 },
    { id: 'prd-006', name: 'Chilli Flakes Sprinkler 500g', wh: 'wh-001', avgDaily: 4 },
    { id: 'prd-007', name: 'Chilli Flakes Sachet 0.8g', wh: 'wh-001', avgDaily: 15 },
    { id: 'prd-008', name: 'Chilli Flakes 1kg Bulk', wh: 'wh-001', avgDaily: 3 },
    { id: 'prd-010', name: 'Dried Mixed Herbs 37g', wh: 'wh-001', avgDaily: 8 },
    { id: 'prd-016', name: 'Dry Garlic Powder 1kg', wh: 'wh-001', avgDaily: 4 },
    { id: 'prd-020', name: 'Red Paprika Powder 1kg', wh: 'wh-001', avgDaily: 3 },
    { id: 'prd-005', name: 'Italian Seasoning 250g', wh: 'wh-001', avgDaily: 6 },
    { id: 'prd-012', name: 'Oregano Herbs 500g', wh: 'wh-001', avgDaily: 5 },
  ];

  const staff = ['usr-001', 'usr-002', 'usr-003'];

  for (let dayOffset = 60; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    date.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);

    for (const prod of popularProducts) {
      // Randomise daily demand: avgDaily ± 40%
      const variance = 0.4;
      const demand = Math.max(1, Math.round(prod.avgDaily * (1 - variance + Math.random() * 2 * variance)));
      const performer = staff[Math.floor(Math.random() * staff.length)]!;

      // STOCK_OUT movement
      movementsData.push({
        productId: prod.id,
        warehouseId: prod.wh,
        movementType: 'STOCK_OUT',
        quantity: -demand,
        reference: `AUTO-${date.toISOString().slice(0, 10).replace(/-/g, '')}`,
        notes: `Daily dispatch – ${prod.name}`,
        performedBy: performer,
        createdAt: new Date(date),
      });

      // Occasional STOCK_IN (restock every ~10 days)
      if (dayOffset % 10 === 0 && dayOffset > 0) {
        const restockQty = prod.avgDaily * 12;
        const restockDate = new Date(date);
        restockDate.setHours(restockDate.getHours() + 2);
        movementsData.push({
          productId: prod.id,
          warehouseId: prod.wh,
          movementType: 'STOCK_IN',
          quantity: restockQty,
          reference: `RESTOCK-${restockDate.toISOString().slice(0, 10).replace(/-/g, '')}`,
          notes: `Periodic restock – ${prod.name}`,
          performedBy: 'usr-002',
          createdAt: restockDate,
        });
      }
    }

    // Occasional TRANSFER movements between warehouses
    if (dayOffset % 7 === 0 && dayOffset > 0) {
      const transferDate = new Date(date);
      transferDate.setHours(14, 30, 0, 0);
      movementsData.push({
        productId: 'prd-001',
        warehouseId: 'wh-001',
        movementType: 'TRANSFER_OUT',
        quantity: -20,
        reference: `XFER-${transferDate.toISOString().slice(0, 10).replace(/-/g, '')}`,
        notes: 'Transfer to Naroda Storage Facility',
        performedBy: 'usr-003',
        createdAt: transferDate,
      });
      movementsData.push({
        productId: 'prd-001',
        warehouseId: 'wh-002',
        movementType: 'TRANSFER_IN',
        quantity: 20,
        reference: `XFER-${transferDate.toISOString().slice(0, 10).replace(/-/g, '')}`,
        notes: 'Received from Odhav Main Warehouse',
        performedBy: 'usr-003',
        createdAt: new Date(transferDate.getTime() + 3600000),
      });
    }
  }

  // Batch insert inventory movements
  await prisma.inventoryMovement.createMany({ data: movementsData });
  console.log(`Seeded ${movementsData.length} inventory movements (60 days)`);

  // ─── Seed Additional Historical Sales Orders ───────────────
  // These back-date sales to populate the Revenue Trend chart
  const historicalSOs: Array<{
    id: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    warehouseId: string;
    status: string;
    isPaid: boolean;
    totalAmount: number;
    createdBy: string;
    createdAt: Date;
    items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; discount: number }>;
  }> = [];

  const customers = [
    { id: 'cus-001', name: 'Pizza Express Ahmedabad' },
    { id: 'cus-002', name: 'Reliance Smart Point – Surat' },
    { id: 'cus-003', name: 'Hotel Grand Bhagwati' },
    { id: 'cus-004', name: 'Swiggy Instamart Fulfilment – Vadodara' },
    { id: 'cus-005', name: 'Kirana King Wholesale Mart' },
    { id: 'cus-006', name: "Domino's Franchisee – Rajkot" },
  ];

  const soProducts = [
    { id: 'prd-001', name: 'Invictus Oregano Seasoning 500g', price: 280 },
    { id: 'prd-002', name: 'Invictus Oregano Seasoning Sachet 10g', price: 150 },
    { id: 'prd-005', name: 'Invictus Italian Seasoning 250g', price: 97 },
    { id: 'prd-006', name: 'Invictus Chilli Flakes Sprinkler 500g', price: 380 },
    { id: 'prd-008', name: 'Invictus Chilli Flakes 1kg Bulk', price: 260 },
    { id: 'prd-010', name: 'Invictus Dried Mixed Herbs 37g', price: 22.57 },
    { id: 'prd-012', name: 'Invictus Oregano Herbs 500g', price: 140 },
    { id: 'prd-016', name: 'Invictus Dry Garlic Powder 1kg', price: 210 },
    { id: 'prd-020', name: 'Invictus Red Paprika Powder 1kg', price: 120 },
  ];

  // Generate 12 historical SOs spread over past 45 days
  for (let i = 0; i < 12; i++) {
    const daysAgo = 45 - Math.floor(i * (45 / 12));
    const soDate = new Date(today);
    soDate.setDate(soDate.getDate() - daysAgo);
    soDate.setHours(10 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60), 0, 0);

    const cust = customers[i % customers.length]!;
    const numItems = 2 + Math.floor(Math.random() * 2); // 2-3 items
    const soItems: typeof historicalSOs[0]['items'] = [];
    const usedProducts = new Set<string>();

    for (let j = 0; j < numItems; j++) {
      let prod;
      do {
        prod = soProducts[Math.floor(Math.random() * soProducts.length)]!;
      } while (usedProducts.has(prod.id));
      usedProducts.add(prod.id);

      const qty = 10 + Math.floor(Math.random() * 50);
      soItems.push({
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unitPrice: prod.price,
        discount: 0,
      });
    }

    const soTotal = soItems.reduce((s, item) => s + item.quantity * item.unitPrice, 0);

    historicalSOs.push({
      id: `so-hist-${String(i + 1).padStart(3, '0')}`,
      orderNumber: `SO-HIST-${soDate.toISOString().slice(0, 10).replace(/-/g, '')}-${String(i + 1).padStart(4, '0')}`,
      customerId: cust.id,
      customerName: cust.name,
      warehouseId: 'wh-001',
      status: 'DELIVERED',
      isPaid: true,
      totalAmount: Math.round(soTotal * 100) / 100,
      createdBy: staff[i % staff.length]!,
      createdAt: soDate,
      items: soItems,
    });
  }

  for (const so of historicalSOs) {
    const { items, ...soData } = so;
    await prisma.salesOrder.create({
      data: {
        ...soData,
        items: { create: items },
      },
    });
  }
  console.log(`Seeded ${historicalSOs.length} historical sales orders for Revenue Trend`);

  // ─── Seed Audit Logs ──────────────────────────────────────
  const auditLogsData = [
    {
      userId: 'usr-001',
      action: 'CREATE',
      entity: 'Category',
      entityId: 'cat-008',
      details: {
        method: 'POST',
        url: '/api/categories',
        body: { categoryName: 'Marinades', description: 'Ready-mix marinades for tikka, tandoori, and grilling' }
      },
      ipAddress: '127.0.0.1',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 15))
    },
    {
      userId: 'usr-002',
      action: 'UPDATE',
      entity: 'PurchaseOrder',
      entityId: 'po-001',
      details: {
        method: 'PATCH',
        url: '/api/purchase-orders/po-001/approve',
        body: { status: 'APPROVED' }
      },
      ipAddress: '192.168.1.15',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 12))
    },
    {
      userId: 'usr-003',
      action: 'UPDATE',
      entity: 'Inventory',
      entityId: 'prd-013',
      details: {
        method: 'PATCH',
        url: '/api/inventory/prd-013',
        body: { quantity: 150, warehouseId: 'wh-001' }
      },
      ipAddress: '::1',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 10))
    },
    {
      userId: 'usr-001',
      action: 'CREATE',
      entity: 'Product',
      entityId: 'prd-001',
      details: {
        method: 'POST',
        url: '/api/products',
        body: { name: 'Invictus Oregano Seasoning 500g', sku: 'INV-ORG-500', price: 280, costPrice: 180, categoryId: 'cat-001' }
      },
      ipAddress: '127.0.0.1',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 8))
    },
    {
      userId: 'usr-002',
      action: 'CREATE',
      entity: 'Payment',
      entityId: 'pay-001',
      details: {
        method: 'POST',
        url: '/api/invoices/payments',
        body: { amount: 64920, paymentMethod: 'NEFT', reference: 'REF-NEFT-883311' }
      },
      ipAddress: '192.168.1.18',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 5))
    },
    {
      userId: 'usr-003',
      action: 'CREATE',
      entity: 'Inventory',
      entityId: 'prd-001',
      details: {
        method: 'POST',
        url: '/api/inventory/transfer',
        body: { productId: 'prd-001', fromWarehouseId: 'wh-001', toWarehouseId: 'wh-002', quantity: 20 }
      },
      ipAddress: '::1',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 3))
    },
    {
      userId: null,
      action: 'CREATE',
      entity: 'Notification',
      entityId: null,
      details: {
        error: 'Low Stock Warning: Dry Thyme Leaves (SKU: INV-HRB-THY-1KG) has 100 units remaining.'
      },
      ipAddress: '127.0.0.1',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 1))
    }
  ];

  for (const log of auditLogsData) {
    await prisma.auditLog.create({ data: log });
  }
  console.log(`Seeded ${auditLogsData.length} audit logs`);

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
