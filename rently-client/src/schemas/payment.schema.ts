export interface Transaction {
  id: string;
  transactionId: string;
  date: string;
  rawDate: Date;
  amount: number;
  type: string;
  user: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  status: string;
  source?: string;
}

export interface ApiTransaction {
  id: string;
  bank_brand_name?: string;
  account_number: string;
  transaction_date: string;
  amount_out: string;
  amount_in: string;
  accumulated: string;
  transaction_content: string | null;
  reference_number: string | null;
  code: string | null;
  sub_account: string | null;
  bank_account_id?: string;
  status?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
  };
}
