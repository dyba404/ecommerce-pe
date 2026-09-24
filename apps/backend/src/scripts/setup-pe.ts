// setup-pe.ts — T2 (región PE) + T3 parcial (producto TEST) del change mvp-ropa.
// Usa SOLO workflows oficiales de Medusa core-flows, mismo patrón que
// src/migration-scripts/initial-data-seed.ts. Idempotente: cada bloque chequea
// existencia antes de crear, se puede re-correr sin duplicar.
// Correr desde apps/backend: ./node_modules/.bin/medusa exec src/scripts/setup-pe.ts
import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  MedusaError,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function setupPE({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // --- T2: Región PE (PEN) + tax region IGV 18% (ajustable en Admin) ---
  const { data: regionData } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
  });
  let peRegion: { id: string; currency_code: string } | undefined = regionData.find(
    (r) => r.currency_code === "pen"
  );

  if (!peRegion) {
    logger.info("Creando región PE (PEN)...");
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Peru",
            currency_code: "pen",
            countries: ["pe"],
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
    peRegion = result[0];
    await createTaxRegionsWorkflow(container).run({
      input: [
        {
          country_code: "pe",
          provider_id: "tp_system",
        },
      ],
    });
    logger.info("Región PE creada.");
  } else {
    logger.info("Región PE ya existe, saltando.");
  }

  const peRegionId = peRegion?.id;
  if (!peRegionId) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Región PE no disponible tras crear/buscar; no se pueden crear los envíos."
    );
  }

  // --- T2: tax rate IGV 18% default (idempotente; el input anidado `rates` del
  // workflow de tax regions NO lo crea — lección verificada) ---
  const { data: taxRegionData } = await query.graph({
    entity: "tax_region",
    fields: ["id", "country_code"],
  });
  const peTaxRegion = taxRegionData.find((t) => t.country_code === "pe");
  if (!peTaxRegion) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Tax region PE no encontrada tras createTaxRegionsWorkflow."
    );
  }
  const { data: taxRateData } = await query.graph({
    entity: "tax_rate",
    fields: ["id", "code", "tax_region.id"],
  });
  const igvExists = taxRateData.some(
    (r) => r.tax_region?.id === peTaxRegion.id && r.code === "IGV"
  );
  if (!igvExists) {
    const taxService = container.resolve(ModuleRegistrationName.TAX);
    await taxService.createTaxRates([
      {
        tax_region_id: peTaxRegion.id,
        name: "IGV",
        code: "IGV",
        rate: 18,
        is_default: true,
      },
    ]);
    logger.info("Tax rate IGV 18% default creado para PE.");
  } else {
    logger.info("Tax rate IGV ya existe, saltando.");
  }

  // --- T2: Stock location Lima enlazada a fulfillment manual + sales channel ---
  const { data: locData } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  });
  if (!locData.some((l) => l.name === "Lima")) {
    const { result: locResult } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "Lima",
            address: { city: "Lima", country_code: "PE", address_1: "" },
          },
        ],
      },
    });
    const limaId = locResult[0].id;
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: limaId },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    });
    const { data: channels } = await query.graph({
      entity: "sales_channel",
      fields: ["id", "name"],
    });
    const defaultChannel = channels.find((c) => c.name === "Default Sales Channel");
    if (defaultChannel) {
      await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: { id: limaId, add: [defaultChannel.id] },
      });
    }
    logger.info("Stock location Lima creada y enlazada.");
  } else {
    logger.info("Stock location Lima ya existe, saltando.");
  }

  // --- T2: fulfillment set PE + envíos Lima (S/10) y Provincias (S/15), céntimos ---
  const { data: optData } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name"],
  });
  if (!optData.some((o) => o.name === "Envío Lima")) {
    const fulfillmentModuleService = container.resolve(
      ModuleRegistrationName.FULFILLMENT
    );
    const { data: limaData } = await query.graph({
      entity: "stock_location",
      fields: ["id", "name"],
    });
    const limaId = limaData.find((l) => l.name === "Lima")!.id;

    const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "Lima delivery",
      type: "shipping",
      service_zones: [
        { name: "Peru", geo_zones: [{ country_code: "pe", type: "country" }] },
      ],
    });
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: limaId },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    });
    const { data: profileData } = await query.graph({
      entity: "shipping_profile",
      fields: ["id"],
    });
    const shippingProfile = profileData[0];
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Envío Lima",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: fulfillmentSet.service_zones[0].id,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Lima",
            description: "Entrega en Lima en 1-2 días hábiles.",
            code: "lima",
          },
          prices: [
            { currency_code: "pen", amount: 1000 }, // S/10.00 en céntimos
            { region_id: peRegionId, amount: 1000 },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
        {
          name: "Envío Provincias",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: fulfillmentSet.service_zones[0].id,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Provincias",
            description: "Envío a provincias en 3-5 días hábiles.",
            code: "provincias",
          },
          prices: [
            { currency_code: "pen", amount: 1500 }, // S/15.00 en céntimos
            { region_id: peRegionId, amount: 1500 },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
      ],
    });
    logger.info("Envíos Lima (S/10) y Provincias (S/15) creados — editables en Admin.");
  } else {
    logger.info("Envíos PE ya existen, saltando.");
  }

  // --- T3 parcial: producto de PRUEBA etiquetado TEST para el E2E (no vender) ---
  const { data: prodData } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
  });
  if (!prodData.some((p) => p.handle === "test-polo")) {
    const { data: optionData } = await query.graph({
      entity: "product_option",
      fields: ["id", "title"],
    });
    const sizeOption = optionData.find((o) => o.title === "Size");
    const colorOption = optionData.find((o) => o.title === "Color");
    const { data: profileData } = await query.graph({
      entity: "shipping_profile",
      fields: ["id"],
    });
    const shippingProfile = profileData[0];
    const { data: channels } = await query.graph({
      entity: "sales_channel",
      fields: ["id"],
    });
    const defaultChannel = channels[0];
    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: "[TEST] Polo de prueba",
            subtitle: "Producto de prueba para el E2E — no vender",
            description:
              "Producto de PRUEBA creado por el setup del change mvp-ropa para probar el checkout E2E. No es producto real de catálogo.",
            handle: "test-polo",
            weight: 300,
            status: ProductStatus.PUBLISHED,
            shipping_profile_id: shippingProfile.id,
            metadata: { productType: "apparel", test: true },
            images: [
              {
                url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png",
              },
            ],
            options: [
              ...(sizeOption ? [{ id: sizeOption.id }] : []),
              ...(colorOption ? [{ id: colorOption.id }] : []),
            ],
            variants: [
              {
                title: "S / Black",
                sku: "TEST-POLO-S-BLACK",
                options: { Size: "S", Color: "Black" },
                prices: [{ amount: 4900, currency_code: "pen" }], // S/49.00
              },
              {
                title: "M / Black",
                sku: "TEST-POLO-M-BLACK",
                options: { Size: "M", Color: "Black" },
                prices: [{ amount: 4900, currency_code: "pen" }],
              },
              {
                title: "L / Black",
                sku: "TEST-POLO-L-BLACK",
                options: { Size: "L", Color: "Black" },
                prices: [{ amount: 4900, currency_code: "pen" }],
              },
            ],
            sales_channels: [{ id: defaultChannel.id }],
          },
        ],
      },
    });
    logger.info("Producto [TEST] Polo de prueba creado (S/49 PEN) — para E2E, no vender.");
  } else {
    logger.info("Producto TEST ya existe, saltando.");
  }

  // --- T3: inventario en Lima para items sin stock (el seed del starter solo
  // cubrió SUS productos en el European Warehouse) ---
  const { data: limaLoc } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  });
  const limaIdFinal = limaLoc.find((l) => l.name === "Lima")?.id;
  if (limaIdFinal) {
    const { data: items } = await query.graph({
      entity: "inventory_item",
      fields: ["id"],
    });
    const { data: levels } = await query.graph({
      entity: "inventory_level",
      fields: ["inventory_item_id", "location_id"],
    });
    const enLima = new Set(
      levels.filter((l) => l.location_id === limaIdFinal).map((l) => l.inventory_item_id)
    );
    const faltantes = items
      .filter((i) => !enLima.has(i.id))
      .map((i) => ({
        location_id: limaIdFinal,
        stocked_quantity: 1000,
        inventory_item_id: i.id,
      }));
    if (faltantes.length) {
      await createInventoryLevelsWorkflow(container).run({
        input: { inventory_levels: faltantes },
      });
      logger.info(`Inventario creado en Lima para ${faltantes.length} items.`);
    } else {
      logger.info("Inventario en Lima ya cubierto, saltando.");
    }
  }

  logger.info("Setup PE completado.");
}
