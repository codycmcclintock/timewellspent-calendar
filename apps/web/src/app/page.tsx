import { Suspense } from "react";
import { SplashSlide } from "@/components/SplashSlide";

export default function SplashPage() {
  return (
    <Suspense fallback={null}>
      <SplashSlide />
    </Suspense>
  );
}
