


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."app_role" AS ENUM (
    'administrator',
    'it_team',
    'employee'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."asset_status" AS ENUM (
    'available',
    'assigned',
    'reserved',
    'repair',
    'lost',
    'disposed',
    'retired',
    'inactive'
);


ALTER TYPE "public"."asset_status" OWNER TO "postgres";


CREATE TYPE "public"."assignment_status" AS ENUM (
    'active',
    'returned',
    'overdue',
    'assigned',
    'unassigned',
    'disposed',
    'inactive'
);


ALTER TYPE "public"."assignment_status" OWNER TO "postgres";


CREATE TYPE "public"."entity_status" AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE "public"."entity_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'asset',
    'assignment',
    'repair',
    'warranty',
    'employee',
    'system'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."repair_status" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."repair_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE user_count INT;
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.email);

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'administrator');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employee');
  END IF;
  RETURN NEW;
END; $$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_or_it"("_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('administrator','it_team')) $$;


ALTER FUNCTION "public"."is_admin_or_it"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_asset_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (entity_type, entity_id, action, description, metadata)
    VALUES ('asset', NEW.id, 'created', 'Asset created: ' || NEW.asset_name, jsonb_build_object('asset_code', NEW.asset_code));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.activity_logs (entity_type, entity_id, action, description, metadata)
      VALUES (
        'asset', NEW.id, 'status_changed',
        'Asset status changed from ' || OLD.status::TEXT || ' to ' || NEW.status::TEXT,
        jsonb_build_object('from_status', OLD.status, 'to_status', NEW.status)
      );
    END IF;
    IF OLD.assigned_employee_id IS DISTINCT FROM NEW.assigned_employee_id THEN
      INSERT INTO public.activity_logs (entity_type, entity_id, action, description, metadata)
      VALUES (
        'asset', NEW.id,
        CASE WHEN NEW.assigned_employee_id IS NULL THEN 'unassigned' ELSE 'assigned' END,
        CASE WHEN NEW.assigned_employee_id IS NULL THEN 'Asset unassigned' ELSE 'Asset assigned' END,
        jsonb_build_object('employee_id', NEW.assigned_employee_id)
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."log_asset_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "description" "text",
    "performed_by" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."asset_code_seq"
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."asset_code_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."asset_disposals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asset_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "disposal_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "remarks" "text",
    "performed_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."asset_disposals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."asset_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asset_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" integer DEFAULT 0 NOT NULL,
    "image_url" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "upload_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."asset_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asset_code" "text" DEFAULT ('AST-'::"text" || "nextval"('"public"."asset_code_seq"'::"regclass")) NOT NULL,
    "asset_name" "text" NOT NULL,
    "category_id" "uuid",
    "brand" "text",
    "model" "text",
    "serial_number" "text",
    "purchase_date" "date",
    "purchase_cost" numeric(12,2),
    "vendor_id" "uuid",
    "invoice_number" "text",
    "warranty_start" "date",
    "warranty_expiry" "date",
    "status" "public"."asset_status" DEFAULT 'available'::"public"."asset_status" NOT NULL,
    "assigned_employee_id" "uuid",
    "location" "text",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "purchase_cost_inr" numeric(14,2),
    "is_deleted" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asset_id" "uuid" NOT NULL,
    "employee_id" "uuid",
    "assigned_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "expected_return_date" "date",
    "returned_date" "date",
    "status" "public"."assignment_status" DEFAULT 'active'::"public"."assignment_status" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reason" "text",
    "performed_by" "text"
);


ALTER TABLE "public"."assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description" "text",
    "status" "public"."entity_status" DEFAULT 'active'::"public"."entity_status" NOT NULL,
    "icon" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dashboard_assets_by_category" AS
 SELECT COALESCE("c"."category_name", 'Uncategorized'::"text") AS "category_name",
    ("count"("a"."id"))::integer AS "asset_count"
   FROM ("public"."assets" "a"
     LEFT JOIN "public"."categories" "c" ON (("c"."id" = "a"."category_id")))
  WHERE (NOT "a"."is_deleted")
  GROUP BY COALESCE("c"."category_name", 'Uncategorized'::"text")
  ORDER BY (("count"("a"."id"))::integer) DESC, COALESCE("c"."category_name", 'Uncategorized'::"text");


