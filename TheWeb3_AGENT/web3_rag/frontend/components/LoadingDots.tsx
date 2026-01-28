export default function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 h-6">
      <span className="w-1.5 h-5 rounded-full bg-gradient-to-t from-primary to-accent animate-[waveform_1s_ease-in-out_infinite] [animation-delay:-0.4s]" />
      <span className="w-1.5 h-8 rounded-full bg-gradient-to-t from-primary to-accent animate-[waveform_1s_ease-in-out_infinite] [animation-delay:-0.2s]" />
      <span className="w-1.5 h-5 rounded-full bg-gradient-to-t from-primary to-accent animate-[waveform_1s_ease-in-out_infinite]" />
    </div>
  );
}
