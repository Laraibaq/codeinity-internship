-- Hand-written migration (not generated via `prisma migrate dev`), same reason as the
-- 20260927150000 migration: the project's live Supabase DB has pre-existing drift unrelated to
-- this change, and `prisma migrate dev` wants to reset the whole public schema to reconcile it.
-- This file has NOT been applied anywhere. Apply with `prisma migrate deploy` when ready.

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "otp_codes_purpose_identifier_key" ON "otp_codes"("purpose", "identifier");
