'use client';

import { forwardRef } from 'react';
import FormSelect from './FormSelect';
import { BANKS } from '@/types';

interface BankSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const BankSelect = forwardRef<HTMLButtonElement, BankSelectProps>(
  ({ label = 'Bank Name', placeholder = 'Select a bank', ...props }, ref) => {
    return (
      <FormSelect
        ref={ref}
        label={label}
        placeholder={placeholder}
        options={BANKS}
        {...props}
      />
    );
  }
);

BankSelect.displayName = 'BankSelect';

export default BankSelect;
