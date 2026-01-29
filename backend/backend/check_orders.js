
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const orders = await prisma.order.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                items: true,
            }
        });

        console.log('Recent Orders:', JSON.stringify(orders, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
