import { getPrismaClient, disconnectPrisma } from '../src/config/database.js';
import { parseEnvironment } from '../src/config/env.js';
import { homepageDefaults } from '../src/modules/homepage/homepage.defaults.js';
import { hashPassword } from '../src/utils/password.js';

const seed = async (): Promise<void> => {
  const prisma = getPrismaClient();
  await prisma.$connect();
  const environment = parseEnvironment(process.env);
  const { steps, faqs, benefits, ...content } = homepageDefaults;

  await prisma.$transaction(async (transaction) => {
    await transaction.homepageContent.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...content },
      update: content,
    });
    await transaction.homepageStep.deleteMany({ where: { homepageId: 'default' } });
    await transaction.homepageFaq.deleteMany({ where: { homepageId: 'default' } });
    await transaction.homepageBenefit.deleteMany({ where: { homepageId: 'default' } });
    await transaction.homepageStep.createMany({
      data: steps.map((step) => ({ ...step, homepageId: 'default' })),
    });
    await transaction.homepageFaq.createMany({
      data: faqs.map((faq) => ({ ...faq, homepageId: 'default' })),
    });
    await transaction.homepageBenefit.createMany({
      data: benefits.map((benefit) => ({ ...benefit, homepageId: 'default' })),
    });
  });

  if (environment.ADMIN_INITIAL_EMAIL && environment.ADMIN_INITIAL_PASSWORD) {
    await prisma.adminUser.upsert({
      where: { email: environment.ADMIN_INITIAL_EMAIL.toLowerCase() },
      create: {
        email: environment.ADMIN_INITIAL_EMAIL.toLowerCase(),
        passwordHash: await hashPassword(environment.ADMIN_INITIAL_PASSWORD),
      },
      update: {
        passwordHash: await hashPassword(environment.ADMIN_INITIAL_PASSWORD),
        isActive: true,
      },
    });
  }

  const makeNames = ['BMW', 'Porsche', 'Tesla', 'Audi', 'Toyota', 'Mercedes-Benz'];
  const fuelNames = ['Petrol', 'Hybrid', 'Electric'];
  const makeIds = new Map<string, string>();
  const fuelIds = new Map<string, string>();
  for (const name of makeNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/gu, '-');
    const item = await prisma.vehicleMake.upsert({ where: { slug }, create: { name, slug }, update: { name, isActive: true } });
    makeIds.set(name, item.id);
  }
  for (const name of fuelNames) {
    const slug = name.toLowerCase();
    const item = await prisma.vehicleFuelType.upsert({ where: { slug }, create: { name, slug }, update: { name, isActive: true } });
    fuelIds.set(name, item.id);
  }

  const inventory = [
    ['bmw-4-series-430i', 'BMW', '4 Series', '430i M Sport', 'Coupe', 2023, 54900, 9400, 'Petrol', '/images/inventory-blue-convertible.png', 'Portimao Blue Metallic', 'Black Vernasca leather', 'DEMO-430-23-006', '2.0L turbocharged inline-four', '255 hp', '295 lb-ft', '8-speed sport automatic', 'Rear-wheel drive', 'A low-mileage sport coupe with a confident M Sport stance, refined cabin and responsive turbocharged power.'],
    ['porsche-911-carrera-s', 'Porsche', '911', 'Carrera S', 'Coupe', 2021, 119900, 12800, 'Petrol', '/images/inventory/porsche-911-2021.jpg', 'GT Silver Metallic', 'Black leather', 'DEMO-911-21-001', '3.0L twin-turbo flat-six', '443 hp', '390 lb-ft', '8-speed PDK dual-clutch', 'Rear-wheel drive', 'A rear-engine sports coupe with everyday usability and an unmistakable silhouette.'],
    ['tesla-model-3', 'Tesla', 'Model 3', 'Long Range AWD', 'Electric sedan', 2022, 36900, 24100, 'Electric', '/images/inventory/tesla-model-3-2022.jpg', 'Pearl White Multi-Coat', 'Black premium interior', 'DEMO-M3-22-002', 'Dual electric motors', 'Output varies by configuration', 'Not published', 'Single-speed fixed gear', 'Dual-motor all-wheel drive', 'A quiet all-electric sedan with dual-motor all-wheel drive and a minimalist cabin.'],
    ['audi-a4', 'Audi', 'A4', '45 TFSI quattro', 'Sedan', 2022, 32900, 18700, 'Petrol', '/images/inventory/audi-a4-2022.jpg', 'Glacier White Metallic', 'Black leather', 'DEMO-A4-22-003', '2.0L turbocharged inline-four', '245 PS', '370 Nm', '7-speed S tronic dual-clutch', 'quattro all-wheel drive', 'A balanced premium sedan pairing a turbocharged engine with Audi quattro all-wheel drive.'],
    ['toyota-camry-hybrid', 'Toyota', 'Camry', 'SE Hybrid', 'Hybrid sedan', 2022, 25900, 31500, 'Hybrid', '/images/inventory/toyota-camry-se-2022.jpg', 'Predawn Gray Mica', 'Black sport fabric', 'DEMO-CAM-22-004', '2.5L four-cylinder hybrid', '208 hp', '163 lb-ft', 'Electronically controlled CVT', 'Front-wheel drive', 'A practical midsize hybrid sedan with a roomy cabin and efficient powertrain.'],
    ['mercedes-benz-c-class', 'Mercedes-Benz', 'C-Class', 'C 300', 'Sedan', 2022, 38900, 16200, 'Petrol', '/images/inventory/mercedes-c-class-2022.jpg', 'Obsidian Black Metallic', 'Black ARTICO / fabric', 'DEMO-C300-22-005', '2.0L turbocharged inline-four mild hybrid', '255 hp', '295 lb-ft', '9-speed automatic', 'Rear-wheel drive', 'A contemporary luxury sedan with refined cabin and turbocharged power.'],
  ] as const;
  for (const [slug, make, model, trim, category, year, price, mileage, fuel, image, exterior, interior, vin, engine, power, torque, transmission, drivetrain, description] of inventory) {
    const makeId = makeIds.get(make);
    const fuelTypeId = fuelIds.get(fuel);
    if (!makeId || !fuelTypeId) continue;
    const vehicle = await prisma.vehicle.upsert({
      where: { slug },
      create: { slug, makeId, fuelTypeId, model, trim, category, year, price, mileage, priceNegotiable: make !== 'Tesla' && make !== 'Toyota', exterior, interior, vin, engine, power, torque, transmission, drivetrain, description, isPublished: true },
      update: { makeId, fuelTypeId, model, trim, category, year, price, mileage, exterior, interior, vin, engine, power, torque, transmission, drivetrain, description, isPublished: true },
    });
    await prisma.vehicleDocument.deleteMany({ where: { vehicleId: vehicle.id } });
    await prisma.vehicleHighlight.deleteMany({ where: { vehicleId: vehicle.id } });
    await prisma.vehicleCustomField.deleteMany({ where: { vehicleId: vehicle.id } });
    await prisma.vehiclePhoto.deleteMany({ where: { vehicleId: vehicle.id } });
    await prisma.vehiclePhoto.create({ data: { vehicleId: vehicle.id, storageName: `seed-${slug}.jpg`, originalName: `${model} exterior`, url: image, alt: `${year} ${make} ${model}`, width: 1200, height: 800, bytes: 0, displayOrder: 0 } });
    await prisma.vehicleHighlight.createMany({ data: ['Verified history', 'Pre-sale inspection', 'Clear pricing'].map((text, displayOrder) => ({ vehicleId: vehicle.id, text, displayOrder })) });
    await prisma.vehicleCustomField.createMany({ data: [{ label: 'Previous owners', value: '1', displayOrder: 0 }, { label: 'Warranty', value: 'Included', displayOrder: 1 }].map((field) => ({ vehicleId: vehicle.id, ...field })) });
    await prisma.vehicleDocument.createMany({ data: ['PUCC', 'RC', 'Insurance', 'Vehicle history report'].map((name, displayOrder) => ({ vehicleId: vehicle.id, name, status: 'On file', displayOrder })) });
  }
};

seed()
  .then(async () => {
    await disconnectPrisma();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await disconnectPrisma();
    process.exitCode = 1;
  });
