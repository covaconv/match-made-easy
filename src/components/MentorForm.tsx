import { useState } from 'react';
import { MentorProfile } from '@/types';
import {
  ITAM_MAJORS,
  EXPERIENCE_BACKGROUNDS,
  EXPERTISE_AREAS,
  INDUSTRIES,
  STARTUP_STAGES,
  MEETING_FREQUENCIES,
  MONTHLY_TIME_OPTIONS,
  MENTORING_CAPACITY_OPTIONS,
} from '@/data/constants';
import ScreenShell from './ScreenShell';
import ProgressBar from './ProgressBar';
import ChipSelector from './ChipSelector';
import SearchableMultiSelect from './SearchableMultiSelect';

interface MentorFormProps {
  onSubmit: (data: MentorProfile) => void;
  onBack: () => void;
}

const MentorForm = ({ onSubmit, onBack }: MentorFormProps) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Omit<MentorProfile, 'id'>>({
    fullName: '',
    majors: [],
    currentRole: '',
    experienceBackground: [],
    expertise: [],
    industries: [],
    preferredMenteeStages: [],
    meetingFrequency: '',
    monthlyTime: '',
    mentoringCapacity: '',
    threeMonthOutcome: '',
  });

  const update = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const canProceedStep1 =
    data.fullName.trim() && data.majors.length > 0 && data.currentRole.trim() && data.experienceBackground.length > 0;
  const canProceedStep2 = data.expertise.length > 0 && data.industries.length > 0 && data.preferredMenteeStages.length > 0;
  const canSubmit =
    data.meetingFrequency && data.monthlyTime && data.mentoringCapacity && data.threeMonthOutcome.trim().length >= 10;

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onSubmit({ ...data, id: 'user-mentor' } as MentorProfile);
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
              <label className="text-sm font-medium text-foreground">Current role</label>
              <input
                type="text"
                value={data.currentRole}
                onChange={(e) => update('currentRole', e.target.value)}
                placeholder="e.g. Co-founder & CEO at StartupX"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <ChipSelector
              options={EXPERIENCE_BACKGROUNDS}
              selected={data.experienceBackground}
              onChange={(v) => update('experienceBackground', v as string[])}
              multiSelect
              label="Experience background"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <ChipSelector
              options={EXPERTISE_AREAS}
              selected={data.expertise}
              onChange={(v) => update('expertise', v as string[])}
              multiSelect
              maxSelections={4}
              label="Areas of expertise"
            />

            <ChipSelector
              options={INDUSTRIES}
              selected={data.industries}
              onChange={(v) => update('industries', v as string[])}
              multiSelect
              label="Industries familiar with"
            />

            <ChipSelector
              options={STARTUP_STAGES}
              selected={data.preferredMenteeStages}
              onChange={(v) => update('preferredMenteeStages', v as string[])}
              multiSelect
              label="Preferred mentee stage"
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <ChipSelector
              options={MEETING_FREQUENCIES}
              selected={data.meetingFrequency}
              onChange={(v) => update('meetingFrequency', v as string)}
              label="Preferred meeting frequency"
            />

            <ChipSelector
              options={MONTHLY_TIME_OPTIONS}
              selected={data.monthlyTime}
              onChange={(v) => update('monthlyTime', v as string)}
              label="Monthly time available"
            />

            <ChipSelector
              options={MENTORING_CAPACITY_OPTIONS}
              selected={data.mentoringCapacity}
              onChange={(v) => update('mentoringCapacity', v as string)}
              label="Mentoring capacity"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                What kind of founder progress are you best equipped to help unlock in 3 months?
              </label>
              <textarea
                value={data.threeMonthOutcome}
                onChange={(e) => {
                  if (e.target.value.length <= 400) update('threeMonthOutcome', e.target.value);
                }}
                rows={5}
                placeholder="Be specific. Describe the kind of founder progress you are best equipped to help unlock."
                className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {data.threeMonthOutcome.length}/400
              </p>
            </div>
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
            {step === 3 ? 'Submit profile' : 'Next'}
          </button>
        </div>
      </div>
    </ScreenShell>
  );
};

export default MentorForm;
