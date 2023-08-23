import React, { useState } from 'react';
import './SelectInput.css';

export interface SelectOption<T> {
  label: string;
  value: T;
}

export interface SelectInputProps<T = string> {
  options: (string | SelectOption<T>)[];
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
}

export function SelectInput<const T>(props: SelectInputProps<T>) {
  const _firstValue = props.options[0];
  const [selected, setSelected] = useState<T>(
    props.value
      ?? props.defaultValue
      ?? typeof _firstValue === 'string' ? _firstValue : _firstValue.value as any
  );
  const actualValue = props.value ?? selected;
  function renderOption(option: string | SelectOption<any>, index: number) {
    const value = typeof option === 'string' ? option : option.value;
    const label = typeof option === 'string' ? option : option.label;

    return (
      <option
        key={index}
        className={`${value === actualValue ? 'ic-SelectInput-option--selected' : ''}`}
        onClick={() => {
          setSelected(value);
          props.onChange?.(value)
        }}
      >
        {label}
      </option>
    );
  }

  return (
    <select className={`ic-SelectInput`}>
      {props.options.map(renderOption)}
    </select>
  );
}
