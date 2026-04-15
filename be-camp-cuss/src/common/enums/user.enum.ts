export enum Role {
  Customer = 'customer',
  Driver = 'driver',
  Admin = 'admin',
}

// Unified status enum for approval-like states
export enum ApprovalStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

// Type guards and helpers for capabilities
export const isAdmin = (role: Role) => role === Role.Admin;
export const isDriver = (role: Role) => role === Role.Driver;
export const isCustomer = (role: Role) => role === Role.Customer;

export const isApproved = (status: ApprovalStatus) =>
  status === ApprovalStatus.Approved;
export const isPending = (status: ApprovalStatus) =>
  status === ApprovalStatus.Pending;
export const isRejected = (status: ApprovalStatus) =>
  status === ApprovalStatus.Rejected;
