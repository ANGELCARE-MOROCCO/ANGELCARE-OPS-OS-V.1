import s from "@/angelcare-marketplace/kidflix/kidflix.module.css";
export default function Loading() {
  return (
    <div className={s.section} role="status" aria-label="KidFlix">
      <div className={s.skeletonGrid}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} />
        ))}
      </div>
    </div>
  );
}
