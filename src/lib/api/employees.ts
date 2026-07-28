import { apiDelete, apiGet, apiPost, apiPut } from "./axios";
import { mapEmployee, mapEmployeeRow, type ApiEmployee } from "./mappers";
import type { Employee, EmployeeRow } from "@/lib/types/asset-management";

function toCreateBody(employee: Omit<Employee, "id">) {
  return {
    employeeId: employee.employee_code,
    name: employee.name,
    email: employee.email,
    phone: employee.phone ?? "",
    department: employee.department ?? "",
    designation: employee.designation ?? "",
    location: employee.location ?? "",
    status: employee.status ?? "active",
  };
}

function toUpdateBody(updates: Partial<Omit<Employee, "id">>) {
  return {
    employeeId: updates.employee_code,
    name: updates.name,
    email: updates.email,
    phone: updates.phone ?? undefined,
    department: updates.department ?? undefined,
    designation: updates.designation ?? undefined,
    location: updates.location ?? undefined,
    status: updates.status,
  };
}

export async function fetchEmployees(): Promise<Employee[]> {
  const rows = await apiGet<ApiEmployee[]>("/employees");
  return rows.map(mapEmployee);
}

export async function fetchEmployeeRows(): Promise<EmployeeRow[]> {
  const rows = await apiGet<ApiEmployee[]>("/employees");
  return rows.map(mapEmployeeRow);
}

export async function fetchEmployeeById(id: string): Promise<Employee> {
  const row = await apiGet<ApiEmployee>(`/employees/${id}`);
  return mapEmployee(row);
}

export async function createEmployee(employee: Omit<Employee, "id">): Promise<Employee> {
  const row = await apiPost<ApiEmployee>("/employees", toCreateBody(employee));
  return mapEmployee(row);
}

export async function updateEmployee(
  id: string,
  updates: Partial<Omit<Employee, "id">>,
): Promise<Employee> {
  const row = await apiPut<ApiEmployee>(`/employees/${id}`, toUpdateBody(updates));
  return mapEmployee(row);
}

export async function deleteEmployee(id: string): Promise<void> {
  await apiDelete(`/employees/${id}`);
}

export async function deactivateEmployee(id: string): Promise<void> {
  await apiPost(`/employees/${id}/deactivate`);
}
