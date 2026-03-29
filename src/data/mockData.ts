// ===== VEHICLES =====
export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Out of Service";
export type VehicleType = "Truck" | "Van" | "Trailer" | "Tanker";

export interface Vehicle {
  id: string;
  name: string;
  model: string;
  licensePlate: string;
  type: VehicleType;
  maxCapacity: number;
  odometer: number;
  status: VehicleStatus;
  region: string;
  fuelType: string;
  year: number;
  acquisitionCost: number;
}

export const vehicles: Vehicle[] = [
  { id: "V001", name: "Hauler Alpha", model: "Volvo FH16", licensePlate: "FL-1024-AX", type: "Truck", maxCapacity: 25000, odometer: 142350, status: "Available", region: "North", fuelType: "Diesel", year: 2021, acquisitionCost: 120000 },
  { id: "V002", name: "Swift Runner", model: "Mercedes Actros", licensePlate: "FL-2048-BR", type: "Truck", maxCapacity: 22000, odometer: 98200, status: "On Trip", region: "South", fuelType: "Diesel", year: 2022, acquisitionCost: 135000 },
  { id: "V003", name: "City Express", model: "Ford Transit", licensePlate: "FL-3012-CX", type: "Van", maxCapacity: 3500, odometer: 67800, status: "Available", region: "East", fuelType: "Diesel", year: 2023, acquisitionCost: 42000 },
  { id: "V004", name: "Titan Mover", model: "Scania R500", licensePlate: "FL-4096-DT", type: "Truck", maxCapacity: 28000, odometer: 210500, status: "In Shop", region: "West", fuelType: "Diesel", year: 2020, acquisitionCost: 145000 },
  { id: "V005", name: "Road King", model: "MAN TGX", licensePlate: "FL-5020-EK", type: "Truck", maxCapacity: 24000, odometer: 178300, status: "On Trip", region: "North", fuelType: "Diesel", year: 2021, acquisitionCost: 128000 },
  { id: "V006", name: "Cargo Star", model: "DAF XF", licensePlate: "FL-6034-FS", type: "Truck", maxCapacity: 26000, odometer: 55000, status: "Available", region: "South", fuelType: "Diesel", year: 2023, acquisitionCost: 132000 },
  { id: "V007", name: "Tank Unit 1", model: "Iveco S-Way", licensePlate: "FL-7011-GT", type: "Tanker", maxCapacity: 30000, odometer: 89400, status: "Out of Service", region: "East", fuelType: "Diesel", year: 2019, acquisitionCost: 160000 },
  { id: "V008", name: "Quick Delivery", model: "Renault Master", licensePlate: "FL-8022-HQ", type: "Van", maxCapacity: 4000, odometer: 34200, status: "Available", region: "West", fuelType: "Diesel", year: 2024, acquisitionCost: 45000 },
  { id: "V009", name: "Flatbed Pro", model: "Volvo FM", licensePlate: "FL-9045-JM", type: "Trailer", maxCapacity: 20000, odometer: 123000, status: "On Trip", region: "North", fuelType: "Diesel", year: 2022, acquisitionCost: 95000 },
  { id: "V010", name: "Metro Van", model: "Mercedes Sprinter", licensePlate: "FL-1050-KL", type: "Van", maxCapacity: 3000, odometer: 45600, status: "Available", region: "South", fuelType: "Electric", year: 2024, acquisitionCost: 55000 },
];

// ===== DRIVERS =====
export type DriverStatus = "On Duty" | "Off Duty" | "On Trip" | "Suspended";

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseCategory: string;
  status: DriverStatus;
  phone: string;
  safetyScore: number;
  totalTrips: number;
  totalKm: number;
  avatar?: string;
}

export const drivers: Driver[] = [
  { id: "D001", name: "Marcus Johnson", licenseNumber: "DL-89234", licenseExpiry: "2026-08-15", licenseCategory: "CE", status: "On Duty", phone: "+1-555-0101", safetyScore: 94, totalTrips: 342, totalKm: 128400 },
  { id: "D002", name: "Elena Rodriguez", licenseNumber: "DL-67812", licenseExpiry: "2025-03-22", licenseCategory: "CE", status: "On Trip", phone: "+1-555-0102", safetyScore: 98, totalTrips: 289, totalKm: 105200 },
  { id: "D003", name: "James Chen", licenseNumber: "DL-45690", licenseExpiry: "2027-01-10", licenseCategory: "C", status: "On Duty", phone: "+1-555-0103", safetyScore: 87, totalTrips: 156, totalKm: 67800 },
  { id: "D004", name: "Sarah Williams", licenseNumber: "DL-23456", licenseExpiry: "2024-11-30", licenseCategory: "CE", status: "Suspended", phone: "+1-555-0104", safetyScore: 72, totalTrips: 421, totalKm: 198000 },
  { id: "D005", name: "Omar Hassan", licenseNumber: "DL-78901", licenseExpiry: "2026-06-18", licenseCategory: "CE", status: "On Trip", phone: "+1-555-0105", safetyScore: 91, totalTrips: 267, totalKm: 112300 },
  { id: "D006", name: "Ana Kowalski", licenseNumber: "DL-34567", licenseExpiry: "2026-12-05", licenseCategory: "C", status: "Off Duty", phone: "+1-555-0106", safetyScore: 95, totalTrips: 198, totalKm: 78900 },
  { id: "D007", name: "David Park", licenseNumber: "DL-56789", licenseExpiry: "2025-09-28", licenseCategory: "CE", status: "On Trip", phone: "+1-555-0107", safetyScore: 89, totalTrips: 310, totalKm: 145600 },
  { id: "D008", name: "Lisa Thompson", licenseNumber: "DL-12345", licenseExpiry: "2027-04-14", licenseCategory: "B", status: "On Duty", phone: "+1-555-0108", safetyScore: 96, totalTrips: 134, totalKm: 45200 },
];

