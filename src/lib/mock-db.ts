export type Category = { id: string; category_name: string };
export type Vendor = { id: string; vendor_name: string };
export type Employee = { id: string; name: string; email: string; department?: string; designation?: string; location?: string; };
export type Asset = {
  id: string;
  asset_code: string;
  asset_name: string;
  category_id: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  vendor_id: string | null;
  warranty_expiry: string | null;
  status: string;
  location: string | null;
  remarks: string | null;
  assigned_employee_id: string | null;
  created_at: string;
};
export type Assignment = {
  id: string;
  asset_id: string;
  employee_id: string;
  assigned_date: string;
  returned_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

// Joined types
export type AssetRow = Asset & {
  categories: Category | null;
  vendors: Vendor | null;
  employees: Employee | null;
};
export type AssignmentRow = Assignment & {
  assets: Asset | null;
  employees: Employee | null;
};

const DB_KEY = "eams_mock_db";

type DBSchema = {
  categories: Category[];
  vendors: Vendor[];
  employees: Employee[];
  assets: Asset[];
  assignments: Assignment[];
};

const DEFAULT_DB: DBSchema = {
  categories: [
    { id: "c1", category_name: "Laptops" },
    { id: "c2", category_name: "Monitors" },
    { id: "c3", category_name: "Phones" },
    { id: "c4", category_name: "Peripherals" },
  ],
  vendors: [
    { id: "v1", vendor_name: "Dell Technologies" },
    { id: "v2", vendor_name: "Apple Inc." },
    { id: "v3", vendor_name: "Amazon Business" },
  ],
  employees: [
    { id: "e1", name: "John Doe", email: "john@example.com", department: "Engineering", designation: "Developer", location: "New York" },
    { id: "e2", name: "Jane Smith", email: "jane@example.com", department: "Design", designation: "UI/UX Designer", location: "San Francisco" },
  ],
  assets: [
    {
      id: "a1", asset_code: "LT-2001", asset_name: "MacBook Pro M2", category_id: "c1", brand: "Apple", model: "14-inch 2023",
      serial_number: "C02G123456", purchase_date: "2023-01-15", purchase_cost: 1999, vendor_id: "v2", warranty_expiry: "2026-01-15",
      status: "assigned", location: "New York", remarks: "", assigned_employee_id: "e1", created_at: new Date().toISOString()
    },
    {
      id: "a2", asset_code: "MN-1002", asset_name: "Dell UltraSharp 27", category_id: "c2", brand: "Dell", model: "U2723QE",
      serial_number: "CN-0V00V0", purchase_date: "2022-11-20", purchase_cost: 600, vendor_id: "v1", warranty_expiry: "2025-11-20",
      status: "available", location: "HQ Storage", remarks: "", assigned_employee_id: null, created_at: new Date().toISOString()
    }
  ],
  assignments: [
    {
      id: "as1", asset_id: "a1", employee_id: "e1", assigned_date: "2023-02-01", returned_date: null,
      status: "assigned", notes: "Initial setup", created_at: new Date().toISOString()
    }
  ]
};

function getDb(): DBSchema {
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
    return DEFAULT_DB;
  }
  return JSON.parse(data);
}

function saveDb(db: DBSchema) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// Generate unique ID
export const genId = () => Math.random().toString(36).substring(2, 9);
export const genAssetCode = (cat: string) => `${cat.substring(0,2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

export const MockDB = {
  getCategories: () => getDb().categories,
  getVendors: () => getDb().vendors,
  getEmployees: () => getDb().employees,
  
  getAssets: (): AssetRow[] => {
    const db = getDb();
    return db.assets.map(a => ({
      ...a,
      categories: db.categories.find(c => c.id === a.category_id) || null,
      vendors: db.vendors.find(v => v.id === a.vendor_id) || null,
      employees: db.employees.find(e => e.id === a.assigned_employee_id) || null,
    }));
  },

  getRecentAssignments: (limit: number = 6): AssignmentRow[] => {
    const db = getDb();
    return [...db.assignments]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
      .map(as => ({
        ...as,
        assets: db.assets.find(a => a.id === as.asset_id) || null,
        employees: db.employees.find(e => e.id === as.employee_id) || null,
      }));
  },

  addAsset: (asset: Omit<Asset, "id" | "created_at" | "asset_code">) => {
    const db = getDb();
    const cat = db.categories.find(c => c.id === asset.category_id)?.category_name || "AS";
    const newAsset: Asset = {
      ...asset,
      id: genId(),
      asset_code: genAssetCode(cat),
      created_at: new Date().toISOString()
    };
    db.assets.push(newAsset);
    saveDb(db);
    return newAsset;
  },

  updateAsset: (id: string, updates: Partial<Asset>) => {
    const db = getDb();
    const idx = db.assets.findIndex(a => a.id === id);
    if (idx !== -1) {
      db.assets[idx] = { ...db.assets[idx], ...updates };
      saveDb(db);
    }
  },

  deleteAsset: (id: string) => {
    const db = getDb();
    db.assets = db.assets.filter(a => a.id !== id);
    // Also delete associated assignments
    db.assignments = db.assignments.filter(a => a.asset_id !== id);
    saveDb(db);
  },

  addEmployee: (employee: Omit<Employee, "id">) => {
    const db = getDb();
    const newEmp: Employee = { ...employee, id: genId() };
    db.employees.push(newEmp);
    saveDb(db);
    return newEmp;
  },

  assignAsset: (asset_id: string, employee_id: string, assigned_date: string, expected_return: string | null, notes: string | null) => {
    const db = getDb();
    // Update asset
    const asset = db.assets.find(a => a.id === asset_id);
    if (asset) {
      asset.status = "assigned";
      asset.assigned_employee_id = employee_id;
    }
    // Add assignment record
    db.assignments.push({
      id: genId(),
      asset_id,
      employee_id,
      assigned_date,
      returned_date: null,
      status: "assigned",
      notes,
      created_at: new Date().toISOString()
    });
    saveDb(db);
  },
  
  getDashboardStats: () => {
    const db = getDb();
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    
    db.assets.forEach(a => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      const catName = db.categories.find(c => c.id === a.category_id)?.category_name || "Uncategorized";
      byCategory[catName] = (byCategory[catName] || 0) + 1;
    });

    return {
      totalAssets: db.assets.length,
      totalEmployees: db.employees.length,
      byStatus,
      byCategory,
    };
  }
};