ALTER VIEW "public"."dashboard_assets_by_category" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dashboard_assets_by_status" AS
 SELECT ("status")::"text" AS "status",
    ("count"("id"))::integer AS "asset_count"
   FROM "public"."assets" "a"
  WHERE (NOT "is_deleted")
  GROUP BY "status"
  ORDER BY (("count"("id"))::integer) DESC;


ALTER VIEW "public"."dashboard_assets_by_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."repairs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asset_id" "uuid" NOT NULL,
    "issue" "text" NOT NULL,
    "repair_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "completed_date" "date",
    "repair_cost" numeric(12,2),
    "vendor_id" "uuid",
    "status" "public"."repair_status" DEFAULT 'pending'::"public"."repair_status" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expected_return_date" "date",
    "actual_return_date" "date",
    "repair_notes" "text",
    "unassign_reason" "text",
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."repairs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."vendor_code_seq"
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."vendor_code_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_name" "text" NOT NULL,
    "contact_person" "text",
    "email" "text",
    "phone" "text",
    "address" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "vendor_code" "text" DEFAULT ('VND-'::"text" || ("nextval"('"public"."vendor_code_seq"'::"regclass"))::"text") NOT NULL,
    "office_address" "text",
    "vendor_type" "text",
    "status" "public"."entity_status" DEFAULT 'active'::"public"."entity_status" NOT NULL,
    "website" "text",
    "gst_number" "text",
    "notes" "text"
);


ALTER TABLE "public"."vendors" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dashboard_open_repairs" AS
 SELECT "r"."id" AS "repair_id",
    ("r"."status")::"text" AS "repair_status",
    "r"."repair_date",
    "r"."expected_return_date",
    "r"."repair_cost",
    "a"."id" AS "asset_id",
    "a"."asset_code",
    "a"."asset_name",
    "v"."vendor_name"
   FROM (("public"."repairs" "r"
     JOIN "public"."assets" "a" ON (("a"."id" = "r"."asset_id")))
     LEFT JOIN "public"."vendors" "v" ON (("v"."id" = "r"."vendor_id")))
  WHERE (("r"."status" = ANY (ARRAY['pending'::"public"."repair_status", 'in_progress'::"public"."repair_status"])) AND (NOT "a"."is_deleted"))
  ORDER BY "r"."created_at" DESC;


ALTER VIEW "public"."dashboard_open_repairs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "department" "text",
    "designation" "text",
    "manager" "text",
    "location" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "phone" "text",
    "status" "public"."entity_status" DEFAULT 'active'::"public"."entity_status" NOT NULL
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dashboard_recent_activity" AS
 SELECT "asg"."id",
    ("asg"."status")::"text" AS "assignment_status",
    "a"."asset_name",
    "a"."asset_code",
    "e"."name" AS "employee_name",
    "asg"."assigned_date",
    "asg"."returned_date",
    "asg"."reason",
    "asg"."notes",
    "asg"."performed_by",
    "asg"."created_at"
   FROM (("public"."assignments" "asg"
     JOIN "public"."assets" "a" ON (("a"."id" = "asg"."asset_id")))
     LEFT JOIN "public"."employees" "e" ON (("e"."id" = "asg"."employee_id")))
  WHERE (NOT "a"."is_deleted")
  ORDER BY "asg"."created_at" DESC;


