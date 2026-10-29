export default function MatchScore({ score }) {
  const getColor = () => {
    if (score >= 70) return 'text-green-700 bg-green-50 border-green-200';
    if (score >= 45) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getLabel = () => {
    if (score >= 70) return 'Strong match';
    if (score >= 45) return 'Partial match';
    return 'Low match';
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${getColor()}`}>
      <span className="text-base leading-none" aria-hidden="true">
        {score >= 70 ? '●' : score >= 45 ? '◐' : '○'}
      </span>
      <span>{score}%</span>
      <span className="text-xs font-normal opacity-75">· {getLabel()}</span>
    </div>
  );
}

