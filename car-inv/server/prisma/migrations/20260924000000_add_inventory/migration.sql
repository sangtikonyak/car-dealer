ALTER TABLE `adminuser` MODIFY `passwordHash` VARCHAR(191) NOT NULL;
ALTER TABLE `homepagecontent` MODIFY `id` VARCHAR(191) NOT NULL DEFAULT 'default';

CREATE TABLE `VehicleMake` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `VehicleMake_name_key`(`name`),
    UNIQUE INDEX `VehicleMake_slug_key`(`slug`),
    INDEX `VehicleMake_isActive_name_idx`(`isActive`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `VehicleFuelType` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `VehicleFuelType_name_key`(`name`),
    UNIQUE INDEX `VehicleFuelType_slug_key`(`slug`),
    INDEX `VehicleFuelType_isActive_name_idx`(`isActive`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Vehicle` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `makeId` VARCHAR(191) NOT NULL,
    `fuelTypeId` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `trim` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `mileage` INTEGER NOT NULL,
    `priceNegotiable` BOOLEAN NOT NULL DEFAULT false,
    `exterior` VARCHAR(191) NOT NULL,
    `interior` VARCHAR(191) NOT NULL,
    `vin` VARCHAR(191) NOT NULL,
    `engine` VARCHAR(191) NOT NULL,
    `power` VARCHAR(191) NOT NULL,
    `torque` VARCHAR(191) NOT NULL,
    `transmission` VARCHAR(191) NOT NULL,
    `drivetrain` VARCHAR(191) NOT NULL,
    `range` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `specificationSource` VARCHAR(500) NOT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `Vehicle_slug_key`(`slug`),
    UNIQUE INDEX `Vehicle_vin_key`(`vin`),
    INDEX `Vehicle_makeId_isPublished_idx`(`makeId`, `isPublished`),
    INDEX `Vehicle_fuelTypeId_isPublished_idx`(`fuelTypeId`, `isPublished`),
    INDEX `Vehicle_isPublished_updatedAt_idx`(`isPublished`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `VehiclePhoto` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(191) NOT NULL,
    `storageName` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `alt` VARCHAR(191) NOT NULL,
    `width` INTEGER NOT NULL,
    `height` INTEGER NOT NULL,
    `bytes` INTEGER NOT NULL,
    `displayOrder` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `VehiclePhoto_storageName_key`(`storageName`),
    INDEX `VehiclePhoto_vehicleId_displayOrder_idx`(`vehicleId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `VehicleDocument` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `url` VARCHAR(500) NULL,
    `displayOrder` INTEGER NOT NULL,
    INDEX `VehicleDocument_vehicleId_displayOrder_idx`(`vehicleId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `VehicleHighlight` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `displayOrder` INTEGER NOT NULL,
    INDEX `VehicleHighlight_vehicleId_displayOrder_idx`(`vehicleId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `VehicleCustomField` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `displayOrder` INTEGER NOT NULL,
    INDEX `VehicleCustomField_vehicleId_displayOrder_idx`(`vehicleId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_makeId_fkey` FOREIGN KEY (`makeId`) REFERENCES `VehicleMake`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_fuelTypeId_fkey` FOREIGN KEY (`fuelTypeId`) REFERENCES `VehicleFuelType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `VehiclePhoto` ADD CONSTRAINT `VehiclePhoto_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `VehicleDocument` ADD CONSTRAINT `VehicleDocument_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `VehicleHighlight` ADD CONSTRAINT `VehicleHighlight_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `VehicleCustomField` ADD CONSTRAINT `VehicleCustomField_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
