"use client";

import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import AccountForm from "@/features/profile/components/account-form";

const AccountPage = () => {
  return (
    <Container>
      <PageHeader
        title="Tài khoản"
        description="Quản lý thông tin tài khoản của bạn"
      />
      <div className="grid gap-4 sm:gap-6">
        <AccountForm />
      </div>
    </Container>
  );
};

export default AccountPage;
