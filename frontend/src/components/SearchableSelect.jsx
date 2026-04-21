import React, { useState, useEffect, useRef } from 'react';
import { lookupData } from '../utils/api';

export default function SearchableSelect({ targetTable, value, onChange }) {
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const ref = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch options when search changes
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await lookupData(targetTable, search);
        setOptions(res.data);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [search, open, targetTable]);

  // Load initial label for selected value
  useEffect(() => {
    if (value && !selectedLabel) {
      lookupData(targetTable, '', 100).then((res) => {
        const found = res.data.find((o) => String(o.value) === String(value));
        if (found) setSelectedLabel(found.label);
      }).catch(() => {});
    }
  }, [value]);

  const handleSelect = (option) => {
    onChange(option.value);
    setSelectedLabel(option.label);
    setSearch('');
    setOpen(false);
  };

  return (
    <div className="searchable-select" ref={ref}>
      <input
        className="searchable-select__input"
        type="text"
        value={open ? search : selectedLabel || (value ? `ID: ${value}` : '')}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => { setOpen(true); setSearch(''); }}
        placeholder={`Пошук у ${targetTable}...`}
      />
      <span className="searchable-select__chevron">{open ? '▲' : '▼'}</span>

      {open && (
        <div className="searchable-select__dropdown">
          {loading ? (
            <div className="searchable-select__empty">
              <span className="spinner" /> Завантаження...
            </div>
          ) : options.length === 0 ? (
            <div className="searchable-select__empty">Нічого не знайдено</div>
          ) : (
            options.map((opt) => (
              <div
                key={opt.value}
                className={`searchable-select__option ${
                  String(opt.value) === String(value) ? 'searchable-select__option--active' : ''
                }`}
                onClick={() => handleSelect(opt)}
              >
                <strong style={{ color: 'var(--text-accent)', marginRight: 6 }}>
                  {opt.value}
                </strong>
                {opt.label !== String(opt.value) && opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
