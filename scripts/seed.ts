import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Initializing clean production database for Rohit Kagdewad Lending Management...");

  // 1. Clean out existing transactional test data (preserving system structure)
  console.log("Deleting test transactional records...");
  await prisma.paymentAllocation.deleteMany({});
  await prisma.ledgerEntry.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.installment.deleteMany({});
  await prisma.loan.deleteMany({});
  await prisma.borrowerDocument.deleteMany({});
  await prisma.whatsAppMessage.deleteMany({});
  await prisma.borrower.deleteMany({});
  await prisma.auditLog.deleteMany({});
  console.log("✓ Test borrowers, loans, and payments purged");

  // 2. Create / Upsert Business Owner (Rohit Kagdewad)
  const ownerPasswordHash = await bcrypt.hash("Rohit@123", 10);
  const owner = await prisma.user.upsert({
    where: { email: "rohit@lending.com" },
    update: {
      phone: "9665269105",
      name: "Rohit Kagdewad",
      role: "OWNER",
      status: "ACTIVE",
      passwordHash: ownerPasswordHash,
    },
    create: {
      email: "rohit@lending.com",
      phone: "9665269105",
      name: "Rohit Kagdewad",
      passwordHash: ownerPasswordHash,
      role: "OWNER",
      status: "ACTIVE",
      permissions: JSON.stringify(["*"]),
    },
  });
  console.log(`✓ Owner account ready: ${owner.email} (Phone: ${owner.phone})`);

  // 3. Create / Upsert Staff User
  const staffPasswordHash = await bcrypt.hash("Staff@123", 10);
  const staff = await prisma.user.upsert({
    where: { email: "staff@lending.com" },
    update: {
      phone: "9823456789",
      name: "Suresh Patil",
      role: "STAFF",
      status: "ACTIVE",
      passwordHash: staffPasswordHash,
    },
    create: {
      email: "staff@lending.com",
      phone: "9823456789",
      name: "Suresh Patil",
      passwordHash: staffPasswordHash,
      role: "STAFF",
      status: "ACTIVE",
      permissions: JSON.stringify([
        "borrowers.view",
        "borrowers.create",
        "borrowers.edit",
        "loans.view",
        "loans.create",
        "payments.view",
        "payments.create",
        "reports.view",
        "dues.view",
        "whatsapp.send",
      ]),
    },
  });
  console.log(`✓ Staff account ready: ${staff.email}`);

  // 4. System & Business Settings
  const defaultSettings = [
    { key: "BUSINESS_NAME", value: "Rohit Kagdewad Lending Management", description: "Official Business Name" },
    { key: "OWNER_NAME", value: "Rohit Kagdewad", description: "Business Proprietor" },
    { key: "BUSINESS_PHONE", value: "+91 96652 69105", description: "Official WhatsApp & Contact Phone" },
    { key: "BUSINESS_ADDRESS", value: "Station Road, Nanded, Maharashtra - 431601", description: "Business Address" },
    { key: "CURRENCY_CODE", value: "INR", description: "Indian Rupee" },
    { key: "CURRENCY_SYMBOL", value: "₹", description: "Rupee Symbol" },
    { key: "TIMEZONE", value: "Asia/Kolkata", description: "Default Business Timezone" },
    { key: "DEFAULT_LATE_FEE_RATE", value: "0.1", description: "Default late fee % per day after grace period" },
    { key: "DEFAULT_GRACE_PERIOD_DAYS", value: "3", description: "Grace period days before late fees apply" },
    { key: "RECEIPT_PREFIX", value: "REC", description: "Prefix for generated payment receipts" },
    { key: "WHATSAPP_ENABLED", value: "true", description: "WhatsApp notification enabled toggle" },
  ];

  for (const s of defaultSettings) {
    await prisma.businessSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log("✓ System settings initialized with Rohit Kagdewad profile (+91 96652 69105)");

  console.log("\n🎉 Clean production environment ready for client handover!");
}

main()
  .catch((e) => {
    console.error("Clean seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
