import { useState, useRef, useEffect, useId } from 'react';

interface ProjectComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];          // existing project names
  placeholder?: string;
  maxLength?: number;
}

/**
 * A combobox for project selection that:
 *  - shows a dropdown of existing projects filtered by the typed text
 *  - offers a "Create '<value>'" entry when the typed text doesn't match an
 *    existing project exactly
 *  - allows clearing the selection (empty string = no project)
 */
export function ProjectCombobox({
  value,
  onChange,
  options,
  placeholder = 'e.g. Work, Personal…',
  maxLength = 50,
}: ProjectComboboxProps) {
  const [inputValue, setInputValue] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Keep local input in sync when the controlled value changes from outside
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  // Build visible list: filtered existing options + optional "Create" entry
  const query = inputValue.trim().toLowerCase();
  const filtered = options.filter((o) => o.toLowerCase().includes(query));
  const exactMatch = options.some((o) => o.toLowerCase() === query);
  const showCreate = inputValue.trim() !== '' && !exactMatch;

  // items: filtered options first, then "create" at the end
  const itemCount = filtered.length + (showCreate ? 1 : 0);

  const selectOption = (val: string) => {
    setInputValue(val);
    onChange(val);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    onChange(v);          // keep parent in sync while typing
    setOpen(true);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, itemCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) {
        if (activeIndex < filtered.length) {
          selectOption(filtered[activeIndex]);
        } else if (showCreate) {
          selectOption(inputValue.trim());
        }
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[role="option"]');
    const el = items[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          className="notion-input"
          style={{ paddingRight: 28 }}
          autoComplete="off"
        />
        {/* Chevron / clear button */}
        {inputValue ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => { selectOption(''); }}
            aria-label="Clear project"
            style={{
              position: 'absolute',
              right: 6,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#aeacaa',
              fontSize: 12,
              lineHeight: 1,
              padding: '2px 3px',
              borderRadius: 3,
            }}
          >
            ✕
          </button>
        ) : (
          <span
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#aeacaa',
              fontSize: 10,
            }}
          >
            ▾
          </span>
        )}
      </div>

      {open && itemCount > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Projects"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: '#fff',
            border: '1px solid #e9e9e7',
            borderRadius: 6,
            boxShadow: 'rgba(15,15,15,0.05) 0 0 0 1px, rgba(15,15,15,0.1) 0 3px 8px',
            margin: 0,
            padding: '4px 0',
            listStyle: 'none',
            maxHeight: 180,
            overflowY: 'auto',
          }}
        >
          {filtered.map((opt, i) => (
            <li
              key={opt}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={opt === value}
              onPointerDown={(e) => { e.preventDefault(); selectOption(opt); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                fontSize: 13,
                cursor: 'pointer',
                color: '#37352f',
                background: i === activeIndex ? '#f1f1ef' : 'transparent',
                fontWeight: opt === value ? 600 : 400,
              }}
            >
              <span style={{ color: '#787774', fontSize: 11 }}>#</span>
              {opt}
              {opt === value && (
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#787774' }}>✓</span>
              )}
            </li>
          ))}

          {showCreate && (
            <li
              id={`${listboxId}-option-${filtered.length}`}
              role="option"
              aria-selected={false}
              onPointerDown={(e) => { e.preventDefault(); selectOption(inputValue.trim()); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                fontSize: 13,
                cursor: 'pointer',
                color: '#37352f',
                background: filtered.length === activeIndex ? '#f1f1ef' : 'transparent',
                borderTop: filtered.length > 0 ? '1px solid #f1f1ef' : 'none',
              }}
            >
              <span style={{ fontSize: 12 }}>＋</span>
              Create{' '}
              <strong style={{ fontWeight: 600 }}>&ldquo;{inputValue.trim()}&rdquo;</strong>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
