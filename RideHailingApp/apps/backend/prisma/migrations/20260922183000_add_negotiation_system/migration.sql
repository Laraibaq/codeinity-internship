-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('active', 'accepted', 'rejected', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "NegotiationOfferType" AS ENUM ('initial', 'counter', 'accept');

-- CreateEnum
CREATE TYPE "NegotiationOfferStatus" AS ENUM ('pending', 'accepted', 'rejected', 'expired', 'superseded');

-- CreateTable
CREATE TABLE "negotiations" (
    "id" UUID NOT NULL,
    "rideId" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "passengerId" UUID NOT NULL,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'active',
    "currentAmount" DECIMAL(10,2) NOT NULL,
    "currentProposerId" UUID NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negotiations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiation_offers" (
    "id" UUID NOT NULL,
    "negotiationId" UUID NOT NULL,
    "rideId" UUID NOT NULL,
    "proposerId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "NegotiationOfferType" NOT NULL DEFAULT 'counter',
    "status" "NegotiationOfferStatus" NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "idempotencyKey" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negotiation_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "negotiations_rideId_idx" ON "negotiations"("rideId");

-- CreateIndex
CREATE INDEX "negotiations_driverId_idx" ON "negotiations"("driverId");

-- CreateIndex
CREATE INDEX "negotiations_passengerId_idx" ON "negotiations"("passengerId");

-- CreateIndex
CREATE INDEX "negotiations_status_idx" ON "negotiations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "negotiations_rideId_driverId_key" ON "negotiations"("rideId", "driverId");

-- CreateIndex
CREATE UNIQUE INDEX "negotiation_offers_idempotencyKey_key" ON "negotiation_offers"("idempotencyKey");

-- CreateIndex
CREATE INDEX "negotiation_offers_negotiationId_idx" ON "negotiation_offers"("negotiationId");

-- CreateIndex
CREATE INDEX "negotiation_offers_rideId_idx" ON "negotiation_offers"("rideId");

-- CreateIndex
CREATE INDEX "negotiation_offers_proposerId_idx" ON "negotiation_offers"("proposerId");

-- CreateIndex
CREATE INDEX "negotiation_offers_status_idx" ON "negotiation_offers"("status");

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "rides"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_offers" ADD CONSTRAINT "negotiation_offers_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "negotiations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_offers" ADD CONSTRAINT "negotiation_offers_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "rides"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
