export default function FinancePage() {
  return (
    <div className="fixed inset-0 lg:mr-72">
      <iframe
        src="/finance.html"
        className="w-full h-full border-0"
        title="إدارة مالية"
        allow="same-origin"
      />
    </div>
  );
}
