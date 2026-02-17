-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PREPARING', 'DELIVERING', 'COMPLETED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "status" "OrderStatus";