// ===== TRIPS =====
export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  origin: string;
  destination: string;
  cargoWeight: number;
  cargoDescription: string;
  status: TripStatus;
  createdAt: string;
  dispatchedAt?: string;
  completedAt?: string;
  distance: number;
  estimatedDuration: string;
}

export const trips: Trip[] = [
  { id: "T001", vehicleId: "V002", driverId: "D002", origin: "Houston, TX", destination: "Dallas, TX", cargoWeight: 18000, cargoDescription: "Industrial Equipment", status: "Dispatched", createdAt: "2026-02-20", dispatchedAt: "2026-02-20", distance: 385, estimatedDuration: "5h 30m" },
  { id: "T002", vehicleId: "V005", driverId: "D005", origin: "Chicago, IL", destination: "Detroit, MI", cargoWeight: 21000, cargoDescription: "Auto Parts", status: "Dispatched", createdAt: "2026-02-19", dispatchedAt: "2026-02-19", distance: 450, estimatedDuration: "6h 15m" },
  { id: "T003", vehicleId: "V009", driverId: "D007", origin: "Los Angeles, CA", destination: "Phoenix, AZ", cargoWeight: 15000, cargoDescription: "Consumer Electronics", status: "Dispatched", createdAt: "2026-02-18", dispatchedAt: "2026-02-18", distance: 600, estimatedDuration: "8h" },
  { id: "T004", vehicleId: "V001", driverId: "D001", origin: "Miami, FL", destination: "Atlanta, GA", cargoWeight: 22000, cargoDescription: "Construction Materials", status: "Completed", createdAt: "2026-02-15", dispatchedAt: "2026-02-15", completedAt: "2026-02-16", distance: 1060, estimatedDuration: "14h" },
  { id: "T005", vehicleId: "V003", driverId: "D003", origin: "Seattle, WA", destination: "Portland, OR", cargoWeight: 2800, cargoDescription: "Medical Supplies", status: "Completed", createdAt: "2026-02-14", dispatchedAt: "2026-02-14", completedAt: "2026-02-14", distance: 280, estimatedDuration: "3h 45m" },
  { id: "T006", vehicleId: "V006", driverId: "D006", origin: "Denver, CO", destination: "Salt Lake City, UT", cargoWeight: 19500, cargoDescription: "Food Products", status: "Draft", createdAt: "2026-02-21", distance: 820, estimatedDuration: "11h" },
  { id: "T007", vehicleId: "V008", driverId: "D008", origin: "Boston, MA", destination: "New York, NY", cargoWeight: 3200, cargoDescription: "Pharmaceuticals", status: "Draft", createdAt: "2026-02-21", distance: 340, estimatedDuration: "4h 30m" },
  { id: "T008", vehicleId: "V001", driverId: "D001", origin: "Nashville, TN", destination: "Memphis, TN", cargoWeight: 20000, cargoDescription: "Machinery", status: "Cancelled", createdAt: "2026-02-12", distance: 340, estimatedDuration: "4h" },
];

// ===== MAINTENANCE =====
export type MaintenanceType = "Preventive" | "Repair" | "Inspection" | "Tire Service" | "Engine";

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description: string;
  date: string;
  cost: number;
  status: "Completed" | "In Progress" | "Scheduled";
  technician: string;
}

