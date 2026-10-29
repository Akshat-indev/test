import { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';

const CITIES = [
  { key: 'bengaluru', display: 'Bengaluru' },
  { key: 'mumbai', display: 'Mumbai' },
  { key: 'hyderabad', display: 'Hyderabad' },
  { key: 'delhi', display: 'Delhi' },
  { key: 'pune', display: 'Pune' },
  { key: 'chennai', display: 'Chennai' },
  { key: 'noida', display: 'Noida' },
  { key: 'gurgaon', display: 'Gurgaon' },
  { key: 'kolkata', display: 'Kolkata' },
  { key: 'remote', display: 'Remote (Anywhere)' },
];

export default function LocationSelector({ value, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = CITIES.filter((c) =>
    c.display.toLowerCase().includes(search.toLowerCase())
  );

  const selected = CITIES.find((c) => c.key === value?.toLowerCase() || c.display === value);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input flex items-center justify-between gap-2 text-left cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-gray-400" />
          {selected ? selected.display : <span className="text-gray-400">Select location…</span>}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cities…"
                className="w-full text-sm px-2 py-1.5 outline-none"
              />
            </div>
            <ul className="max-h-52 overflow-y-auto" role="listbox">
              {filtered.map((city) => (
                <li key={city.key}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(city.display);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-50 hover:text-brand-700 transition-colors ${
                      selected?.key === city.key ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {city.display}
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-400">No cities found</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

