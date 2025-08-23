import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const urls = [
    "https://umd.edu/",
    "https://umd.edu/admissions",
    "https://umd.edu/visit",
    "https://admissions.umd.edu/apply/application-deadlines",
  ];

  for (const url of urls) {
    await prisma.page.upsert({
      where: { url },
      update: {},
      create: { url },
    });
  }
}

(async () => {
  try {
    await main();
  } catch (err) {
    console.log(`Error while inserting URL's to DB: ${err}`);
  } finally {
    await prisma.$disconnect();
  }
})();
