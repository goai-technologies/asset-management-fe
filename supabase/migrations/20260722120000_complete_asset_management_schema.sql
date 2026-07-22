-- =============================================================================
-- goAI Asset Management — Complete Module Schema (APDM Phase 05)
-- Modules: Dashboard (views), Assets, Employees, Categories, Vendor Management
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.entity_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'asset', 'assignment', 'repair', 'warranty', 'employee', 'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extend existing enums (idempotent)
ALTER TYPE public.asset_status ADD VALUE IF NOT EXISTS 'inactive';

ALTER TYPE public.assignment_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE public.assignment_status ADD VALUE IF NOT EXISTS 'unassigned';
ALTER TYPE public.assignment_status ADD VALUE IF NOT EXISTS 'disposed';
ALTER TYPE public.assignment_status ADD VALUE IF NOT EXISTS 'inactive';

-- ---------------------------------------------------------------------------
-- SEQUENCES
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.vendor_code_seq START 1001;

-- ---------------------------------------------------------------------------
-- CATEGORIES (Module: Categories)
-- ---------------------------------------------------------------------------
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS status public.entity_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_categories_updated ON public.categories;
CREATE TRIGGER trg_categories_updated
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

UPDATE public.categories SET status = 'active' WHERE status IS NULL;

-- ---------------------------------------------------------------------------
-- VENDORS (Module: Vendor Management)
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS vendor_code TEXT,
  ADD COLUMN IF NOT EXISTS office_address TEXT,
  ADD COLUMN IF NOT EXISTS vendor_type TEXT,
  ADD COLUMN IF NOT EXISTS status public.entity_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS gst_number TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Backfill office_address from legacy address column
UPDATE public.vendors
SET office_address = COALESCE(office_address, address)
WHERE office_address IS NULL AND address IS NOT NULL;

-- Backfill vendor codes
UPDATE public.vendors v
SET vendor_code = 'VND-' || (1000 + sub.rn)::TEXT
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, vendor_name) AS rn
  FROM public.vendors
  WHERE vendor_code IS NULL
) sub
WHERE v.id = sub.id;

ALTER TABLE public.vendors
  ALTER COLUMN vendor_code SET DEFAULT ('VND-' || nextval('public.vendor_code_seq')::TEXT);

UPDATE public.vendors SET vendor_code = 'VND-' || nextval('public.vendor_code_seq')::TEXT
WHERE vendor_code IS NULL;

ALTER TABLE public.vendors
  ALTER COLUMN vendor_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS vendors_vendor_code_key ON public.vendors (vendor_code);

UPDATE public.vendors SET status = 'active' WHERE status IS NULL;

-- ---------------------------------------------------------------------------
-- EMPLOYEES (Module: Employees)
-- ---------------------------------------------------------------------------
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS status public.entity_status NOT NULL DEFAULT 'active';

UPDATE public.employees SET status = 'active' WHERE status IS NULL;

-- ---------------------------------------------------------------------------
-- ASSETS (Module: Assets)
-- ---------------------------------------------------------------------------
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS purchase_cost_inr NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Mirror legacy purchase_cost into INR when missing
UPDATE public.assets
SET purchase_cost_inr = purchase_cost
WHERE purchase_cost_inr IS NULL AND purchase_cost IS NOT NULL;

-- ---------------------------------------------------------------------------
-- ASSIGNMENTS (assignment / unassignment / disposal / deactivation history)
-- ---------------------------------------------------------------------------
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS performed_by TEXT;

ALTER TABLE public.assignments
  ALTER COLUMN employee_id DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- REPAIRS (repair history)
-- ---------------------------------------------------------------------------
ALTER TABLE public.repairs
  ADD COLUMN IF NOT EXISTS expected_return_date DATE,
  ADD COLUMN IF NOT EXISTS actual_return_date DATE,
  ADD COLUMN IF NOT EXISTS repair_notes TEXT,
  ADD COLUMN IF NOT EXISTS unassign_reason TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Backfill new repair columns from legacy fields
UPDATE public.repairs
SET
  repair_notes = COALESCE(repair_notes, notes),
  actual_return_date = COALESCE(actual_return_date, completed_date),
  completed_at = COALESCE(completed_at, completed_date::TIMESTAMPTZ)
