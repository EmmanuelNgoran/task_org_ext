interface TimerDisplayProps {
  elapsedSeconds: number;
  durationMinutes: number;
}

export function TimerDisplay({ elapsedSeconds, durationMinutes }: TimerDisplayProps) {
  const totalSeconds = durationMinutes * 60;
  const remaining = Math.max(0, totalSeconds - elapsedSeconds);
  const progress = totalSeconds > 0 ? Math.min(1, elapsedSeconds / totalSeconds) : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const circumference = 2 * Math.PI * 18; // r=18

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-12 h-12">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke={progress >= 1 ? '#22c55e' : '#6366f1'}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-gray-700">
          {durationMinutes > 0 ? formatTime(remaining) : formatTime(elapsedSeconds)}
        </span>
      </div>
      <span className="text-[10px] text-gray-500">
        {durationMinutes > 0 ? 'left' : 'elapsed'}
      </span>
    </div>
  );
}