ALTER VIEW "public"."dashboard_recent_activity" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dashboard_summary" AS
 SELECT ( SELECT ("count"(*))::integer AS "count"
           FROM "public"."assets"
          WHERE (NOT "assets"."is_deleted")) AS "total_assets",
    ( SELECT ("count"(*))::integer AS "count"
           FROM "public"."employees"
          WHERE ("employees"."status" = 'active'::"public"."entity_status")) AS "total_employees",
    ( SELECT ("count"(*))::integer AS "count"
           FROM "public"."assets"
          WHERE ((NOT "assets"."is_deleted") AND ("assets"."status" = 'assigned'::"public"."asset_status"))) AS "assigned_assets",
    ( SELECT ("count"(*))::integer AS "count"
           FROM "public"."assets"
          WHERE ((NOT "assets"."is_deleted") AND ("assets"."status" = 'available'::"public"."asset_status"))) AS "available_assets",
    ( SELECT ("count"(*))::integer AS "count"
           FROM "public"."assets"
          WHERE ((NOT "assets"."is_deleted") AND ("assets"."status" = 'repair'::"public"."asset_status"))) AS "under_repair_assets",
    ( SELECT ("count"(*))::integer AS "count"
           FROM "public"."assets"
          WHERE ((NOT "assets"."is_deleted") AND ("assets"."status" = ANY (ARRAY['retired'::"public"."asset_status", 'disposed'::"public"."asset_status"])))) AS "retired_assets",
    ( SELECT ("count"(*))::integer AS "count"
           FROM ("public"."repairs" "r"
             JOIN "public"."assets" "a" ON (("a"."id" = "r"."asset_id")))
          WHERE (("r"."status" = ANY (ARRAY['pending'::"public"."repair_status", 'in_progress'::"public"."repair_status"])) AND (NOT "a"."is_deleted"))) AS "open_repair_tickets";


ALTER VIEW "public"."dashboard_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dashboard_warranty_expiring" AS
 SELECT "id" AS "asset_id",
    "asset_code",
    "asset_name",
    "warranty_expiry",
    ("warranty_expiry" - CURRENT_DATE) AS "days_until_expiry"
   FROM "public"."assets" "a"
  WHERE ((NOT "is_deleted") AND ("warranty_expiry" IS NOT NULL) AND ("warranty_expiry" > CURRENT_DATE) AND ("warranty_expiry" <= (CURRENT_DATE + '90 days'::interval)))
  ORDER BY "warranty_expiry";


ALTER VIEW "public"."dashboard_warranty_expiring" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "related_asset_id" "uuid",
    "related_employee_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text" DEFAULT ''::"text" NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."asset_disposals"
    ADD CONSTRAINT "asset_disposals_asset_id_key" UNIQUE ("asset_id");



ALTER TABLE ONLY "public"."asset_disposals"
    ADD CONSTRAINT "asset_disposals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."asset_images"
    ADD CONSTRAINT "asset_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_asset_code_key" UNIQUE ("asset_code");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_category_name_key" UNIQUE ("category_name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_employee_code_key" UNIQUE ("employee_code");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."repairs"
    ADD CONSTRAINT "repairs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activity_logs_entity" ON "public"."activity_logs" USING "btree" ("entity_type", "entity_id", "created_at" DESC);



CREATE INDEX "idx_asset_images_asset_sort" ON "public"."asset_images" USING "btree" ("asset_id", "sort_order");



CREATE INDEX "idx_assets_assigned_employee" ON "public"."assets" USING "btree" ("assigned_employee_id") WHERE (NOT "is_deleted");



CREATE INDEX "idx_assets_category_active" ON "public"."assets" USING "btree" ("category_id") WHERE (NOT "is_deleted");



CREATE INDEX "idx_assets_status_active" ON "public"."assets" USING "btree" ("status") WHERE (NOT "is_deleted");



CREATE INDEX "idx_assets_warranty_expiry" ON "public"."assets" USING "btree" ("warranty_expiry") WHERE ((NOT "is_deleted") AND ("warranty_expiry" IS NOT NULL));



CREATE INDEX "idx_assignments_asset_created" ON "public"."assignments" USING "btree" ("asset_id", "created_at" DESC);



CREATE INDEX "idx_assignments_employee_created" ON "public"."assignments" USING "btree" ("employee_id", "created_at" DESC);



CREATE INDEX "idx_categories_status" ON "public"."categories" USING "btree" ("status");



CREATE INDEX "idx_employees_status" ON "public"."employees" USING "btree" ("status");



