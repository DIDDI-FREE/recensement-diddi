import type { ReactNode } from 'react';

interface Props {
  titre: string;
  children: ReactNode;
}

/** Wrapper d'une section du formulaire (étape). */
export default function FormSection({ titre, children }: Props) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-5 border-b border-teal-100 pb-3 text-lg font-semibold text-slate-900">
        {titre}
      </h2>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}
