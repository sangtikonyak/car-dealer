CREATE TABLE `VehicleEnquiryRemark` (
    `id` VARCHAR(191) NOT NULL,
    `enquiryId` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VehicleEnquiryRemark_enquiryId_createdAt_idx`(`enquiryId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `VehicleEnquiryRemark` (`id`, `enquiryId`, `text`, `createdAt`)
SELECT UUID(), `id`, `remarks`, `createdAt`
FROM `VehicleEnquiry`
WHERE `remarks` IS NOT NULL AND TRIM(`remarks`) <> '';

ALTER TABLE `VehicleEnquiryRemark`
    ADD CONSTRAINT `VehicleEnquiryRemark_enquiryId_fkey`
    FOREIGN KEY (`enquiryId`) REFERENCES `VehicleEnquiry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
