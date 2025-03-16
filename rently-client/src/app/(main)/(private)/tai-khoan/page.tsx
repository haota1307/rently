import AccountForm from "@/features/users/components/account-form";

const AccountPage = () => {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Thông tin tài khoản</h1>
        <div className="grid gap-6">
          <AccountForm />
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
