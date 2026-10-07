-- Hand-written migration (same reason as 20260927150000: the live database has pre-existing drift
-- that makes `prisma migrate dev` want to reset the schema). NOT applied anywhere; apply with
-- `prisma migrate deploy` when ready.

-- AlterTable
-- Existing rides default to 'cash', which was the only way to pay before this column existed.
ALTER TABLE "rides" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'cash';
