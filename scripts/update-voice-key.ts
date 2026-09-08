import prisma from "../lib/db";

async function main() {
  const settings = [
    { key: "AI_CALLING_API_KEY", value: "key_2745db6951ea880dad82e44843ce", description: "Bolna / AI Voice Calling Gateway API Key" },
    { key: "AI_CALLING_PROVIDER", value: "BOLNA_AI", description: "Telephony Voice Calling Provider" },
    { key: "AI_CALLING_DEFAULT_LANG", value: "mr-IN", description: "Default Voice Call Language (Marathi)" },
  ];

  for (const s of settings) {
    await prisma.businessSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: { key: s.key, value: s.value, description: s.description },
    });
    console.log(`Setting updated: ${s.key}`);
  }

  console.log("All Voice Calling Settings updated successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
