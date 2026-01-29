
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: 1 },
            select: { ownerId: true, name: true }
        });
        console.log('Restaurant 1 Owner:', restaurant);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
