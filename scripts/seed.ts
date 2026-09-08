import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateLoanSchedule } from "../lib/financial/index";
import { subMonths, addMonths, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database for Rohit Kagdewad Lending Management...");

  // 1. Create Default Owner User
  const ownerPasswordHash = await bcrypt.hash("Password@123", 10);
  const owner = await prisma.user.upsert({
    where: { email: "rohit@lending.com" },
    update: {},
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
  console.log(`✓ Owner created: ${owner.email} (Password: Password@123)`);

  // 2. Create Staff User
  const staffPasswordHash = await bcrypt.hash("Password@123", 10);
  const staff = await prisma.user.upsert({
    where: { email: "staff@lending.com" },
    update: {},
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
  console.log(`✓ Staff created: ${staff.email} (Password: Password@123)`);

  // 3. System & Business Settings
  const defaultSettings = [
    { key: "BUSINESS_NAME", value: "Rohit Kagdewad Lending Management", description: "Official Business Name" },
    { key: "OWNER_NAME", value: "Rohit Kagdewad", description: "Business Proprietor" },
    { key: "BUSINESS_PHONE", value: "+91 96652 69105", description: "Contact Phone for Receipts & Messages" },
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
  console.log("✓ System settings initialized");

  // 4. Sample Borrower A: Rajesh Sharma (Kirana Store)
  const borrowerA = await prisma.borrower.upsert({
    where: { phone: "9822114455" },
    update: {},
    create: {
      borrowerCode: "BOR-2026-001",
      fullName: "Rajesh Sharma",
      phone: "9822114455",
      alternatePhone: "9822114456",
      email: "rajesh.sharma@example.com",
      address: "Shop No. 4, Shivaji Nagar Market",
      city: "Nanded",
      state: "Maharashtra",
      pincode: "431602",
      occupation: "Kirana Store Owner",
      businessDetails: "Shri Ganesh Provision Store, Annual turnover ₹15 Lakhs",
      monthlyIncome: 65000,
      referenceName: "Vikas Pawar",
      referencePhone: "9822998877",
      referenceRelation: "Neighbor & Business Friend",
      guarantorName: "Ramesh Sharma",
      guarantorPhone: "9822001122",
      guarantorAddress: "Shivaji Nagar, Nanded",
      status: "ACTIVE",
      notes: "Reliable shop owner. Pays via UPI or Cash.",
    },
  });

  let loanA = await prisma.loan.findFirst({ where: { loanCode: "LN-2026-001" } });
  if (!loanA) {
    const disbDateA = subMonths(new Date(), 2);
    const firstDueA = addMonths(disbDateA, 1);
    const schedA = generateLoanSchedule({
      principalAmount: 50000,
      interestRate: 24, // 24% p.a. (2% pm)
      interestType: "FLAT_RATE",
      repaymentFrequency: "MONTHLY",
      tenurePeriods: 5,
      disbursementDate: disbDateA,
      firstDueDate: firstDueA,
      processingFee: 500,
    });

    loanA = await prisma.loan.create({
      data: {
        loanCode: "LN-2026-001",
        borrowerId: borrowerA.id,
        principalAmount: 50000,
        interestRate: 24,
        interestType: "FLAT_RATE",
        repaymentFrequency: "MONTHLY",
        tenurePeriods: 5,
        disbursementDate: disbDateA,
        firstDueDate: firstDueA,
        processingFee: 500,
        totalInterestExpected: parseFloat(schedA.totalInterestExpected),
        totalAmountExpected: parseFloat(schedA.totalAmountExpected),
        principalOutstanding: 30000,
        interestOutstanding: 3000,
        totalOutstanding: 33000,
        status: "ACTIVE",
        createdById: owner.id,
        installments: {
          create: schedA.installments.map((inst, idx) => ({
            installmentNumber: inst.installmentNumber,
            dueDate: new Date(inst.dueDate),
            principalDue: parseFloat(inst.principalDue),
            interestDue: parseFloat(inst.interestDue),
            feeDue: 0,
            totalDue: parseFloat(inst.totalDue),
            principalPaid: idx < 2 ? parseFloat(inst.principalDue) : 0,
            interestPaid: idx < 2 ? parseFloat(inst.interestDue) : 0,
            totalPaid: idx < 2 ? parseFloat(inst.totalDue) : 0,
            status: idx < 2 ? "PAID" : (idx === 2 ? "DUE_TODAY" : "UPCOMING"),
            paidAt: idx < 2 ? new Date(inst.dueDate) : null,
          })),
        },
      },
    });

    // Ledger for Loan A
    await prisma.ledgerEntry.create({
      data: {
        borrowerId: borrowerA.id,
        loanId: loanA.id,
        entryType: "DISBURSEMENT",
        debit: 55000,
        credit: 0,
        runningBalance: 55000,
        description: "Loan Disbursed (Principal ₹50,000 + Interest ₹5,000)",
        entryDate: disbDateA,
      },
    });

    // Payment 1 for Loan A
    const pay1 = await prisma.payment.create({
      data: {
        receiptNumber: "REC-202607-0001",
        loanId: loanA.id,
        borrowerId: borrowerA.id,
        amount: 11000,
        principalAllocated: 10000,
        interestAllocated: 1000,
        lateFeeAllocated: 0,
        paymentDate: firstDueA,
        paymentMode: "UPI",
        referenceNumber: "UPI-423456789012",
        collectedById: owner.id,
        status: "SUCCESS",
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        borrowerId: borrowerA.id,
        loanId: loanA.id,
        paymentId: pay1.id,
        entryType: "PAYMENT",
        debit: 0,
        credit: 11000,
        runningBalance: 44000,
        description: "Installment #1 Paid via UPI",
        referenceNo: "REC-202607-0001",
        entryDate: firstDueA,
      },
    });

    // Payment 2 for Loan A
    const pay2Date = addMonths(firstDueA, 1);
    const pay2 = await prisma.payment.create({
      data: {
        receiptNumber: "REC-202608-0002",
        loanId: loanA.id,
        borrowerId: borrowerA.id,
        amount: 11000,
        principalAllocated: 10000,
        interestAllocated: 1000,
        lateFeeAllocated: 0,
        paymentDate: pay2Date,
        paymentMode: "CASH",
        collectedById: staff.id,
        status: "SUCCESS",
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        borrowerId: borrowerA.id,
        loanId: loanA.id,
        paymentId: pay2.id,
        entryType: "PAYMENT",
        debit: 0,
        credit: 11000,
        runningBalance: 33000,
        description: "Installment #2 Paid in Cash to Staff",
        referenceNo: "REC-202608-0002",
        entryDate: pay2Date,
      },
    });
  }

  // 5. Sample Borrower B: Anil Deshmukh (Overdue Loan)
  const borrowerB = await prisma.borrower.upsert({
    where: { phone: "9890123456" },
    update: {},
    create: {
      borrowerCode: "BOR-2026-002",
      fullName: "Anil Deshmukh",
      phone: "9890123456",
      alternatePhone: "9890123457",
      email: "anil.garage@example.com",
      address: "Plot 12, MIDC Area, Workshop Road",
      city: "Nanded",
      state: "Maharashtra",
      pincode: "431603",
      occupation: "Auto Repair Workshop Owner",
      businessDetails: "Deshmukh Motors & 2-Wheeler Service, Monthly revenue ~₹80,000",
      monthlyIncome: 45000,
      referenceName: "Prakash Kadam",
      referencePhone: "9890998877",
      status: "OVERDUE",
      notes: "Delayed on 2nd installment due to parts inventory delay.",
    },
  });

  let loanB = await prisma.loan.findFirst({ where: { loanCode: "LN-2026-002" } });
  if (!loanB) {
    const disbDateB = subMonths(new Date(), 3);
    const firstDueB = addMonths(disbDateB, 1);
    const schedB = generateLoanSchedule({
      principalAmount: 100000,
      interestRate: 18,
      interestType: "REDUCING_BALANCE",
      repaymentFrequency: "MONTHLY",
      tenurePeriods: 6,
      disbursementDate: disbDateB,
      firstDueDate: firstDueB,
      processingFee: 1000,
    });

    loanB = await prisma.loan.create({
      data: {
        loanCode: "LN-2026-002",
        borrowerId: borrowerB.id,
        principalAmount: 100000,
        interestRate: 18,
        interestType: "REDUCING_BALANCE",
        repaymentFrequency: "MONTHLY",
        tenurePeriods: 6,
        disbursementDate: disbDateB,
        firstDueDate: firstDueB,
        processingFee: 1000,
        totalInterestExpected: parseFloat(schedB.totalInterestExpected),
        totalAmountExpected: parseFloat(schedB.totalAmountExpected),
        principalOutstanding: 83870,
        interestOutstanding: 4500,
        totalOutstanding: 88370,
        status: "OVERDUE",
        createdById: owner.id,
        installments: {
          create: schedB.installments.map((inst, idx) => ({
            installmentNumber: inst.installmentNumber,
            dueDate: new Date(inst.dueDate),
            principalDue: parseFloat(inst.principalDue),
            interestDue: parseFloat(inst.interestDue),
            feeDue: idx === 1 ? 250 : 0,
            totalDue: idx === 1 ? parseFloat(inst.totalDue) + 250 : parseFloat(inst.totalDue),
            principalPaid: idx === 0 ? parseFloat(inst.principalDue) : 0,
            interestPaid: idx === 0 ? parseFloat(inst.interestDue) : 0,
            totalPaid: idx === 0 ? parseFloat(inst.totalDue) : 0,
            status: idx === 0 ? "PAID" : (idx === 1 ? "OVERDUE" : "UPCOMING"),
            paidAt: idx === 0 ? firstDueB : null,
          })),
        },
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        borrowerId: borrowerB.id,
        loanId: loanB.id,
        entryType: "DISBURSEMENT",
        debit: parseFloat(schedB.totalAmountExpected),
        credit: 0,
        runningBalance: parseFloat(schedB.totalAmountExpected),
        description: "Reducing Balance Loan Disbursed ₹100,000",
        entryDate: disbDateB,
      },
    });
  }

  // 6. Sample Borrower C: Pooja Shinde (Boutique)
  const borrowerC = await prisma.borrower.upsert({
    where: { phone: "9850123456" },
    update: {},
    create: {
      borrowerCode: "BOR-2026-003",
      fullName: "Pooja Shinde",
      phone: "9850123456",
      address: "MG Road, Cloth Market",
      city: "Nanded",
      state: "Maharashtra",
      pincode: "431601",
      occupation: "Designer & Boutique Owner",
      monthlyIncome: 40000,
      status: "ACTIVE",
      notes: "Short-term working capital loan for festive stock.",
    },
  });

  let loanC = await prisma.loan.findFirst({ where: { loanCode: "LN-2026-003" } });
  if (!loanC) {
    const disbDateC = subDays(new Date(), 15);
    const firstDueC = new Date(); // Due today!
    const schedC = generateLoanSchedule({
      principalAmount: 30000,
      interestRate: 24,
      interestType: "FLAT_RATE",
      repaymentFrequency: "MONTHLY",
      tenurePeriods: 3,
      disbursementDate: disbDateC,
      firstDueDate: firstDueC,
    });

    loanC = await prisma.loan.create({
      data: {
        loanCode: "LN-2026-003",
        borrowerId: borrowerC.id,
        principalAmount: 30000,
        interestRate: 24,
        interestType: "FLAT_RATE",
        repaymentFrequency: "MONTHLY",
        tenurePeriods: 3,
        disbursementDate: disbDateC,
        firstDueDate: firstDueC,
        totalInterestExpected: parseFloat(schedC.totalInterestExpected),
        totalAmountExpected: parseFloat(schedC.totalAmountExpected),
        principalOutstanding: 30000,
        interestOutstanding: parseFloat(schedC.totalInterestExpected),
        totalOutstanding: parseFloat(schedC.totalAmountExpected),
        status: "ACTIVE",
        createdById: owner.id,
        installments: {
          create: schedC.installments.map((inst, idx) => ({
            installmentNumber: inst.installmentNumber,
            dueDate: new Date(inst.dueDate),
            principalDue: parseFloat(inst.principalDue),
            interestDue: parseFloat(inst.interestDue),
            feeDue: 0,
            totalDue: parseFloat(inst.totalDue),
            principalPaid: 0,
            interestPaid: 0,
            totalPaid: 0,
            status: idx === 0 ? "DUE_TODAY" : "UPCOMING",
          })),
        },
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        borrowerId: borrowerC.id,
        loanId: loanC.id,
        entryType: "DISBURSEMENT",
        debit: parseFloat(schedC.totalAmountExpected),
        credit: 0,
        runningBalance: parseFloat(schedC.totalAmountExpected),
        description: "Loan Disbursed ₹30,000",
        entryDate: disbDateC,
      },
    });
  }

  // 7. Sample Borrower D: Ganesh Gaikwad (Closed Loan)
  const borrowerD = await prisma.borrower.upsert({
    where: { phone: "9860987654" },
    update: {},
    create: {
      borrowerCode: "BOR-2026-004",
      fullName: "Ganesh Gaikwad",
      phone: "9860987654",
      address: "Ganesh Nagar, Taroda Road",
      city: "Nanded",
      state: "Maharashtra",
      pincode: "431605",
      occupation: "Dairy Farm Proprietor",
      monthlyIncome: 55000,
      status: "ACTIVE",
      notes: "Excellent repayment history. Successfully closed previous loan.",
    },
  });

  let loanD = await prisma.loan.findFirst({ where: { loanCode: "LN-2026-004" } });
  if (!loanD) {
    const disbDateD = subMonths(new Date(), 4);
    const firstDueD = addMonths(disbDateD, 1);
    const schedD = generateLoanSchedule({
      principalAmount: 40000,
      interestRate: 24,
      interestType: "FLAT_RATE",
      repaymentFrequency: "MONTHLY",
      tenurePeriods: 2,
      disbursementDate: disbDateD,
      firstDueDate: firstDueD,
    });

    loanD = await prisma.loan.create({
      data: {
        loanCode: "LN-2026-004",
        borrowerId: borrowerD.id,
        principalAmount: 40000,
        interestRate: 24,
        interestType: "FLAT_RATE",
        repaymentFrequency: "MONTHLY",
        tenurePeriods: 2,
        disbursementDate: disbDateD,
        firstDueDate: firstDueD,
        totalInterestExpected: parseFloat(schedD.totalInterestExpected),
        totalAmountExpected: parseFloat(schedD.totalAmountExpected),
        principalOutstanding: 0,
        interestOutstanding: 0,
        totalOutstanding: 0,
        status: "CLOSED",
        closedAt: addMonths(firstDueD, 1),
        closureRemarks: "Fully repaid on schedule with zero penalties.",
        createdById: owner.id,
        installments: {
          create: schedD.installments.map((inst, idx) => ({
            installmentNumber: inst.installmentNumber,
            dueDate: new Date(inst.dueDate),
            principalDue: parseFloat(inst.principalDue),
            interestDue: parseFloat(inst.interestDue),
            feeDue: 0,
            totalDue: parseFloat(inst.totalDue),
            principalPaid: parseFloat(inst.principalDue),
            interestPaid: parseFloat(inst.interestDue),
            totalPaid: parseFloat(inst.totalDue),
            status: "PAID",
            paidAt: addMonths(firstDueD, idx),
          })),
        },
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        borrowerId: borrowerD.id,
        loanId: loanD.id,
        entryType: "DISBURSEMENT",
        debit: parseFloat(schedD.totalAmountExpected),
        credit: 0,
        runningBalance: parseFloat(schedD.totalAmountExpected),
        description: "Loan Disbursed ₹40,000",
        entryDate: disbDateD,
      },
    });

    const payD = await prisma.payment.create({
      data: {
        receiptNumber: "REC-202606-0001",
        loanId: loanD.id,
        borrowerId: borrowerD.id,
        amount: parseFloat(schedD.totalAmountExpected),
        principalAllocated: 40000,
        interestAllocated: parseFloat(schedD.totalInterestExpected),
        lateFeeAllocated: 0,
        paymentDate: addMonths(firstDueD, 1),
        paymentMode: "BANK_TRANSFER",
        referenceNumber: "NEFT-7890123456",
        collectedById: owner.id,
        status: "SUCCESS",
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        borrowerId: borrowerD.id,
        loanId: loanD.id,
        paymentId: payD.id,
        entryType: "PAYMENT",
        debit: 0,
        credit: parseFloat(schedD.totalAmountExpected),
        runningBalance: 0,
        description: "Full Loan Closure Settlement Paid",
        referenceNo: "REC-202606-0001",
        entryDate: addMonths(firstDueD, 1),
      },
    });
  }

  console.log("✅ Database seeding complete with realistic lending records!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
