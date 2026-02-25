import { CheckCircle2, Circle } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              {step <= currentStep ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              ) : (
                <Circle className="w-8 h-8 text-gray-300" />
              )}
              <span className={`text-xs mt-1 ${step <= currentStep ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                Step {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 ${step < currentStep ? 'bg-green-600' : 'bg-gray-300'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
