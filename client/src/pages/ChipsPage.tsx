import { useChips } from "../api/client";
import { ErrorPanel } from "../components/ErrorPanel";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { Seo } from "../components/Seo";
import { ChipBrowser } from "./chips/ChipBrowser";

/** Public Chips page: the Chip browser (6 body parts x 9 qualities). */
export function ChipsPage() {
  const { data, isPending, isError, refetch } = useChips();
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Seo
        title="Chips — Mech Assemble Wiki"
        description="Every chip in Mech Assemble: Zombie Swarm — base stats, compose costs and random effects for all 6 body parts and 9 qualities."
        path="/chips"
      />
      <h1 className="mb-4 text-3xl font-bold">Chips</h1>
      {isPending ? <LoadingSkeleton variant="cards" /> : isError ? <ErrorPanel onRetry={() => refetch()} /> : <ChipBrowser chips={data} />}
    </main>
  );
}