WHERE repair_notes IS NULL OR actual_return_date IS NULL OR completed_at IS NULL;

ALTER TABLE public.repairs
  ALTER COLUMN issue DROP NOT NULL;

UPDATE public.repairs SET issue = COALESCE(issue, 'Repair') WHERE issue IS NULL;

ALTER TABLE public.repairs
  ALTER COLUMN issue SET NOT NULL;

-- ---------------------------------------------------------------------------
-- ASSET IMAGES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.asset_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_asset_images_updated ON public.asset_images;
CREATE TRIGGER trg_asset_images_updated
  BEFORE UPDATE ON public.asset_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ASSET DISPOSALS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.asset_disposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL UNIQUE REFERENCES public.assets(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  disposal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remarks TEXT,
  performed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  related_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- ACTIVITY LOGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  performed_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_assets_status_active
  ON public.assets (status) WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_assets_category_active
  ON public.assets (category_id) WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_assets_assigned_employee
  ON public.assets (assigned_employee_id) WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_assets_warranty_expiry
  ON public.assets (warranty_expiry) WHERE NOT is_deleted AND warranty_expiry IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assignments_asset_created
  ON public.assignments (asset_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assignments_employee_created
  ON public.assignments (employee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_repairs_asset_status
  ON public.repairs (asset_id, status);

CREATE INDEX IF NOT EXISTS idx_repairs_open
  ON public.repairs (status) WHERE status IN ('pending', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_notifications_user_inbox
  ON public.notifications (user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_entity
  ON public.activity_logs (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_asset_images_asset_sort
  ON public.asset_images (asset_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees (status);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors (status);
CREATE INDEX IF NOT EXISTS idx_categories_status ON public.categories (status);

-- ---------------------------------------------------------------------------
-- DASHBOARD VIEWS (Module: Dashboard — no persistent storage)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.dashboard_summary AS
SELECT
  (SELECT COUNT(*)::INTEGER FROM public.assets WHERE NOT is_deleted) AS total_assets,
  (SELECT COUNT(*)::INTEGER FROM public.employees WHERE status = 'active') AS total_employees,
  (SELECT COUNT(*)::INTEGER FROM public.assets WHERE NOT is_deleted AND status = 'assigned') AS assigned_assets,
  (SELECT COUNT(*)::INTEGER FROM public.assets WHERE NOT is_deleted AND status = 'available') AS available_assets,
  (SELECT COUNT(*)::INTEGER FROM public.assets WHERE NOT is_deleted AND status = 'repair') AS under_repair_assets,
  (SELECT COUNT(*)::INTEGER FROM public.assets WHERE NOT is_deleted AND status IN ('retired', 'disposed')) AS retired_assets,
  (SELECT COUNT(*)::INTEGER FROM public.repairs r
    JOIN public.assets a ON a.id = r.asset_id
    WHERE r.status IN ('pending', 'in_progress') AND NOT a.is_deleted) AS open_repair_tickets;

CREATE OR REPLACE VIEW public.dashboard_assets_by_category AS
SELECT
  COALESCE(c.category_name, 'Uncategorized') AS category_name,
  COUNT(a.id)::INTEGER AS asset_count
FROM public.assets a
LEFT JOIN public.categories c ON c.id = a.category_id
WHERE NOT a.is_deleted
GROUP BY COALESCE(c.category_name, 'Uncategorized')
ORDER BY asset_count DESC, category_name;

CREATE OR REPLACE VIEW public.dashboard_assets_by_status AS
SELECT
  a.status::TEXT AS status,
  COUNT(a.id)::INTEGER AS asset_count
FROM public.assets a
WHERE NOT a.is_deleted
GROUP BY a.status
ORDER BY asset_count DESC;

CREATE OR REPLACE VIEW public.dashboard_recent_activity AS
SELECT
  asg.id,
  asg.status::TEXT AS assignment_status,
  a.asset_name,
  a.asset_code,
  e.name AS employee_name,
  asg.assigned_date,
  asg.returned_date,
  asg.reason,
  asg.notes,
  asg.performed_by,
  asg.created_at
FROM public.assignments asg
JOIN public.assets a ON a.id = asg.asset_id
LEFT JOIN public.employees e ON e.id = asg.employee_id
WHERE NOT a.is_deleted
ORDER BY asg.created_at DESC;

CREATE OR REPLACE VIEW public.dashboard_warranty_expiring AS
SELECT
  a.id AS asset_id,
  a.asset_code,
  a.asset_name,
  a.warranty_expiry,
  (a.warranty_expiry - CURRENT_DATE)::INTEGER AS days_until_expiry
FROM public.assets a
WHERE NOT a.is_deleted
  AND a.warranty_expiry IS NOT NULL
  AND a.warranty_expiry > CURRENT_DATE
  AND a.warranty_expiry <= CURRENT_DATE + INTERVAL '90 days'
ORDER BY a.warranty_expiry ASC;

CREATE OR REPLACE VIEW public.dashboard_open_repairs AS
SELECT
  r.id AS repair_id,
  r.status::TEXT AS repair_status,
  r.repair_date,
  r.expected_return_date,
  r.repair_cost,
  a.id AS asset_id,
  a.asset_code,
  a.asset_name,
  v.vendor_name
FROM public.repairs r
JOIN public.assets a ON a.id = r.asset_id
LEFT JOIN public.vendors v ON v.id = r.vendor_id
WHERE r.status IN ('pending', 'in_progress')
  AND NOT a.is_deleted
ORDER BY r.created_at DESC;

-- ---------------------------------------------------------------------------
-- ACTIVITY LOG TRIGGER (auto-audit on key mutations)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_asset_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

DROP TRIGGER IF EXISTS trg_assets_activity ON public.assets;
CREATE TRIGGER trg_assets_activity
  AFTER INSERT OR UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.log_asset_activity();

-- ---------------------------------------------------------------------------
-- GRANTS
-- ---------------------------------------------------------------------------
GRANT USAGE ON SEQUENCE public.vendor_code_seq TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_images TO authenticated;
GRANT ALL ON public.asset_images TO service_role;

GRANT SELECT, INSERT ON public.asset_disposals TO authenticated;
GRANT ALL ON public.asset_disposals TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;

GRANT SELECT ON public.dashboard_summary TO authenticated;
GRANT SELECT ON public.dashboard_assets_by_category TO authenticated;
GRANT SELECT ON public.dashboard_assets_by_status TO authenticated;
GRANT SELECT ON public.dashboard_recent_activity TO authenticated;
GRANT SELECT ON public.dashboard_warranty_expiring TO authenticated;
GRANT SELECT ON public.dashboard_open_repairs TO authenticated;

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE public.asset_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_disposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Asset images
DROP POLICY IF EXISTS "Read asset images" ON public.asset_images;
CREATE POLICY "Read asset images" ON public.asset_images FOR SELECT TO authenticated
  USING (
    public.is_admin_or_it(auth.uid())
    OR asset_id IN (
      SELECT id FROM public.assets
      WHERE assigned_employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admin/IT manage asset images" ON public.asset_images;
CREATE POLICY "Admin/IT manage asset images" ON public.asset_images FOR ALL TO authenticated
  USING (public.is_admin_or_it(auth.uid()))
  WITH CHECK (public.is_admin_or_it(auth.uid()));

-- Asset disposals
DROP POLICY IF EXISTS "Read asset disposals" ON public.asset_disposals;
CREATE POLICY "Read asset disposals" ON public.asset_disposals FOR SELECT TO authenticated
  USING (public.is_admin_or_it(auth.uid()));

DROP POLICY IF EXISTS "Admin/IT manage asset disposals" ON public.asset_disposals;
CREATE POLICY "Admin/IT manage asset disposals" ON public.asset_disposals FOR ALL TO authenticated
  USING (public.is_admin_or_it(auth.uid()))
  WITH CHECK (public.is_admin_or_it(auth.uid()));

-- Notifications
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_or_it(auth.uid()));

DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_or_it(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin_or_it(auth.uid()));

-- Activity logs
DROP POLICY IF EXISTS "Read activity logs" ON public.activity_logs;
CREATE POLICY "Read activity logs" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.is_admin_or_it(auth.uid()));

DROP POLICY IF EXISTS "Admin/IT insert activity logs" ON public.activity_logs;
CREATE POLICY "Admin/IT insert activity logs" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_it(auth.uid()));
