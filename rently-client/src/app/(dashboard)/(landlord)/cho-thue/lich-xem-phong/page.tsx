"use client";

import { ViewingScheduleList } from "@/features/viewing-schedule/components/viewing-schedule-list";

export default function ViewingSchedulePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Lịch xem phòng</h1>
      <ViewingScheduleList />
    </div>
  );
}
