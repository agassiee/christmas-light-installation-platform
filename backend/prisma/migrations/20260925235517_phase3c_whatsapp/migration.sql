-- AlterEnum
ALTER TYPE "NotificationStatus" ADD VALUE 'READ';

-- CreateTable
CREATE TABLE "NotificationDeliveryEvent" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "providerMessageId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationDeliveryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDeliveryEvent_eventKey_key" ON "NotificationDeliveryEvent"("eventKey");

-- CreateIndex
CREATE INDEX "NotificationDeliveryEvent_providerMessageId_idx" ON "NotificationDeliveryEvent"("providerMessageId");

-- AddForeignKey
ALTER TABLE "NotificationDeliveryEvent" ADD CONSTRAINT "NotificationDeliveryEvent_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
