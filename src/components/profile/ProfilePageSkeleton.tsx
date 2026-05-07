export default function ProfilePageSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-40 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 ring-1 ring-gray-200/80" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="h-72 rounded-2xl bg-white shadow-md ring-1 ring-gray-100" />
          <div className="h-48 rounded-2xl bg-white shadow-md ring-1 ring-gray-100" />
        </div>
        <div className="lg:col-span-4">
          <div className="h-96 rounded-2xl bg-white shadow-md ring-1 ring-gray-100" />
        </div>
      </div>
    </div>
  );
}
