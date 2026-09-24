/**
 * Initial ropa catalogue (REQ-CAT-05): 15 realistic generic garments with
 * Size × Color variants, PEN prices and deterministic handles. The owner's
 * real list replaces this catalogue later with no code changes (scenario 3).
 *
 *   npx medusa exec ./src/scripts/seed-catalogo-ropa.ts
 *
 * Idempotent: products, collections, categories, tags and option values are
 * skipped when they already exist (dedupe by deterministic handle/title).
 * Also removes the `demo-*` filler products from seed-demo-products.ts,
 * which that script documents as safe to delete.
 */
import {
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductTagsWorkflow,
  createProductsWorkflow,
  deleteProductsWorkflow,
  updateProductOptionsWorkflow,
} from '@medusajs/medusa/core-flows'
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
} from '@medusajs/framework/utils'
import type { ExecArgs } from '@medusajs/framework/types'

const HANDLE_PREFIX = 'ropa'
const SIZES = ['S', 'M', 'L', 'XL']
/** Shared Color option must hold these values (initial seed only has Black/White). */
const COLOR_PALETTE = ['Black', 'White', 'Navy', 'Beige', 'Gray', 'Olive']

const COLLECTIONS = ['Básicos', 'Denim', 'Casacas y Abrigos', 'Verano 2026']
const CATEGORIES = ['Polos y Tops', 'Poleras y Chompas', 'Camisas', 'Pantalones', 'Vestidos y Faldas']
const TAGS = ['algodon', 'lino', 'denim', 'basico', 'verano', 'invierno']

/** Medusa-hosted demo imagery (same CDN the starter uses), reused per garment type. */
const IMG = {
  teeBlack: 'https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png',
  teeWhite: 'https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png',
  sweatshirt: 'https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png',
  sweatpants: 'https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png',
  shorts: 'https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png',
}

type Garment = {
  title: string
  description: string
  pricePEN: number
  category: string
  collection: string
  tags: string[]
  colors: string[]
  image: string
}

