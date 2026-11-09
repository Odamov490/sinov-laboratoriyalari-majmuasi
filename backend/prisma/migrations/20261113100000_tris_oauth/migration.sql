-- Tris integratsiyasi: OAuth 2.0 (Authorization Code + PKCE) ulanishlari,
-- bir martalik state'lar va ulanish tarixi. Tokenlar shifrlangan holda.

-- CreateEnum
CREATE TYPE "TrisConnectionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'ERROR');

-- CreateEnum
CREATE TYPE "TrisConnectionEventType" AS ENUM ('CONNECTED', 'DISCONNECTED', 'REFRESHED', 'REFRESH_FAILED', 'REVOKED_BY_ADMIN', 'ERROR');

-- CreateTable
CREATE TABLE "TrisConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "TrisConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "tokenType" TEXT NOT NULL DEFAULT 'Bearer',
    "scope" TEXT,
    "accessExpiresAt" TIMESTAMP(3),
    "trisSubject" TEXT,
    "trisDisplayName" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "lastRefreshAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrisConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrisOAuthState" (
    "id" TEXT NOT NULL,
    "stateHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeVerifierEnc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "TrisOAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrisConnectionEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TrisConnectionEventType" NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrisConnectionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrisConnection_userId_key" ON "TrisConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrisConnection_trisSubject_key" ON "TrisConnection"("trisSubject");

-- CreateIndex
CREATE INDEX "TrisConnection_status_idx" ON "TrisConnection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TrisOAuthState_stateHash_key" ON "TrisOAuthState"("stateHash");

-- CreateIndex
CREATE INDEX "TrisOAuthState_userId_idx" ON "TrisOAuthState"("userId");

-- CreateIndex
CREATE INDEX "TrisOAuthState_expiresAt_idx" ON "TrisOAuthState"("expiresAt");

-- CreateIndex
CREATE INDEX "TrisConnectionEvent_userId_createdAt_idx" ON "TrisConnectionEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TrisConnectionEvent_createdAt_idx" ON "TrisConnectionEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "TrisConnection" ADD CONSTRAINT "TrisConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrisOAuthState" ADD CONSTRAINT "TrisOAuthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrisConnectionEvent" ADD CONSTRAINT "TrisConnectionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

