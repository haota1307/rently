"use client";

import AccountForm from "@/features/profile/components/account-form";

const AccountPage = () => {
  return (
    <div className="container px-4 sm:px-6 py-6 sm:py-10">
      <div className="w-full mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
          Thông tin tài khoản
        </h1>
        <div className="grid gap-4 sm:gap-6">
          <AccountForm />
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
