import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LinkDeVoltar({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button asChild variant="ghost" className="-ml-3 self-start">
      <Link href={href}>
        <ChevronLeft aria-hidden />
        <span className="truncate">{children}</span>
      </Link>
    </Button>
  );
}