export const maintenanceLogs: MaintenanceLog[] = [
  { id: "M001", vehicleId: "V004", type: "Engine", description: "Engine overhaul - turbo replacement", date: "2026-02-20", cost: 4500, status: "In Progress", technician: "Mike Reynolds" },
  { id: "M002", vehicleId: "V001", type: "Preventive", description: "Oil change and filter replacement", date: "2026-02-18", cost: 350, status: "Completed", technician: "Sarah Kim" },
  { id: "M003", vehicleId: "V002", type: "Tire Service", description: "Full tire rotation and alignment", date: "2026-02-15", cost: 800, status: "Completed", technician: "John Davis" },
  { id: "M004", vehicleId: "V007", type: "Repair", description: "Hydraulic system failure - pump replacement", date: "2026-02-10", cost: 6200, status: "Completed", technician: "Mike Reynolds" },
  { id: "M005", vehicleId: "V005", type: "Inspection", description: "Annual DOT inspection", date: "2026-02-08", cost: 200, status: "Completed", technician: "Sarah Kim" },
  { id: "M006", vehicleId: "V003", type: "Preventive", description: "Brake pad replacement", date: "2026-02-22", cost: 450, status: "Scheduled", technician: "John Davis" },
];

// ===== FUEL LOGS =====
export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  cost: number;
  odometer: number;
  station: string;
}

export const fuelLogs: FuelLog[] = [
  { id: "F001", vehicleId: "V001", date: "2026-02-19", liters: 320, cost: 480, odometer: 142200, station: "Shell Highway 45" },
  { id: "F002", vehicleId: "V002", date: "2026-02-18", liters: 280, cost: 420, odometer: 98100, station: "BP Truck Stop" },
  { id: "F003", vehicleId: "V005", date: "2026-02-17", liters: 350, cost: 525, odometer: 178100, station: "Total Energies" },
  { id: "F004", vehicleId: "V003", date: "2026-02-16", liters: 65, cost: 97.5, odometer: 67700, station: "Chevron City" },
  { id: "F005", vehicleId: "V009", date: "2026-02-15", liters: 290, cost: 435, odometer: 122800, station: "Shell Interstate" },
  { id: "F006", vehicleId: "V006", date: "2026-02-14", liters: 310, cost: 465, odometer: 54800, station: "BP South" },
];

// ===== EXPENSES =====
export interface Expense {
  id: string;
  vehicleId: string;
  category: "Fuel" | "Maintenance" | "Insurance" | "Toll" | "Other";
  amount: number;
  date: string;
  description: string;
}

export const expenses: Expense[] = [
  { id: "E001", vehicleId: "V001", category: "Fuel", amount: 480, date: "2026-02-19", description: "Regular fuel fill" },
  { id: "E002", vehicleId: "V004", category: "Maintenance", amount: 4500, date: "2026-02-20", description: "Engine overhaul" },
  { id: "E003", vehicleId: "V002", category: "Toll", amount: 85, date: "2026-02-18", description: "Interstate tolls" },
  { id: "E004", vehicleId: "V001", category: "Insurance", amount: 1200, date: "2026-02-01", description: "Monthly premium" },
  { id: "E005", vehicleId: "V003", category: "Fuel", amount: 97.5, date: "2026-02-16", description: "City delivery fuel" },
  { id: "E006", vehicleId: "V005", category: "Fuel", amount: 525, date: "2026-02-17", description: "Long haul fuel" },
  { id: "E007", vehicleId: "V007", category: "Maintenance", amount: 6200, date: "2026-02-10", description: "Hydraulic repair" },
  { id: "E008", vehicleId: "V006", category: "Insurance", amount: 1100, date: "2026-02-01", description: "Monthly premium" },
];

// ===== ANALYTICS HELPERS =====
export const getVehicleById = (id: string) => vehicles.find(v => v.id === id);
export const getDriverById = (id: string) => drivers.find(d => d.id === id);

export const dashboardKPIs = {
  activeFleet: vehicles.filter(v => v.status === "On Trip").length,
  availableVehicles: vehicles.filter(v => v.status === "Available").length,
  maintenanceAlerts: vehicles.filter(v => v.status === "In Shop").length,
  totalVehicles: vehicles.length,
  utilizationRate: Math.round((vehicles.filter(v => v.status === "On Trip").length / vehicles.length) * 100),
  pendingCargo: trips.filter(t => t.status === "Draft").length,
  activeDrivers: drivers.filter(d => d.status === "On Duty" || d.status === "On Trip").length,
  totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
};

export const monthlyFuelData = [
  { month: "Sep", cost: 8200, liters: 5400 },
  { month: "Oct", cost: 9100, liters: 6000 },
  { month: "Nov", cost: 7800, liters: 5100 },
  { month: "Dec", cost: 10200, liters: 6700 },
  { month: "Jan", cost: 8900, liters: 5800 },
  { month: "Feb", cost: 7400, liters: 4900 },
];

export const tripsByStatus = [
  { name: "Completed", value: trips.filter(t => t.status === "Completed").length },
  { name: "Dispatched", value: trips.filter(t => t.status === "Dispatched").length },
  { name: "Draft", value: trips.filter(t => t.status === "Draft").length },
  { name: "Cancelled", value: trips.filter(t => t.status === "Cancelled").length },
];
