'use client';

import React, { Suspense } from "react";

import { Skeleton } from "../components/ui/skeleton";
import dynamic from "next/dynamic";
import Footer from "../components/LandingComp/Footer";

const HeadSection = dynamic(
  () => import("../components/LandingComp/HeadSection"),
  {
    loading: () => <SkeletonUI />,
    ssr: false,
  }
);

const InnovationSection = dynamic(
  () => import("../components/LandingComp/InnovationSection"),
  { ssr: false }
);

const SkeletonUI = () => (
  <div className="container max-w-6xl mx-auto p-4 mt-24 space-y-8">
    <div className="flex flex-col gap-4">
      <Skeleton className="h-24 w-3/4 mx-auto" />
      <Skeleton className="h-12 w-2/3 mx-auto" />
    </div>
    <div className="flex space-x-4 justify-center">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
    </div>
    <Skeleton className="h-[400px] w-full" />
  </div>
);

const page = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <HeadSection />
      <Suspense fallback={<div className="h-32" />}>
        <InnovationSection />
      </Suspense>
      <Footer />
    </div>
  );
};

export default page;