const GARMENTS: Garment[] = [
  { title: 'Polo algodón pima cuello redondo', description: 'Polo de algodón pima peruano 200 g, cuello redondo, fit regular. Preencogido y suave al tacto.', pricePEN: 59, category: 'Polos y Tops', collection: 'Básicos', tags: ['algodon', 'basico'], colors: ['White', 'Black', 'Navy'], image: IMG.teeWhite },
  { title: 'Polo oversize estampado', description: 'Polo oversize de algodón peinado con estampado serigráfico frontal de bajo relieve.', pricePEN: 69, category: 'Polos y Tops', collection: 'Verano 2026', tags: ['algodon', 'verano'], colors: ['Black', 'White'], image: IMG.teeBlack },
  { title: 'Camisa de lino manga larga', description: 'Camisa 100% lino lavado, manga larga con botones de nácar. Caída ligera para clima cálido.', pricePEN: 149, category: 'Camisas', collection: 'Verano 2026', tags: ['lino', 'verano'], colors: ['White', 'Beige'], image: IMG.teeWhite },
  { title: 'Camisa oxford manga corta', description: 'Camisa oxford de algodón, manga corta, bolsillo con tapa. Ideal media estación.', pricePEN: 129, category: 'Camisas', collection: 'Básicos', tags: ['algodon', 'basico'], colors: ['White', 'Navy'], image: IMG.teeWhite },
  { title: 'Polera con capucha french terry', description: 'Polera de french terry 320 g con capucha forrada, bolsillo canguro y puños acanalados.', pricePEN: 129, category: 'Poleras y Chompas', collection: 'Básicos', tags: ['algodon', 'basico', 'invierno'], colors: ['Gray', 'Black', 'Navy'], image: IMG.sweatshirt },
  { title: 'Chompa tejido cuello alto', description: 'Chompa tejida en mezcla de algodón y acrílico, cuello alto, punto jersey fino.', pricePEN: 139, category: 'Poleras y Chompas', collection: 'Casacas y Abrigos', tags: ['invierno'], colors: ['Beige', 'Olive', 'Black'], image: IMG.sweatshirt },
  { title: 'Chompa alpaca blend', description: 'Chompa en mezcla de fibra de alpaca, tejido interlock, fit relajado. Suavidad premium.', pricePEN: 259, category: 'Poleras y Chompas', collection: 'Casacas y Abrigos', tags: ['invierno'], colors: ['Beige', 'Gray'], image: IMG.sweatshirt },
  { title: 'Pantalón jogger gabardina', description: 'Jogger de gabardina elastizada, cintura con cordón, bolsillos laterales y posteriores.', pricePEN: 119, category: 'Pantalones', collection: 'Básicos', tags: ['basico'], colors: ['Black', 'Olive', 'Beige'], image: IMG.sweatpants },
  { title: 'Jean recto clásico', description: 'Jean de corte recto en denim rígido 12 oz, tiro medio, lavado medio oscuro.', pricePEN: 149, category: 'Pantalones', collection: 'Denim', tags: ['denim'], colors: ['Navy', 'Black'], image: IMG.sweatpants },
  { title: 'Jean skinny stretch', description: 'Jean skinny en denim stretch 11 oz, tiro alto, recuperación de forma garantizada.', pricePEN: 139, category: 'Pantalones', collection: 'Denim', tags: ['denim'], colors: ['Navy', 'Black', 'Gray'], image: IMG.sweatpants },
  { title: 'Short de denim', description: 'Short de denim 10 oz, corte sobre la rodilla, dobladillo deshilachado.', pricePEN: 89, category: 'Pantalones', collection: 'Verano 2026', tags: ['denim', 'verano'], colors: ['Navy', 'White'], image: IMG.shorts },
  { title: 'Casaca cortavientos', description: 'Cortavientos ultraliviano con capucha, repelente al agua, bolsillos con cierre.', pricePEN: 189, category: 'Poleras y Chompas', collection: 'Casacas y Abrigos', tags: ['invierno'], colors: ['Navy', 'Olive', 'Black'], image: IMG.sweatshirt },
  { title: 'Casaca denim trucker', description: 'Casaca trucker en denim 13 oz, botones metálicos, calce regular.', pricePEN: 219, category: 'Poleras y Chompas', collection: 'Denim', tags: ['denim'], colors: ['Navy', 'Gray'], image: IMG.sweatshirt },
  { title: 'Vestido midi estampado', description: 'Vestido midi en viscosa fluida con estampado floral, escote en V y manga corta.', pricePEN: 169, category: 'Vestidos y Faldas', collection: 'Verano 2026', tags: ['verano'], colors: ['Beige', 'Olive'], image: IMG.teeWhite },
  { title: 'Falda plisada', description: 'Falda plisada en satín mate, largo midi, cintura elastizada.', pricePEN: 99, category: 'Vestidos y Faldas', collection: 'Básicos', tags: ['basico'], colors: ['Black', 'Beige'], image: IMG.teeWhite },
]

/** Stock per variant at the Lima location; deterministic, no PRNG needed. */
const STOCK_PER_VARIANT = 25

