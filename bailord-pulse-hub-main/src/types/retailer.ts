export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface RetailerMetrics {
  totalSales: number;
  totalOrders: number;
  averageRating: number;
}

export interface Retailer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  businessName: string;
  businessType: 'Grocery' | 'Electronics' | 'Fashion' | 'Food & Beverage' | 'Health & Beauty' | 'Other';
  registrationNumber: string;
  status: 'active' | 'inactive' | 'suspended';
  joinedDate: string;
  bankDetails: BankDetails;
  metrics: RetailerMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface RetailerFormData {
  name: string;
  email: string;
  phone: string;
  address: Address;
  businessName: string;
  businessType: string;
  registrationNumber: string;
  bankDetails: BankDetails;
}

export interface RetailersResponse {
  status: string;
  results: number;
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
  data: {
    retailers: Retailer[];
  };
}

export interface RetailerResponse {
  status: string;
  data: {
    retailer: Retailer;
  };
}