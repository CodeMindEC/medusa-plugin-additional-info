import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class InitialSetup20260108150000 extends Migration {
    async up(): Promise<void> {
        this.addSql(
            'create table if not exists "additional_info_template" ("id" text not null, "name" text not null, "description" text null, "attributes" jsonb not null default \'{}\', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "additional_info_template_pkey" primary key ("id"));'
        )
        this.addSql(
            'create index if not exists "IDX_additional_info_template_deleted_at" on "additional_info_template" ("deleted_at");'
        )

        this.addSql(
            'create table if not exists "additional_info_value" ("id" text not null, "product_id" text not null, "template_id" text not null, "values" jsonb not null default \'{}\', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "additional_info_value_pkey" primary key ("id"));'
        )
        this.addSql(
            'create index if not exists "IDX_additional_info_value_product_id" on "additional_info_value" ("product_id") where deleted_at is null;'
        )
        this.addSql(
            'create index if not exists "IDX_additional_info_value_template_id" on "additional_info_value" ("template_id") where deleted_at is null;'
        )
        this.addSql(
            'create unique index if not exists "IDX_additional_info_value_product_template_unique" on "additional_info_value" ("product_id", "template_id") where deleted_at is null;'
        )
        this.addSql(
            'create index if not exists "IDX_additional_info_value_deleted_at" on "additional_info_value" ("deleted_at");'
        )
        this.addSql(
            'alter table if exists "additional_info_value" add constraint "additional_info_value_template_id_foreign" foreign key ("template_id") references "additional_info_template" ("id") on update cascade on delete cascade;'
        )
    }

    async down(): Promise<void> {
        this.addSql(
            'alter table if exists "additional_info_value" drop constraint if exists "additional_info_value_template_id_foreign";'
        )
        this.addSql('drop table if exists "additional_info_value";')
        this.addSql('drop table if exists "additional_info_template";')
    }
}
