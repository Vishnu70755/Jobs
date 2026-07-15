import React from "react";
export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-4">This page is under construction.</p>
    </div>
  );
}
