
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('administrator', 'it_team', 'employee');
CREATE TYPE public.asset_status AS ENUM ('available','assigned','reserved','repair','lost','disposed','retired');
CREATE TYPE public.assignment_status AS ENUM ('active','returned','overdue');
CREATE TYPE public.repair_status AS ENUM ('pending','in_progress','completed','cancelled');

-- ============ HELPER ============
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.is_admin_or_it(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('administrator','it_team')) $$;

-- Profile RLS
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin_or_it(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'administrator')) WITH CHECK (public.has_role(auth.uid(),'administrator'));

-- Roles RLS
CREATE POLICY "Users read own role" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'administrator'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'administrator')) WITH CHECK (public.has_role(auth.uid(),'administrator'));

-- Auto-profile + first-user-is-admin trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All auth read categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/IT manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.is_admin_or_it(auth.uid())) WITH CHECK (public.is_admin_or_it(auth.uid()));

-- ============ VENDORS ============
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_vendors_updated BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "All auth read vendors" ON public.vendors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/IT manage vendors" ON public.vendors FOR ALL TO authenticated
  USING (public.is_admin_or_it(auth.uid())) WITH CHECK (public.is_admin_or_it(auth.uid()));

-- ============ EMPLOYEES ============
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department TEXT,
  designation TEXT,
  manager TEXT,
  location TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Admin/IT read all employees" ON public.employees FOR SELECT TO authenticated
  USING (public.is_admin_or_it(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Admin/IT manage employees" ON public.employees FOR ALL TO authenticated
  USING (public.is_admin_or_it(auth.uid())) WITH CHECK (public.is_admin_or_it(auth.uid()));

-- ============ ASSETS ============
CREATE SEQUENCE public.asset_code_seq START 1001;

CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code TEXT NOT NULL UNIQUE DEFAULT ('AST-' || nextval('public.asset_code_seq')),
  asset_name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_cost NUMERIC(12,2),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  invoice_number TEXT,
  warranty_start DATE,
  warranty_expiry DATE,
  status public.asset_status NOT NULL DEFAULT 'available',
  assigned_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  location TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT USAGE ON SEQUENCE public.asset_code_seq TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT ALL ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_assets_updated BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Read assets" ON public.assets FOR SELECT TO authenticated
  USING (
    public.is_admin_or_it(auth.uid())
    OR assigned_employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  );
CREATE POLICY "Admin/IT manage assets" ON public.assets FOR ALL TO authenticated
  USING (public.is_admin_or_it(auth.uid())) WITH CHECK (public.is_admin_or_it(auth.uid()));

-- ============ ASSIGNMENTS ============
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date DATE,
  returned_date DATE,
  status public.assignment_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_assignments_updated BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Read assignments" ON public.assignments FOR SELECT TO authenticated
  USING (
    public.is_admin_or_it(auth.uid())
    OR employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  );
CREATE POLICY "Admin/IT manage assignments" ON public.assignments FOR ALL TO authenticated
  USING (public.is_admin_or_it(auth.uid())) WITH CHECK (public.is_admin_or_it(auth.uid()));

-- ============ REPAIRS ============
CREATE TABLE public.repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  issue TEXT NOT NULL,
  repair_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_date DATE,
  repair_cost NUMERIC(12,2),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  status public.repair_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repairs TO authenticated;
GRANT ALL ON public.repairs TO service_role;
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_repairs_updated BEFORE UPDATE ON public.repairs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Read repairs" ON public.repairs FOR SELECT TO authenticated
  USING (
    public.is_admin_or_it(auth.uid())
    OR asset_id IN (SELECT id FROM public.assets WHERE assigned_employee_id IN
      (SELECT id FROM public.employees WHERE user_id = auth.uid()))
  );
CREATE POLICY "Admin/IT manage repairs" ON public.repairs FOR ALL TO authenticated
  USING (public.is_admin_or_it(auth.uid())) WITH CHECK (public.is_admin_or_it(auth.uid()));

-- ============ SEED DATA ============
INSERT INTO public.categories (category_name) VALUES
  ('Laptop'),('Desktop'),('Monitor'),('Keyboard'),('Mouse'),
  ('Docking Station'),('Mobile'),('Tablet'),('Printer'),('Furniture'),('Other');

INSERT INTO public.vendors (vendor_name, contact_person, email, phone, address) VALUES
  ('Dell Technologies','Alice Kim','alice@dell.example','+1-555-0101','Round Rock, TX'),
  ('Apple Inc.','Ravi Patel','ravi@apple.example','+1-555-0102','Cupertino, CA'),
  ('Logitech','Sara Lee','sara@logitech.example','+1-555-0103','Newark, CA'),
  ('OfficeMax Furniture','Tom Chen','tom@officemax.example','+1-555-0104','Naperville, IL');

INSERT INTO public.employees (employee_code, name, email, department, designation, manager, location) VALUES
  ('EMP-001','John Doe','john.doe@company.com','Engineering','Senior Engineer','Priya Shah','HQ - Floor 3'),
  ('EMP-002','Emma Wilson','emma.wilson@company.com','Design','Product Designer','Marcus Reed','HQ - Floor 2'),
  ('EMP-003','Liam Brown','liam.brown@company.com','Sales','Account Executive','Nina Torres','Remote'),
  ('EMP-004','Olivia Davis','olivia.davis@company.com','Engineering','Engineering Manager','Priya Shah','HQ - Floor 3'),
  ('EMP-005','Noah Martinez','noah.martinez@company.com','Operations','Operations Lead','CEO','HQ - Floor 1');

WITH c AS (SELECT id, category_name FROM public.categories),
     v AS (SELECT id, vendor_name FROM public.vendors),
     e AS (SELECT id, employee_code FROM public.employees)
INSERT INTO public.assets (asset_name, category_id, brand, model, serial_number, purchase_date, purchase_cost, vendor_id, warranty_start, warranty_expiry, status, assigned_employee_id, location, remarks)
VALUES
  ('MacBook Pro 14"', (SELECT id FROM c WHERE category_name='Laptop'), 'Apple','MBP14 M3','C02XL0AAJG5H','2024-01-15',2499.00,(SELECT id FROM v WHERE vendor_name='Apple Inc.'),'2024-01-15','2027-01-15','assigned',(SELECT id FROM e WHERE employee_code='EMP-001'),'HQ - Floor 3','Primary dev machine'),
  ('Dell XPS 15', (SELECT id FROM c WHERE category_name='Laptop'), 'Dell','XPS 15 9530','5CG3140XYZ','2023-08-22',1899.00,(SELECT id FROM v WHERE vendor_name='Dell Technologies'),'2023-08-22','2026-08-22','assigned',(SELECT id FROM e WHERE employee_code='EMP-004'),'HQ - Floor 3',NULL),
  ('Dell UltraSharp 27"', (SELECT id FROM c WHERE category_name='Monitor'), 'Dell','U2723QE','CN0ABC123','2024-02-10',649.00,(SELECT id FROM v WHERE vendor_name='Dell Technologies'),'2024-02-10','2027-02-10','assigned',(SELECT id FROM e WHERE employee_code='EMP-001'),'HQ - Floor 3',NULL),
  ('Logitech MX Master 3S', (SELECT id FROM c WHERE category_name='Mouse'), 'Logitech','MX Master 3S','LG2024XYZ01','2024-03-05',99.00,(SELECT id FROM v WHERE vendor_name='Logitech'),'2024-03-05','2026-03-05','available',NULL,'Storage Room A',NULL),
  ('Logitech MX Keys', (SELECT id FROM c WHERE category_name='Keyboard'), 'Logitech','MX Keys','LG2024KB009','2024-03-05',119.00,(SELECT id FROM v WHERE vendor_name='Logitech'),'2024-03-05','2026-03-05','assigned',(SELECT id FROM e WHERE employee_code='EMP-002'),'HQ - Floor 2',NULL),
  ('iPhone 15 Pro', (SELECT id FROM c WHERE category_name='Mobile'), 'Apple','iPhone 15 Pro','F2LX7HYNPL','2024-04-12',999.00,(SELECT id FROM v WHERE vendor_name='Apple Inc.'),'2024-04-12','2025-04-12','assigned',(SELECT id FROM e WHERE employee_code='EMP-003'),'Remote','Company phone'),
  ('iPad Pro 12.9"', (SELECT id FROM c WHERE category_name='Tablet'), 'Apple','iPad Pro M2','DMPXKQ00P123','2023-11-30',1099.00,(SELECT id FROM v WHERE vendor_name='Apple Inc.'),'2023-11-30','2024-11-30','repair',NULL,'IT Workshop','Screen cracked'),
  ('HP LaserJet Pro', (SELECT id FROM c WHERE category_name='Printer'), 'HP','M404dn','VNC3K12345','2022-06-01',329.00,NULL,'2022-06-01','2024-06-01','available',NULL,'HQ - Floor 1',NULL),
  ('Herman Miller Aeron', (SELECT id FROM c WHERE category_name='Furniture'), 'Herman Miller','Aeron Size B','HM-2023-0456','2023-01-10',1395.00,(SELECT id FROM v WHERE vendor_name='OfficeMax Furniture'),NULL,NULL,'assigned',(SELECT id FROM e WHERE employee_code='EMP-004'),'HQ - Floor 3',NULL),
  ('Dell WD19 Dock', (SELECT id FROM c WHERE category_name='Docking Station'), 'Dell','WD19','DL-DOCK-0912','2024-01-15',249.00,(SELECT id FROM v WHERE vendor_name='Dell Technologies'),'2024-01-15','2026-01-15','assigned',(SELECT id FROM e WHERE employee_code='EMP-001'),'HQ - Floor 3',NULL),
  ('MacBook Air 13"', (SELECT id FROM c WHERE category_name='Laptop'), 'Apple','MBA13 M2','C02YZ111ABC','2022-09-15',1199.00,(SELECT id FROM v WHERE vendor_name='Apple Inc.'),'2022-09-15','2024-09-15','retired',NULL,'Storage Room B','End of life'),
  ('Dell OptiPlex 7010', (SELECT id FROM c WHERE category_name='Desktop'), 'Dell','OptiPlex 7010','5DP7010OFC','2023-05-20',799.00,(SELECT id FROM v WHERE vendor_name='Dell Technologies'),'2023-05-20','2026-05-20','assigned',(SELECT id FROM e WHERE employee_code='EMP-005'),'HQ - Floor 1',NULL);

-- Assignment history rows for assigned assets
INSERT INTO public.assignments (asset_id, employee_id, assigned_date, status)
SELECT a.id, a.assigned_employee_id, COALESCE(a.purchase_date, CURRENT_DATE - 30), 'active'
FROM public.assets a WHERE a.assigned_employee_id IS NOT NULL;

-- Sample repair record
INSERT INTO public.repairs (asset_id, issue, repair_date, repair_cost, vendor_id, status, notes)
SELECT id, 'Cracked screen replacement', CURRENT_DATE - 5, 189.00,
  (SELECT id FROM public.vendors WHERE vendor_name='Apple Inc.'), 'in_progress', 'Awaiting parts'
FROM public.assets WHERE serial_number='DMPXKQ00P123';