CREATE INDEX "idx_notifications_user_inbox" ON "public"."notifications" USING "btree" ("user_id", "is_read", "created_at" DESC);



CREATE INDEX "idx_repairs_asset_status" ON "public"."repairs" USING "btree" ("asset_id", "status");



CREATE INDEX "idx_repairs_open" ON "public"."repairs" USING "btree" ("status") WHERE ("status" = ANY (ARRAY['pending'::"public"."repair_status", 'in_progress'::"public"."repair_status"]));



CREATE INDEX "idx_vendors_status" ON "public"."vendors" USING "btree" ("status");



CREATE UNIQUE INDEX "vendors_vendor_code_key" ON "public"."vendors" USING "btree" ("vendor_code");



CREATE OR REPLACE TRIGGER "trg_asset_images_updated" BEFORE UPDATE ON "public"."asset_images" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_assets_activity" AFTER INSERT OR UPDATE ON "public"."assets" FOR EACH ROW EXECUTE FUNCTION "public"."log_asset_activity"();



CREATE OR REPLACE TRIGGER "trg_assets_updated" BEFORE UPDATE ON "public"."assets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_assignments_updated" BEFORE UPDATE ON "public"."assignments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_categories_updated" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_employees_updated" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_repairs_updated" BEFORE UPDATE ON "public"."repairs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_vendors_updated" BEFORE UPDATE ON "public"."vendors" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."asset_disposals"
    ADD CONSTRAINT "asset_disposals_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."asset_images"
    ADD CONSTRAINT "asset_images_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_assigned_employee_id_fkey" FOREIGN KEY ("assigned_employee_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_asset_id_fkey" FOREIGN KEY ("related_asset_id") REFERENCES "public"."assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_employee_id_fkey" FOREIGN KEY ("related_employee_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."repairs"
    ADD CONSTRAINT "repairs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."repairs"
    ADD CONSTRAINT "repairs_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin/IT insert activity logs" ON "public"."activity_logs" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_or_it"("auth"."uid"()));



CREATE POLICY "Admin/IT manage asset disposals" ON "public"."asset_disposals" TO "authenticated" USING ("public"."is_admin_or_it"("auth"."uid"())) WITH CHECK ("public"."is_admin_or_it"("auth"."uid"()));



CREATE POLICY "Admin/IT manage asset images" ON "public"."asset_images" TO "authenticated" USING ("public"."is_admin_or_it"("auth"."uid"())) WITH CHECK ("public"."is_admin_or_it"("auth"."uid"()));



CREATE POLICY "Admin/IT manage assets" ON "public"."assets" TO "authenticated" USING ("public"."is_admin_or_it"("auth"."uid"())) WITH CHECK ("public"."is_admin_or_it"("auth"."uid"()));



CREATE POLICY "Admin/IT manage assignments" ON "public"."assignments" TO "authenticated" USING ("public"."is_admin_or_it"("auth"."uid"())) WITH CHECK ("public"."is_admin_or_it"("auth"."uid"()));



CREATE POLICY "Admin/IT manage categories" ON "public"."categories" TO "authenticated" USING ("public"."is_admin_or_it"("auth"."uid"())) WITH CHECK ("public"."is_admin_or_it"("auth"."uid"()));



CREATE POLICY "Admin/IT manage employees" ON "public"."employees" TO "authenticated" USING ("public"."is_admin_or_it"("auth"."uid"())) WITH CHECK ("public"."is_admin_or_it"("auth"."uid"()));



CREATE POLICY "Admin/IT manage repairs" ON "public"."repairs" TO "authenticated" USING ("public"."is_admin_or_it"("auth"."uid"())) WITH CHECK ("public"."is_admin_or_it"("auth"."uid"()));



CREATE POLICY "Admin/IT manage vendors" ON "public"."vendors" TO "authenticated" USING ("public"."is_admin_or_it"("auth"."uid"())) WITH CHECK ("public"."is_admin_or_it"("auth"."uid"()));



CREATE POLICY "Admin/IT read all employees" ON "public"."employees" FOR SELECT TO "authenticated" USING (("public"."is_admin_or_it"("auth"."uid"()) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Admins manage profiles" ON "public"."profiles" TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'administrator'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'administrator'::"public"."app_role"));



CREATE POLICY "Admins manage roles" ON "public"."user_roles" TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'administrator'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'administrator'::"public"."app_role"));



CREATE POLICY "All auth read categories" ON "public"."categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "All auth read vendors" ON "public"."vendors" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Read activity logs" ON "public"."activity_logs" FOR SELECT TO "authenticated" USING ("public"."is_admin_or_it"("auth"."uid"()));



CREATE POLICY "Read asset disposals" ON "public"."asset_disposals" FOR SELECT TO "authenticated" USING ("public"."is_admin_or_it"("auth"."uid"()));



CREATE POLICY "Read asset images" ON "public"."asset_images" FOR SELECT TO "authenticated" USING (("public"."is_admin_or_it"("auth"."uid"()) OR ("asset_id" IN ( SELECT "assets"."id"
   FROM "public"."assets"
  WHERE ("assets"."assigned_employee_id" IN ( SELECT "employees"."id"
           FROM "public"."employees"
          WHERE ("employees"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Read assets" ON "public"."assets" FOR SELECT TO "authenticated" USING (("public"."is_admin_or_it"("auth"."uid"()) OR ("assigned_employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())))));



CREATE POLICY "Read assignments" ON "public"."assignments" FOR SELECT TO "authenticated" USING (("public"."is_admin_or_it"("auth"."uid"()) OR ("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())))));



CREATE POLICY "Read repairs" ON "public"."repairs" FOR SELECT TO "authenticated" USING (("public"."is_admin_or_it"("auth"."uid"()) OR ("asset_id" IN ( SELECT "assets"."id"
   FROM "public"."assets"
  WHERE ("assets"."assigned_employee_id" IN ( SELECT "employees"."id"
           FROM "public"."employees"
          WHERE ("employees"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Users manage own notifications" ON "public"."notifications" TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin_or_it"("auth"."uid"()))) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin_or_it"("auth"."uid"())));



CREATE POLICY "Users read own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin_or_it"("auth"."uid"())));



CREATE POLICY "Users read own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_admin_or_it"("auth"."uid"())));



CREATE POLICY "Users read own role" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'administrator'::"public"."app_role")));



CREATE POLICY "Users update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."asset_disposals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."asset_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."repairs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendors" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin_or_it"("_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin_or_it"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_it"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_asset_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_asset_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_asset_activity"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."asset_code_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."asset_code_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."asset_code_seq" TO "service_role";



GRANT ALL ON TABLE "public"."asset_disposals" TO "anon";
GRANT ALL ON TABLE "public"."asset_disposals" TO "authenticated";
GRANT ALL ON TABLE "public"."asset_disposals" TO "service_role";



GRANT ALL ON TABLE "public"."asset_images" TO "anon";
GRANT ALL ON TABLE "public"."asset_images" TO "authenticated";
GRANT ALL ON TABLE "public"."asset_images" TO "service_role";



GRANT ALL ON TABLE "public"."assets" TO "anon";
GRANT ALL ON TABLE "public"."assets" TO "authenticated";
GRANT ALL ON TABLE "public"."assets" TO "service_role";



GRANT ALL ON TABLE "public"."assignments" TO "anon";
GRANT ALL ON TABLE "public"."assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."assignments" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_assets_by_category" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_assets_by_category" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_assets_by_category" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_assets_by_status" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_assets_by_status" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_assets_by_status" TO "service_role";



GRANT ALL ON TABLE "public"."repairs" TO "anon";
GRANT ALL ON TABLE "public"."repairs" TO "authenticated";
GRANT ALL ON TABLE "public"."repairs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vendor_code_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vendor_code_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vendor_code_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vendors" TO "anon";
GRANT ALL ON TABLE "public"."vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."vendors" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_open_repairs" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_open_repairs" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_open_repairs" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_recent_activity" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_recent_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_recent_activity" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_summary" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_summary" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_warranty_expiring" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_warranty_expiring" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_warranty_expiring" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







