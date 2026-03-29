import { useState } from 'react';
import { FounderProfile } from '@/types';
import {
  ITAM_MAJORS,
  STARTUP_STAGES,
  INDUSTRIES,
  MAIN_CHALLENGES,
  SUPPORT_NEEDS,
  MEETING_FREQUENCIES,
} from '@/data/constants';
import ScreenShell from './ScreenShell';
import ProgressBar from './ProgressBar';
import ChipSelector from './ChipSelector';
import SearchableMultiSelect from './SearchableMultiSelect';

interface FounderFormProps {
  onSubmit: (data: FounderProfile) => void;
  onBack: () => void;
}

const FounderForm = ({ onSubmit, onBack }: FounderFormProps) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FounderProfile>({
    fullName: '',
    majors: [],
    startupName: '',
    startupStage: '',
    industry: '',
    mainChallenge: '',
    supportNeeds: [],
    meetingFrequency: '',
    threeMonthGoal: '',
  });

  const update = <K extends keyof FounderProfile>(key: K, value: FounderProfile[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const canProceedStep1 =
    data.fullName.trim() && data.majors.length > 0 && data.startupName.trim() && data.startupStage && data.industry;
  const canProceedStep2 = data.mainChallenge && data.supportNeeds.length > 0 && data.meetingFrequency;
  const canSubmit = data.threeMonthGoal.trim().length >= 10;

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onSubmit(data);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onBack();
  };

  return (
    <ScreenShell>
      <div className="space-y-6">
        <ProgressBar currentStep={step} totalSteps={3} />

        <div className="text-sm text-muted-foreground">Step {step} of 3</div>

        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full name</label>
              <input
                type="text"
                value={data.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                placeholder="Your full name"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <SearchableMultiSelect
              options={ITAM_MAJORS}
              selected={data.majors}
              onChange={(v) => update('majors', v)}
              maxSelections={2}
              label="ITAM major / program"
              placeholder="Search your major..."
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Startup name</label>
              <input
                type="text"
                value={data.startupName}
                onChange={(e) => update('startupName', e.target.value)}
                placeholder="Your startup name"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <ChipSelector
              options={STARTUP_STAGES}
              selected={data.startupStage}
              onChange={(v) => update('startupStage', v as string)}
              label="Startup stage"
            />

            <ChipSelector
              options={INDUSTRIES}
              selected={data.industry}
              onChange={(v) => update('industry', v as string)}
              label="Industry / domain"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <ChipSelector
              options={MAIN_CHALLENGES}
              selected={data.mainChallenge}
              onChange={(v) => update('mainChallenge', v as string)}
              label="Main challenge right now"
            />

            <ChipSelector
              options={SUPPORT_NEEDS}
              selected={data.supportNeeds}
              onChange={(v) => update('supportNeeds', v as string[])}
              multiSelect
              maxSelections={2}
              label="What kind of support would help most right now?"
            />

            <ChipSelector
              options={MEETING_FREQUENCIES}
              selected={data.meetingFrequency}
              onChange={(v) => update('meetingFrequency', v as string)}
              label="Preferred meeting frequency"
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              What do you want to achieve in the next 3 months?
            </label>
            <textarea
              value={data.threeMonthGoal}
              onChange={(e) => {
                if (e.target.value.length <= 400) update('threeMonthGoal', e.target.value);
              }}
              rows={5}
              placeholder="Be specific. Mention one milestone and the kind of support that would help you reach it."
              className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring min-h-[120px] resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {data.threeMonthGoal.length}/400
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleBack}
            className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={
              (step === 1 && !canProceedStep1) ||
              (step === 2 && !canProceedStep2) ||
              (step === 3 && !canSubmit)
            }
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step === 3 ? 'Find my mentors' : 'Next'}
          </button>
        </div>
      </div>
    </ScreenShell>
  );
};

export default FounderForm;
