"use client";

import { useRouter } from "next/navigation";
import PlantForm from "@/components/admin/PlantForm";
import type { PlantUpdatePayload } from "@/lib/adminApi";
import type { PlantDetail } from "@/lib/api";

const join = (v: string[] | null) => (v && v.length ? v.join(", ") : "");
const numOrEmpty = (v: number | null) => (v != null ? String(v) : "");

export default function EditPlantForm({ plant }: { plant: PlantDetail }) {
  const router = useRouter();

  const save = async (payload: PlantUpdatePayload) => {
    const res = await fetch(`/api/admin/plants/${plant.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    router.push("/admin/plants");
  };

  return (
    <PlantForm
      initial={{
        name_kr: plant.name_kr,
        name_en: plant.name_en ?? "",
        scientific_name: plant.scientific_name ?? "",
        category: plant.category ?? "",
        tags: join(plant.tags),
        planting_months: join((plant.planting_months ?? []).map(String)),
        bloom_months: join((plant.bloom_months ?? []).map(String)),
        watering_level: plant.watering_level ?? "",
        sunlight: plant.sunlight ?? "",
        soil_type: join(plant.soil_type),
        hardiness_zone: numOrEmpty(plant.hardiness_zone),
        min_temp_c: numOrEmpty(plant.min_temp_c),
        difficulty: plant.difficulty ?? "",
        description: plant.description ?? "",
        image_urls: join(plant.image_urls),
        image_credit: plant.image_credit ?? "",
        family: plant.family ?? "",
        origin: plant.origin ?? "",
        growth_form: plant.growth_form ?? "",
        leaf_color: join(plant.leaf_color),
        flower_color: join(plant.flower_color),
        fruit_color: join(plant.fruit_color),
        leaf_pattern: plant.leaf_pattern ?? "",
        leaf_style: plant.leaf_style ?? "",
        propagation_methods: join(plant.propagation_methods),
        pests: join(plant.pests),
        toxicity: plant.toxicity ?? "",
      }}
      onSubmit={save}
    />
  );
}
