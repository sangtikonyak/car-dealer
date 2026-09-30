CREATE TABLE `HomepageContent` (
    `id` VARCHAR(191) NOT NULL,
    `site` JSON NOT NULL,
    `hero` JSON NOT NULL,
    `howItWorks` JSON NOT NULL,
    `faq` JSON NOT NULL,
    `benefitsIntro` JSON NOT NULL,
    `showroom` JSON NOT NULL,
    `about` JSON NOT NULL,
    `bookingCta` JSON NOT NULL,
    `footer` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HomepageStep` (
    `id` VARCHAR(191) NOT NULL,
    `homepageId` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `iconKey` VARCHAR(191) NOT NULL,
    `displayOrder` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (`id`),
    INDEX `HomepageStep_homepageId_isActive_displayOrder_idx` (`homepageId`, `isActive`, `displayOrder`),
    CONSTRAINT `HomepageStep_homepageId_fkey` FOREIGN KEY (`homepageId`) REFERENCES `HomepageContent` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HomepageFaq` (
    `id` VARCHAR(191) NOT NULL,
    `homepageId` VARCHAR(191) NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `answer` TEXT NOT NULL,
    `displayOrder` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (`id`),
    INDEX `HomepageFaq_homepageId_isActive_displayOrder_idx` (`homepageId`, `isActive`, `displayOrder`),
    CONSTRAINT `HomepageFaq_homepageId_fkey` FOREIGN KEY (`homepageId`) REFERENCES `HomepageContent` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HomepageBenefit` (
    `id` VARCHAR(191) NOT NULL,
    `homepageId` VARCHAR(191) NOT NULL,
    `iconKey` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `tone` VARCHAR(191) NOT NULL,
    `displayOrder` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (`id`),
    INDEX `HomepageBenefit_homepageId_isActive_displayOrder_idx` (`homepageId`, `isActive`, `displayOrder`),
    CONSTRAINT `HomepageBenefit_homepageId_fkey` FOREIGN KEY (`homepageId`) REFERENCES `HomepageContent` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MediaAsset` (
    `id` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `storageName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `width` INTEGER NOT NULL,
    `height` INTEGER NOT NULL,
    `bytes` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `MediaAsset_storageName_key` (`storageName`),
    INDEX `MediaAsset_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `NewsletterSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `source` VARCHAR(191) NOT NULL DEFAULT 'homepage',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `NewsletterSubscription_email_key` (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
