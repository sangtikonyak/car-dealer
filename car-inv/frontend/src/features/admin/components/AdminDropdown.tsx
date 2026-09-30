import { Check, ChevronDown } from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';

export interface AdminDropdownOption {
  value: string;
  label: string;
  description?: string;
  startAdornment?: ReactNode;
  disabled?: boolean;
}

interface AdminDropdownProps {
  label?: string;
  labelHidden?: boolean;
  value: string;
  options: readonly AdminDropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  renderValue?: (option: AdminDropdownOption | undefined) => ReactNode;
  invalid?: boolean;
  error?: string;
  validationKey?: string;
  onBlur?: () => void;
  required?: boolean;
}

const firstEnabledIndex = (options: readonly AdminDropdownOption[]): number =>
  options.findIndex((option) => !option.disabled);

const lastEnabledIndex = (options: readonly AdminDropdownOption[]): number => {
  for (let index = options.length - 1; index >= 0; index -= 1) {
    if (!options[index]?.disabled) return index;
  }
  return -1;
};

export function AdminDropdown({
  label,
  labelHidden = false,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  ariaLabel,
  className,
  renderValue,
  invalid = false,
  error,
  validationKey,
  onBlur,
  required = false,
}: AdminDropdownProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const focusOptionOnOpen = useRef(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => {
    const selectedIndex = options.findIndex((option) => option.value === value);
    return selectedIndex >= 0 ? selectedIndex : firstEnabledIndex(options);
  });
  const id = useId();
  const menuId = `${id}-menu`;
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const selectedOption = options.find((option) => option.value === value);
  const selectedIndex = selectedOption ? options.indexOf(selectedOption) : -1;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !focusOptionOnOpen.current) return;
    focusOptionOnOpen.current = false;
    requestAnimationFrame(() => optionRefs.current[activeIndex]?.focus());
  }, [activeIndex, open]);

  useEffect(() => {
    if (selectedIndex >= 0) setActiveIndex(selectedIndex);
  }, [selectedIndex]);

  const moveActive = (direction: 1 | -1) => {
    if (!options.length) return;
    let index = activeIndex >= 0 ? activeIndex : firstEnabledIndex(options);
    for (let step = 0; step < options.length; step += 1) {
      index = (index + direction + options.length) % options.length;
      if (!options[index]?.disabled) {
        setActiveIndex(index);
        optionRefs.current[index]?.focus();
        return;
      }
    }
  };

  const openMenu = (focusOption: boolean) => {
    focusOptionOnOpen.current = focusOption;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabledIndex(options));
    setOpen(true);
  };

  const selectOption = (option: AdminDropdownOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(true);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) setOpen(false);
      else openMenu(false);
    } else if (event.key === 'Home') {
      event.preventDefault();
      openMenu(true);
      setActiveIndex(firstEnabledIndex(options));
    } else if (event.key === 'End') {
      event.preventDefault();
      openMenu(true);
      setActiveIndex(lastEnabledIndex(options));
    }
  };

  const handleOptionKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
    option: AdminDropdownOption,
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      const nextIndex = firstEnabledIndex(options);
      setActiveIndex(nextIndex);
      optionRefs.current[nextIndex]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      const nextIndex = lastEnabledIndex(options);
      setActiveIndex(nextIndex);
      optionRefs.current[nextIndex]?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectOption(option);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    } else if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <div
      className={`admin-dropdown${className ? ` ${className}` : ''}`}
      data-validation-key={validationKey}
      ref={rootRef}
    >
      {label ? (
        <span className={`admin-dropdown-label${labelHidden ? ' sr-only' : ''}`} id={labelId}>
          {label}
          {required ? (
            <em className="admin-required-mark" aria-hidden="true">
              *
            </em>
          ) : null}
          {required ? (
            <span className="sr-only" aria-hidden="true">
              required
            </span>
          ) : null}
        </span>
      ) : null}
      <button
        ref={triggerRef}
        className="admin-dropdown-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-labelledby={label ? labelId : undefined}
        aria-label={!label ? ariaLabel : undefined}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={error ? errorId : undefined}
        onBlur={onBlur}
        onClick={() => (open ? setOpen(false) : openMenu(false))}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="admin-dropdown-value">
          {renderValue ? renderValue(selectedOption) : (selectedOption?.label ?? placeholder)}
        </span>
        <ChevronDown className="admin-dropdown-chevron" size={16} aria-hidden="true" />
      </button>
      {open ? (
        <div
          className="admin-dropdown-menu"
          id={menuId}
          role="listbox"
          aria-label={ariaLabel ?? label}
        >
          {options.length ? (
            options.map((option, index) => (
              <button
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                className={`admin-dropdown-option${option.value === value ? ' is-selected' : ''}${
                  index === activeIndex ? ' is-active' : ''
                }`}
                type="button"
                role="option"
                aria-selected={option.value === value}
                disabled={option.disabled}
                key={option.value}
                onClick={() => selectOption(option)}
                onKeyDown={(event) => handleOptionKeyDown(event, index, option)}
              >
                {option.startAdornment ? (
                  <span className="admin-dropdown-option-adornment" aria-hidden="true">
                    {option.startAdornment}
                  </span>
                ) : null}
                <span className="admin-dropdown-option-copy">
                  <strong>{option.label}</strong>
                  {option.description ? <small>{option.description}</small> : null}
                </span>
                {option.value === value ? <Check size={16} aria-hidden="true" /> : null}
              </button>
            ))
          ) : (
            <span className="admin-dropdown-empty">No options available.</span>
          )}
        </div>
      ) : null}
      {error ? (
        <small className="admin-field-error" id={errorId}>
          {error}
        </small>
      ) : null}
    </div>
  );
}
