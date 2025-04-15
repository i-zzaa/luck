export interface CheckboxSNProps {
  value: 'S' | 'N';
  onChange: (value: 'S' | 'N') => void;
  disabled?: boolean;
}