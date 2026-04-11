export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 border-4 border-[rgba(255, 0, 51,0.2)] border-t-[#FF0033] rounded-full animate-spin" />
      <p className="text-sm text-[rgba(243,244,244,0.58)]">{text}</p>
    </div>
  );
}
