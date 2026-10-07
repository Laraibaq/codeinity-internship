-- Hand-written migration (not generated via `prisma migrate dev`).
--
-- `prisma migrate dev` could not be used to generate this migration: the remote Supabase database
-- this project's DATABASE_URL points at has pre-existing drift unrelated to this change (Prisma
-- wanted to reset the whole "public" schema, dropping all data, just to reconcile that drift). This
-- file was written by hand instead so the live database is never touched by this change; it has NOT
-- been applied anywhere. Apply it with `prisma migrate deploy` (or `migrate resolve` + `db execute`,
-- whichever fits how this project's migrations normally reach that database) when ready.

-- AlterEnum
-- Insert the two new RideStatus values between 'accepted' and 'ongoing', matching schema.prisma's
-- declared order. No existing values are removed or renamed, so every place that currently matches
-- on RideStatus by string literal keeps working unchanged -- nothing transitions into or out of
-- these two new states yet (that's Phase 4 frontend/backend wiring, not this migration).
ALTER TYPE "RideStatus" ADD VALUE 'en_route' AFTER 'accepted';
ALTER TYPE "RideStatus" ADD VALUE 'arrived' AFTER 'en_route';

-- CreateEnum
-- Pricing/comfort tier the passenger picked (standard/premium/xl/bike) -- deliberately a separate
-- concept from VehicleType (car/bike/rickshaw, the driver's vehicle body type). See the enum
-- comment in schema.prisma for the full rationale; do not merge these two enums.
CREATE TYPE "RideFareTier" AS ENUM ('standard', 'premium', 'xl', 'bike');

-- AlterTable
-- Both columns are nullable: existing rows have neither, and ride-creation isn't wired to send
-- either yet (that's Phase 3 frontend work) -- this migration only adds the columns.
ALTER TABLE "rides" ADD COLUMN "vehicleType" "VehicleType",
ADD COLUMN "fareTier" "RideFareTier";
