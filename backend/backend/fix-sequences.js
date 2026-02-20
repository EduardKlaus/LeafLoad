
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tableNames = [
        'User',
        'Region',
        'Restaurant',
        'MenuItems',
        'Category',
        'Order',
        'OrderItem',
        'Review'
    ];

    for (const tableName of tableNames) {
        try {
            // Prisma models are usually mapped to "ModelName" or "modelname" depending on configuration.
            // We'll try to quote it to match case-sensitivity if preserved.
            // The safe way in standard Postgres with Prisma default naming is usually the exact model name in quotes.
            const result = await prisma.$queryRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), coalesce(max(id)+1, 1), false) FROM "${tableName}";`);
            console.log(`Reset sequence for ${tableName}: Success`);
        } catch (error) {
            console.error(`Failed to reset sequence for ${tableName}:`, error.message);
            // Fallback: try lowercase if case-sensitive failed
            try {
                await prisma.$queryRawUnsafe(`SELECT setval(pg_get_serial_sequence('${tableName.toLowerCase()}', 'id'), coalesce(max(id)+1, 1), false) FROM "${tableName.toLowerCase()}";`);
                console.log(`Reset sequence for ${tableName.toLowerCase()}: Success`);
            } catch (e2) {
                console.error(`Failed fallback for ${tableName}:`, e2.message);
            }
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
