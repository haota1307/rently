import http from "@/lib/http";

interface GetTransactionsResponseType {
  status: number;
  error: null | any;
  messages: {
    success: boolean;
  };
  transactions: Array<{
    id: string;
    bank_brand_name: string;
    account_number: string;
    transaction_date: string;
    amount_out: string;
    amount_in: string;
    accumulated: string;
    transaction_content: string | null;
    reference_number: string | null;
    code: string | null;
    sub_account: string | null;
    bank_account_id: string;
  }>;
}

interface GetTransactionDetailResponseType {
  status: number;
  error: null | any;
  messages: {
    success: boolean;
  };
  transaction: {
    id: string;
    bank_brand_name: string;
    account_number: string;
    transaction_date: string;
    amount_out: string;
    amount_in: string;
    accumulated: string;
    transaction_content: string | null;
    reference_number: string | null;
    code: string | null;
    sub_account: string | null;
    bank_account_id: string;
  };
}

interface CountTransactionsResponseType {
  status: number;
  error: null | any;
  messages: {
    success: boolean;
  };
  count_transactions: number;
}

interface TransactionQueryParams {
  account_number?: string;
  transaction_date_min?: string;
  transaction_date_max?: string;
  since_id?: string;
  limit?: string;
  reference_number?: string;
  amount_in?: string;
  amount_out?: string;
}

const prefix = "/payments";

const paymentApiRequest = {
  getTransactions: (params?: TransactionQueryParams) => {
    // Convert params to query string
    const queryParams = params
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
    return http.get<GetTransactionsResponseType>(
      `${prefix}/transactions${queryParams}`
    );
  },

  getTransactionDetail: (id: string) =>
    http.get<GetTransactionDetailResponseType>(`${prefix}/transactions/${id}`),

  countTransactions: (params?: TransactionQueryParams) => {
    // Convert params to query string
    const queryParams = params
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
    return http.get<CountTransactionsResponseType>(
      `${prefix}/transactions/count${queryParams}`
    );
  },
};

export default paymentApiRequest;
