"use client";

import { Dumbbell, House, Utensils, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

type Destino = { href: string; rotulo: string; Icone: LucideIcon };

const DESTINOS: Destino[] = [
  { href: "/hoje", rotulo: "Hoje", Icone: House },
  { href: "/treino", rotulo: "Treino", Icone: Dumbbell },
  { href: "/dieta", rotulo: "Dieta", Icone: Utensils },
];

export function NavegacaoInferior() {
  const caminho = usePathname();

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 pb-seguro backdrop-blur"
    >
      <ul className="mx-auto grid h-nav max-w-app grid-cols-3">
        {DESTINOS.map(({ href, rotulo, Icone }) => {
          const ativo = caminho === href || caminho.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex h-full min-h-toque flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  ativo ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icone aria-hidden className="size-6" />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
