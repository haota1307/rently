"use client";

import AccountForm from "@/features/profile/components/account-form";

const AccountPage = () => {
  return (
    <div className="container mx-8 py-10">
      <div className="w-full mx-auto">
        <h1 className="text-3xl font-bold mb-6">Thông tin tài khoản</h1>
        <div className="grid gap-6">
          <AccountForm />
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
