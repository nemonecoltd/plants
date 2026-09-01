"use client";

import { useState } from "react";
import type { PlantUpdatePayload } from "@/lib/adminApi";

export interface PlantFormValues {
  name_kr: string;
  name_en: string;
  scientific_name: string;
  category: string;
  plant_group: string;
  tags: string;
  planting_months: string;
  bloom_months: string;
  watering_level: string;
  sunlight: string;
  soil_type: string;
  hardiness_zone: string;
  min_temp_c: string;
  difficulty: string;
  description: string;
  image_urls: string;
  image_credit: string;
  family: string;
  origin: string;
  growth_form: string;
  leaf_color: string;
  flower_color: string;
  fruit_color: string;
  leaf_pattern: string;
  leaf_style: string;
  propagation_methods: string;
  pests: string;
  toxicity: string;
}

const toList = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);
const toIntList = (v: string) => toList(v).map(Number).filter((n) => !Number.isNaN(n));
const toIntOrNull = (v: string) => (v.trim() ? Number(v.trim()) : null);
const orNull = (v: string) => (v.trim() ? v.trim() : null);

export default function PlantForm({
  initial,
  onSubmit,
}: {
  initial: PlantFormValues;
  onSubmit: (payload: PlantUpdatePayload) => Promise<void>;
}) {
  const [values, setValues] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof PlantFormValues>(key: K, v: PlantFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name_kr: values.name_kr,
        name_en: orNull(values.name_en),
        scientific_name: orNull(values.scientific_name),
        category: orNull(values.category),
        plant_group: orNull(values.plant_group),
        tags: toList(values.tags),
        planting_months: toIntList(values.planting_months),
        bloom_months: toIntList(values.bloom_months),
        watering_level: orNull(values.watering_level),
        sunlight: orNull(values.sunlight),
        soil_type: toList(values.soil_type),
        hardiness_zone: toIntOrNull(values.hardiness_zone),
        min_temp_c: toIntOrNull(values.min_temp_c),
        difficulty: orNull(values.difficulty),
        description: orNull(values.description),
        image_urls: toList(values.image_urls),
        image_credit: orNull(values.image_credit),
        family: orNull(values.family),
        origin: orNull(values.origin),
        growth_form: orNull(values.growth_form),
        leaf_color: toList(values.leaf_color),
        flower_color: toList(values.flower_color),
        fruit_color: toList(values.fruit_color),
        leaf_pattern: orNull(values.leaf_pattern),
        leaf_style: orNull(values.leaf_style),
        propagation_methods: toList(values.propagation_methods),
        pests: toList(values.pests),
        toxicity: orNull(values.toxicity),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 text-sm rounded border border-gray-200 outline-none focus:border-plant-primary";
  const labelClass = "block text-xs font-bold text-gray-500 mb-1";

  const Field = ({ label, k }: { label: string; k: keyof PlantFormValues }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input className={inputClass} value={values[k]} onChange={(e) => set(k, e.target.value)} />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="국명(이름)" k="name_kr" />
        <Field label="영문명" k="name_en" />
        <Field label="학명" k="scientific_name" />
        <Field label="과(科)" k="family" />
        <Field label="카테고리" k="category" />
        <Field label="5분류(꽃/나무/과일/건조/기타)" k="plant_group" />
        <Field label="원산지" k="origin" />
      </div>

      <div>
        <label className={labelClass}>설명</label>
        <textarea
          className={inputClass}
          rows={6}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>난이도(easy/medium/hard)</label>
          <input className={inputClass} value={values.difficulty} onChange={(e) => set("difficulty", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>빛(full_sun/part_shade/full_shade)</label>
          <input className={inputClass} value={values.sunlight} onChange={(e) => set("sunlight", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>물주기(dry/moderate/wet)</label>
          <input className={inputClass} value={values.watering_level} onChange={(e) => set("watering_level", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Field label="심는 시기(월, 콤마)" k="planting_months" />
        <Field label="개화 시기(월, 콤마)" k="bloom_months" />
        <Field label="최저 견딜 온도(℃)" k="min_temp_c" />
        <Field label="내한성 존" k="hardiness_zone" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="생육형태" k="growth_form" />
        <Field label="토양(콤마로 구분)" k="soil_type" />
        <Field label="번식방법(콤마로 구분)" k="propagation_methods" />
        <Field label="병충해(콤마로 구분)" k="pests" />
        <Field label="잎 색(콤마로 구분)" k="leaf_color" />
        <Field label="꽃 색(콤마로 구분)" k="flower_color" />
        <Field label="열매 색(콤마로 구분)" k="fruit_color" />
        <Field label="잎무늬" k="leaf_pattern" />
      </div>

      <div>
        <label className={labelClass}>잎 특징(서술형)</label>
        <input className={inputClass} value={values.leaf_style} onChange={(e) => set("leaf_style", e.target.value)} />
      </div>

      <div>
        <label className={labelClass}>독성 정보</label>
        <input className={inputClass} value={values.toxicity} onChange={(e) => set("toxicity", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="이미지 URL(콤마로 구분)" k="image_urls" />
        <Field label="이미지 출처" k="image_credit" />
      </div>

      <Field label="태그(콤마로 구분)" k="tags" />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !values.name_kr}
        className="self-start px-6 py-2.5 rounded-full bg-plant-primary text-white text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {submitting ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