export default async function seedCatalogoRopa({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // ---- Prerequisites --------------------------------------------------------

  const { data: salesChannels } = await query.graph({
    entity: 'sales_channel',
    fields: ['id', 'name'],
  })
  const { data: shippingProfiles } = await query.graph({
    entity: 'shipping_profile',
    fields: ['id'],
  })

  const salesChannel = salesChannels[0]
  const shippingProfile = shippingProfiles[0]

  if (!salesChannel || !shippingProfile) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'No sales channel or shipping profile found. Run the initial data seed first.'
    )
  }

  // ---- Shared options: ensure Size/Color exist with the needed values -------

  const { data: optionRows } = await query.graph({
    entity: 'product_option',
    fields: ['id', 'title', 'values.value'],
    filters: { is_exclusive: false },
  })

  const findOption = (title: string) => optionRows.find((o) => o.title === title)
  const sizeOption = findOption('Size')
  const colorOption = findOption('Color')

  if (!sizeOption || !colorOption) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'Shared "Size"/"Color" options not found. Run the initial data seed first.'
    )
  }

  const existingColors = (colorOption.values ?? [])
    .map((v) => v?.value)
    .filter((v): v is string => Boolean(v))
  const missingColors = COLOR_PALETTE.filter((c) => !existingColors.includes(c))

  if (missingColors.length) {
    await updateProductOptionsWorkflow(container).run({
      input: {
        selector: { id: colorOption.id as string },
        update: { values: [...existingColors, ...missingColors] },
      },
    })
    logger.info(`Color option extended with: ${missingColors.join(', ')}`)
  }

  // ---- Collections, categories, tags ---------------------------------------

  const { data: existingCollections } = await query.graph({
    entity: 'product_collection',
    fields: ['id', 'title'],
  })
  const missingCollections = COLLECTIONS.filter(
    (t) => !existingCollections.some((c) => c.title === t)
  )
  if (missingCollections.length) {
    await createCollectionsWorkflow(container).run({
      input: { collections: missingCollections.map((title) => ({ title })) },
    })
    logger.info(`Created collections: ${missingCollections.join(', ')}`)
  }

  const { data: existingCategories } = await query.graph({
    entity: 'product_category',
    fields: ['id', 'name'],
  })
  const missingCategories = CATEGORIES.filter(
    (t) => !existingCategories.some((c) => c.name === t)
  )
  if (missingCategories.length) {
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missingCategories.map((name) => ({
          name,
          is_active: true,
        })),
      },
    })
    logger.info(`Created categories: ${missingCategories.join(', ')}`)
  }

  const { data: existingTags } = await query.graph({
    entity: 'product_tag',
    fields: ['id', 'value'],
  })
  const missingTags = TAGS.filter((v) => !existingTags.some((t) => t.value === v))
  if (missingTags.length) {
    await createProductTagsWorkflow(container).run({
      input: { product_tags: missingTags.map((value) => ({ value })) },
    })
    logger.info(`Created tags: ${missingTags.join(', ')}`)
  }

  // Re-read the lookup tables once, after creation.
  const [{ data: allCollections }, { data: allCategories }, { data: allTags }] =
    await Promise.all([
      query.graph({ entity: 'product_collection', fields: ['id', 'title'] }),
      query.graph({ entity: 'product_category', fields: ['id', 'name'] }),
      query.graph({ entity: 'product_tag', fields: ['id', 'value'] }),
    ])

  const collectionId = (title: string) =>
    allCollections.find((c) => c.title === title)?.id as string | undefined
  const categoryIds = (name: string) =>
    allCategories.filter((c) => c.name === name).map((c) => c.id as string)
  const tagIds = (values: string[]) =>
    allTags.filter((t) => values.includes(t.value as string)).map((t) => t.id as string)

  // ---- Products -------------------------------------------------------------

  const { data: existingProducts } = await query.graph({
    entity: 'product',
    fields: ['id', 'handle'],
  })
  const takenHandles = new Set(existingProducts.map((p) => p.handle).filter(Boolean))

  const slug = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const products = GARMENTS.map((garment, index) => {
    const handle = `${HANDLE_PREFIX}-${String(index + 1).padStart(2, '0')}-${slug(garment.title)}`

    if (takenHandles.has(handle)) {
      return null
    }

    const variants = SIZES.flatMap((size) =>
      garment.colors.map((color) => ({
        title: `${size} / ${color}`,
        sku: `${handle.toUpperCase().replace(/-/g, '_')}-${size}-${color.toUpperCase()}`,
        options: { Size: size, Color: color },
        manage_inventory: true,
        prices: [{ amount: garment.pricePEN, currency_code: 'pen' }],
      }))
    )

    return {
      title: garment.title,
      handle,
      description: garment.description,
      status: ProductStatus.PUBLISHED,
      thumbnail: garment.image,
      images: [{ url: garment.image }],
      metadata: { productType: 'apparel' },
      shipping_profile_id: shippingProfile.id,
      collection_id: collectionId(garment.collection),
      category_ids: categoryIds(garment.category),
      tag_ids: tagIds(garment.tags),
      sales_channels: [{ id: salesChannel.id }],
      options: [{ id: sizeOption.id }, { id: colorOption.id }],
      variants,
    }
  }).filter((p): p is NonNullable<typeof p> => p !== null)

  if (!products.length) {
    logger.info('Toda la ropa del catálogo inicial ya existe. Nada que crear.')
  } else {
    await createProductsWorkflow(container).run({
      input: { products: products as never },
    })
    logger.info(`Creados ${products.length} productos de ropa.`)
  }

  // ---- Stock at the Lima location -------------------------------------------

  const createdHandles = products.map((p) => p.handle as string)

  if (createdHandles.length) {
    const { data: locations } = await query.graph({
      entity: 'stock_location',
      fields: ['id', 'name'],
    })
    const lima = locations.find((l) => (l.name as string).toLowerCase().includes('lima'))

    if (!lima) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        'Stock location de Lima no encontrada. Corre setup-pe.ts primero.'
      )
    }

    const { data: variants } = await query.graph({
      entity: 'product_variant',
      fields: ['id', 'inventory_items.inventory_item_id', 'product.handle'],
      filters: { product: { handle: createdHandles } },
    })

    const itemIds = variants
      .flatMap((v) => (v.inventory_items ?? []).map((i) => i?.inventory_item_id))
      .filter((id): id is string => Boolean(id))

    const { data: existingLevels } = await query.graph({
      entity: 'inventory_level',
      fields: ['inventory_item_id'],
      filters: { location_id: lima.id as string },
    })
    const leveledItems = new Set(existingLevels.map((l) => l.inventory_item_id))

    const toStock = itemIds.filter((id) => !leveledItems.has(id))

    if (toStock.length) {
      await createInventoryLevelsWorkflow(container).run({
        input: {
          inventory_levels: toStock.map((inventory_item_id) => ({
            inventory_item_id,
            location_id: lima.id as string,
            stocked_quantity: STOCK_PER_VARIANT,
          })),
        },
      })
      logger.info(`Stock de ${STOCK_PER_VARIANT} uds en Lima para ${toStock.length} variantes.`)
    }
  }

  // ---- Remove demo filler products (documented as safe to delete) -----------

  // Merch demo del starter de Medusa (sin precios PEN: salen rotos en la
  // región Peru). Ningún producto del catálogo real usa estos handles.
  const STARTER_DEMO_HANDLES = ['t-shirt', 'sweatpants', 'shorts', 'sweatshirt']

  const { data: allProductHandles } = await query.graph({
    entity: 'product',
    fields: ['id', 'handle'],
  })
  const demoIds = allProductHandles
    .filter((p) => {
      const handle = p.handle as string
      return handle.startsWith('demo-') || STARTER_DEMO_HANDLES.includes(handle)
    })
    .map((p) => p.id as string)

  if (demoIds.length) {
    await deleteProductsWorkflow(container).run({ input: { ids: demoIds } })
    logger.info(`Eliminados ${demoIds.length} productos demo (demo-* + merch starter).`)
  }

  // ---- Search index catch-up (same pattern as the demo seed) ----------------

  try {
    const search = container.resolve(Modules.SEARCH)
    const { data: allProducts } = await query.graph({
      entity: 'product',
      fields: ['id'],
    })
    for (let start = 0; start < allProducts.length; start += 25) {
      const chunk = allProducts.slice(start, start + 25)
      await search.ingest({
        name: 'product.created',
        data: chunk.map((product) => ({ id: product.id })),
      } as never)
    }
    logger.info(`Índice de búsqueda actualizado para ${allProducts.length} producto(s).`)
  } catch {
    logger.warn(
      'Módulo SEARCH no registrado todavía (T5b pendiente): se omite la re-ingesta.'
    )
  }

  logger.info('Catálogo inicial de ropa listo.')
}
