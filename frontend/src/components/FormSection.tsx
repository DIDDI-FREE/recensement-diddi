import type { ReactNode } from 'react';

interface Props {
  titre: string;
  children: ReactNode;
}

/** Wrapper d'une section du formulaire (étape). */
export default function FormSection({ titre, children }: Props) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 border-b border-teal-100 pb-2 text-lg font-semibold text-teal-800">
        {titre}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
