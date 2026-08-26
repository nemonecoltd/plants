import type { Metadata } from "next";
import PlantGrid from "@/components/PlantGrid";
import { getPlants } from "@/lib/api";

export const metadata: Metadata = {
  title: "전체 식물도감",
  description: "실내정원용 식물을 포함해 등록된 모든 식물을 한눈에 찾아보세요.",
  alternates: { canonical: "/plants" },
};

export default async function PlantsPage() {
  const plants = await getPlants();

  return (
    <div className="min-h-screen bg-[#F4F6F4]">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-lg font-bold text-plant-primary mb-4">전체 식물도감 ({plants.length})</h1>
        <PlantGrid plants={plants} />
      </main>
    </div>
  );
}
