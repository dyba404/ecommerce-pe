# apps/workers/catalog-sync — FASE 2 (ficha de scaffolding)

BullMQ + Redis. Jobs `sync-supplier/price-watch/catalog-enrich` con Firecrawl/ScrapeGraph/Crawl4AI → normalización Zod → upsert vía Workflows/API Medusa. PROHIBIDO en MVP y prohibido SQL directo.
