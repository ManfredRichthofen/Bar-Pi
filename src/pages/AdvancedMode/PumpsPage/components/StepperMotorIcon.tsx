import type React from 'react';

interface StepperMotorIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const StepperMotorIcon: React.FC<StepperMotorIconProps> = ({
  width = 24,
  height = 24,
  className = '',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12" />
    <path d="M8 10l8 4" />
    <path d="M16 10l-8 4" />
  </svg>
);

export default StepperMotorIcon;
