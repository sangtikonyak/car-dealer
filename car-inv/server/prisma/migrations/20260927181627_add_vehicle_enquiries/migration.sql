-- CreateTable
CREATE TABLE `VehicleEnquiry` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(191) NULL,
    `vehicleSlug` VARCHAR(180) NULL,
    `vehicleLabel` VARCHAR(240) NOT NULL,
    `vehicleImageUrl` VARCHAR(500) NULL,
    `vehicleImageAlt` VARCHAR(240) NULL,
    `name` VARCHAR(160) NOT NULL,
    `phone` VARCHAR(80) NULL,
    `email` VARCHAR(254) NULL,
    `fullAddress` TEXT NOT NULL,
    `status` ENUM('NEW', 'CONTACTED', 'FOLLOW_UP', 'PURCHASED', 'LOST', 'CLOSED') NOT NULL DEFAULT 'NEW',
    `remarks` TEXT NULL,
    `purchasePrice` DECIMAL(12, 2) NULL,
    `purchaseDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VehicleEnquiry_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `VehicleEnquiry_createdAt_idx`(`createdAt`),
    INDEX `VehicleEnquiry_vehicleId_idx`(`vehicleId`),
    INDEX `VehicleEnquiry_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VehicleEnquiry` ADD CONSTRAINT `VehicleEnquiry_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
