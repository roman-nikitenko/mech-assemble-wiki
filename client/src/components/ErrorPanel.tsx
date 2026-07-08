interface ErrorPanelProps {
  onRetry: () => void;
  message?: string;
}

export function ErrorPanel({
  onRetry,
  message = "Something went wrong talking to the API.",
}: ErrorPanelProps) {
  return (
    <div className="mt-8 rounded-xl border border-fire/40 bg-fire/10 p-6 text-center">
      <p>{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 min-h-11 rounded-lg bg-accent px-4 font-semibold text-bg hover:brightness-110"
      >
        Retry
      </button>
    </div>
  );
}
