import { Info, CheckCircle, AlertCircle } from 'lucide-react';

export default function MatchExplanation({ explanation, matchedSkills = [], missingSkills = [] }) {
  if (!explanation) return null;

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
      <div className="flex gap-2 text-sm text-blue-800">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>{explanation}</p>
      </div>

      {matchedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {matchedSkills.slice(0, 6).map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium"
            >
              <CheckCircle className="h-3 w-3" />
              {skill}
            </span>
          ))}
          {matchedSkills.length > 6 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{matchedSkills.length - 6} more
            </span>
          )}
        </div>
      )}

      {missingSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {missingSkills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full"
            >
              <AlertCircle className="h-3 w-3" />
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

