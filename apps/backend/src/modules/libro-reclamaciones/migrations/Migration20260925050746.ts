import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260925050746 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "complaint" drop constraint if exists "complaint_code_unique";`);
    this.addSql(`create table if not exists "complaint" ("id" text not null, "code" text not null, "type" text check ("type" in ('reclamo', 'queja')) not null, "full_name" text not null, "document_type" text check ("document_type" in ('dni', 'ce', 'pasaporte', 'ruc')) not null, "document_number" text not null, "email" text not null, "phone" text not null, "address" text not null, "order_reference" text null, "detail" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "complaint_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_complaint_deleted_at" ON "complaint" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_complaint_code_unique" ON "complaint" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_complaint_email" ON "complaint" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_complaint_document_type_document_number" ON "complaint" ("document_type", "document_number") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "complaint" cascade;`);
  }

}
