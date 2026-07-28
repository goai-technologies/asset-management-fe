import { test, expect, type Page, type ConsoleMessage, type Response } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_IMAGE = path.join(__dirname, "fixtures", "test-image.png");
const API_BASE = "http://localhost:5001/api";
const TS = Date.now();

const results: { name: string; pass: boolean; detail?: string }[] = [];
const consoleErrors: string[] = [];
const networkErrors: string[] = [];

function record(name: string, pass: boolean, detail = "") {
  results.push({ name, pass, detail });
}

function attachMonitors(page: Page) {
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("response", (res: Response) => {
    const url = res.url();
    if (!url.includes("localhost:5001")) return;
    if (res.status() >= 400) {
      networkErrors.push(`${res.status()} ${res.request().method()} ${url}`);
    }
  });
}

async function openRowMenu(page: Page, rowText: string) {
  const row = page.getByRole("row").filter({ hasText: rowText }).first();
  await row.getByRole("button").last().click();
}

async function waitForManageAccess(page: Page) {
  await expect(page.getByText(/Signed in as/i)).toBeVisible({ timeout: 20_000 });
}

test("full application E2E", async ({ page }) => {
  attachMonitors(page);

  const health = await page.request.get(`${API_BASE}/health`);
  record("Backend health endpoint", health.ok(), String(health.status()));

  await page.goto("/auth");
  await expect(page.getByText("Sign in to your workspace")).toBeVisible({ timeout: 10_000 });
  record("Login page loads", true);

  const email = `e2e-${TS}@example.com`;
  const password = "E2eTest123!";

  await page.getByRole("tab", { name: "Sign up" }).click();
  await page.locator("#su-name").fill("E2E Tester");
  await page.locator("#su-email").fill(email);
  await page.locator("#su-pass").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText(/Account created/i)).toBeVisible({ timeout: 15_000 });
  record("User registration", true);

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 20_000 });
  record("Dashboard loads", true);

  const categoryName = `${TS} E2E Cat`;
  const vendorName = `${TS} E2E Vendor`;
  const employeeName = `${TS} E2E Employee`;
  const assetName = `${TS} E2E Asset`;

  // Categories CRUD
  await page.goto("/categories");
  await waitForManageAccess(page);
  await page.getByRole("button", { name: "Add Category" }).click();
  const catDialog = page.getByRole("dialog", { name: "Add Category" });
  await expect(catDialog).toBeVisible();
  await catDialog.locator("input").first().fill(categoryName);
  await catDialog.locator("textarea").fill("E2E category description");
  await catDialog.getByRole("button", { name: "Add Category" }).click();
  await expect(catDialog).not.toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("row").filter({ hasText: categoryName })).toBeVisible();
  record("Categories create", true);

  await openRowMenu(page, categoryName);
  await page.getByRole("menuitem", { name: "Edit" }).click();
  const updatedCategory = `${categoryName} Updated`;
  const editCatDialog = page.getByRole("dialog", { name: "Edit Category" });
  await editCatDialog.locator("input").first().fill(updatedCategory);
  await editCatDialog.getByRole("button", { name: "Save Changes" }).click();
  await expect(editCatDialog).not.toBeVisible({ timeout: 15_000 });
  record("Categories update", true);

  // Vendors CRUD
  await page.goto("/vendor-management");
  await waitForManageAccess(page);
  await page.getByRole("button", { name: "Add Vendor" }).click();
  const vendorDialog = page.getByRole("dialog", { name: "Add Vendor" });
  await expect(vendorDialog).toBeVisible();
  await vendorDialog.locator("input").first().fill(vendorName);
  await vendorDialog.getByText("Contact Person").locator("..").locator("input").fill("E2E Contact");
  await vendorDialog.getByText("Email Address").locator("..").locator("input").fill(`vendor-${TS}@example.com`);
  await vendorDialog.getByText("Phone Number").locator("..").locator("input").fill("9876543210");
  await vendorDialog.getByText("Office Address").locator("..").locator("textarea").fill("123 E2E Street");
  await vendorDialog.getByRole("button", { name: "Add Vendor" }).click();
  await expect(vendorDialog).not.toBeVisible({ timeout: 20_000 });
  record("Vendors create", true);

  await openRowMenu(page, vendorName);
  await page.getByRole("menuitem", { name: /Edit Vendor/i }).click();
  const updatedVendor = `${vendorName} Updated`;
  const editVendorDialog = page.getByRole("dialog", { name: "Edit Vendor" });
  await editVendorDialog.locator("input:not([disabled])").first().fill(updatedVendor);
  await editVendorDialog.getByRole("button", { name: "Save Changes" }).click();
  await expect(editVendorDialog).not.toBeVisible({ timeout: 15_000 });
  record("Vendors update", true);

  // Employees CRUD
  await page.goto("/employees");
  await waitForManageAccess(page);
  await page.getByRole("button", { name: "Add Employee" }).click();
  const empDialog = page.getByRole("dialog", { name: "Add Employee" });
  await expect(empDialog).toBeVisible();
  const empInputs = empDialog.locator("input");
  await empInputs.nth(0).fill(`E2E${TS}`);
  await empInputs.nth(1).fill(employeeName);
  await empInputs.nth(2).fill(`emp-${TS}@example.com`);
  await empInputs.nth(3).fill("9123456789");
  await empInputs.nth(4).fill("Engineering");
  await empInputs.nth(5).fill("Tester");
  await empInputs.nth(6).fill("Bangalore");
  await empDialog.getByRole("button", { name: "Add Employee" }).click();
  await expect(empDialog).not.toBeVisible({ timeout: 20_000 });
  record("Employees create", true);

  await openRowMenu(page, employeeName);
  await page.getByRole("menuitem", { name: /Edit Employee/i }).click();
  const updatedEmployee = `${employeeName} Updated`;
  const editEmpDialog = page.getByRole("dialog", { name: "Edit Employee" });
  await editEmpDialog.locator("input").nth(1).fill(updatedEmployee);
  await editEmpDialog.getByRole("button", { name: "Save Changes" }).click();
  await expect(editEmpDialog).not.toBeVisible({ timeout: 15_000 });
  record("Employees update", true);

  // Assets CRUD
  await page.goto("/assets");
  await waitForManageAccess(page);
  await page.getByRole("button", { name: "Add Asset" }).click();
  const assetDialog = page.getByRole("dialog", { name: "New Asset" });
  await expect(assetDialog).toBeVisible();
  await assetDialog.getByText("Asset Name").locator("..").locator("input").fill(assetName);
  await assetDialog.getByText("Brand").locator("..").locator("input").fill("E2EBrand");
  await assetDialog.getByText("Serial Number").locator("..").locator("input").fill(`SN-E2E-${TS}`);
  await assetDialog.getByText("Purchase Cost (INR)").locator("..").locator("input").fill("50000");
  await assetDialog.getByText("Invoice Number").locator("..").locator("input").fill(`INV-E2E-${TS}`);
  await assetDialog.getByText("Location").locator("..").locator("input").fill("Bangalore");

  const purchaseDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await assetDialog.locator('input[type="date"]').nth(0).fill(purchaseDate);
  await assetDialog.locator('input[type="date"]').nth(1).fill(nextYear);

  await assetDialog.getByText("Category").locator("..").getByRole("combobox").click();
  await page.getByRole("option", { name: updatedCategory }).click();

  await assetDialog.getByText("Vendor").locator("..").getByRole("combobox").click();
  await page.getByRole("option", { name: updatedVendor }).click();

  await assetDialog.locator('input[type="file"]').setInputFiles(TEST_IMAGE);
  await expect(assetDialog.getByText(/1 \/ \d+ images/)).toBeVisible({ timeout: 10_000 });

  await assetDialog.getByRole("button", { name: "Create asset" }).click();
  await expect(assetDialog).not.toBeVisible({ timeout: 30_000 });
  record("Assets create", true);

  await page.getByPlaceholder("Search code, name, serial, assigned to…").fill(assetName);
  await expect(page.getByText(assetName)).toBeVisible();
  record("Assets read/list", true);

  await openRowMenu(page, assetName);
  await page.getByRole("menuitem", { name: "Edit Asset" }).click();
  const updatedAssetName = `${assetName} Updated`;
  const editAssetDialog = page.getByRole("dialog", { name: "Edit Asset" });
  await editAssetDialog.getByText("Asset Name").locator("..").locator("input").fill(updatedAssetName);
  await editAssetDialog.getByRole("button", { name: "Save changes" }).click();
  await expect(editAssetDialog).not.toBeVisible({ timeout: 20_000 });
  record("Assets update", true);

  // Assignments
  await page.getByPlaceholder("Search code, name, serial, assigned to…").fill(updatedAssetName);
  await openRowMenu(page, updatedAssetName);
  await page.getByRole("menuitem", { name: "Assign Asset" }).click();
  const assignDialog = page.getByRole("dialog", { name: "Assign Asset" });
  await assignDialog.getByText("Assigned to").locator("..").getByRole("combobox").click();
  await page.getByRole("option", { name: new RegExp(updatedEmployee) }).click();
  await assignDialog.getByRole("button", { name: "Assign Asset" }).click();
  await expect(assignDialog).not.toBeVisible({ timeout: 20_000 });
  record("Assignments assign", true);

  await openRowMenu(page, updatedAssetName);
  await page.getByRole("menuitem", { name: "Unassign Asset" }).click();
  const unassignDialog = page.getByRole("dialog", { name: "Unassign Asset" });
  await unassignDialog.getByRole("combobox").click();
  await page.getByRole("option").first().click();
  await unassignDialog.getByRole("button", { name: "Confirm Unassign" }).click();
  await expect(unassignDialog).not.toBeVisible({ timeout: 20_000 });
  record("Assignments unassign", true);

  // Reports & exports
  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  record("Reports page loads", true);

  await page.getByRole("button", { name: "Export CSV" }).first().click();
  await expect(page.getByText(/exported/i)).toBeVisible({ timeout: 15_000 });
  record("Reports CSV export", true);

  const excelDownload = page.waitForEvent("download", { timeout: 30_000 });
  await page.getByRole("button", { name: "Export Excel" }).first().click();
  const excelFile = await excelDownload;
  record("Reports Excel export", /\.xlsx$/i.test(excelFile.suggestedFilename()), excelFile.suggestedFilename());

  const pdfDownload = page.waitForEvent("download", { timeout: 30_000 });
  await page.getByRole("button", { name: "Export PDF" }).first().click();
  const pdfFile = await pdfDownload;
  record("Reports PDF export", /\.pdf$/i.test(pdfFile.suggestedFilename()), pdfFile.suggestedFilename());

  // Delete disposable entities (no linked assets)
  const delCategory = `${TS} E2E Del Cat`;
  await page.goto("/categories");
  await waitForManageAccess(page);
  await page.getByRole("button", { name: "Add Category" }).click();
  const delCatDialog = page.getByRole("dialog", { name: "Add Category" });
  await delCatDialog.locator("input").first().fill(delCategory);
  await delCatDialog.getByRole("button", { name: "Add Category" }).click();
  await expect(delCatDialog).not.toBeVisible({ timeout: 15_000 });
  await openRowMenu(page, delCategory);
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete Category" }).click();
  await expect(page.getByText("Category deleted successfully")).toBeVisible();
  record("Categories delete", true);

  const delVendor = `${TS} E2E Del Vendor`;
  await page.goto("/vendor-management");
  await waitForManageAccess(page);
  await page.getByRole("button", { name: "Add Vendor" }).click();
  const delVendorDialog = page.getByRole("dialog", { name: "Add Vendor" });
  await delVendorDialog.locator("input").first().fill(delVendor);
  await delVendorDialog.getByText("Contact Person").locator("..").locator("input").fill("Delete Contact");
  await delVendorDialog.getByText("Email Address").locator("..").locator("input").fill(`del-vendor-${TS}@example.com`);
  await delVendorDialog.getByText("Phone Number").locator("..").locator("input").fill("9000000002");
  await delVendorDialog.getByText("Office Address").locator("..").locator("textarea").fill("Delete Street");
  await delVendorDialog.getByRole("button", { name: "Add Vendor" }).click();
  await expect(delVendorDialog).not.toBeVisible({ timeout: 20_000 });
  await openRowMenu(page, delVendor);
  await page.getByRole("menuitem", { name: /Delete Vendor/i }).click();
  await page.getByRole("button", { name: "Delete Vendor" }).click();
  await expect(page.getByText("Vendor deleted successfully")).toBeVisible();
  record("Vendors delete", true);

  const delEmployee = `${TS} E2E Del Emp`;
  await page.goto("/employees");
  await waitForManageAccess(page);
  await page.getByRole("button", { name: "Add Employee" }).click();
  const delEmpDialog = page.getByRole("dialog", { name: "Add Employee" });
  const delEmpInputs = delEmpDialog.locator("input");
  await delEmpInputs.nth(0).fill(`DEL${TS}`);
  await delEmpInputs.nth(1).fill(delEmployee);
  await delEmpInputs.nth(2).fill(`del-${TS}@example.com`);
  await delEmpInputs.nth(3).fill("9000000001");
  await delEmpInputs.nth(4).fill("QA");
  await delEmpInputs.nth(5).fill("Temp");
  await delEmpInputs.nth(6).fill("Remote");
  await delEmpDialog.getByRole("button", { name: "Add Employee" }).click();
  await expect(delEmpDialog).not.toBeVisible({ timeout: 20_000 });
  await openRowMenu(page, delEmployee);
  await page.getByRole("menuitem", { name: /Delete Employee/i }).click();
  await page.getByRole("button", { name: "Delete Employee" }).click();
  await expect(page.getByText("Employee deleted successfully")).toBeVisible();
  record("Employees delete", true);

  console.log("\n=== E2E RESULTS ===");
  console.log(JSON.stringify(results, null, 2));
  if (consoleErrors.length) console.log("Console errors:", [...new Set(consoleErrors)]);
  if (networkErrors.length) console.log("Network errors:", [...new Set(networkErrors)]);

  const failed = results.filter((r) => !r.pass);
  expect(failed, `Failed: ${failed.map((f) => f.name).join(", ")}`).toHaveLength(0);
  expect(networkErrors.filter((e) => !e.includes("404"))).toHaveLength(0);
});
