import { PrismaClient } from '@prisma/client'
import { seedSystemSettings } from './seed-data/system-settings'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Seed system settings
  await seedSystemSettings(prisma)

  console.log('Seeding completed.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
