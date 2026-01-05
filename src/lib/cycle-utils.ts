import { differenceInDays, addDays } from 'date-fns';

export type CyclePhase = 'PERIOD' | 'FOLLICULAR' | 'OVULATION' | 'LUTEAL';

export interface CycleStatus {
    phase: CyclePhase;
    dayOfCycle: number;
    daysUntilNextPeriod: number;
    phaseInfo: {
        title: string;
        description: string;
        nutritionTip: string;
    };
}

const PHASE_METADATA: Record<CyclePhase, { title: string; description: string; nutritionTip: string }> = {
    PERIOD: {
        title: 'Period (Menstruation)',
        description: 'The uterus sheds its lining during this phase.',
        nutritionTip: 'Focus on iron-rich foods (spinach, beans) and stay hydrated to manage cramps and fatigue.',
    },
    FOLLICULAR: {
        title: 'Follicular Phase',
        description: 'The body prepares for a new egg and rebuilds the uterine lining.',
        nutritionTip: 'Energy is increasing. Enjoy complex carbs and healthy fats to support building a healthy lining.',
    },
    OVULATION: {
        title: 'Ovulation',
        description: 'A brief 24-hour window where the egg is released for potential pregnancy.',
        nutritionTip: 'Peak energy phase! Focus on high-fiber foods and light, nutrient-dense meals.',
    },
    LUTEAL: {
        title: 'Luteal Phase (PMS)',
        description: 'The body prepares for the next cycle. Progesterone levels rise.',
        nutritionTip: 'Manage bloating and cravings with magnesium-rich foods (dark chocolate, nuts) and limit salt.',
    },
};

export function calculateCycleStatus(lastPeriodStart: Date, cycleLength: number = 28, referenceDate: Date = new Date()): CycleStatus {
    const ref = new Date(referenceDate);
    ref.setHours(0, 0, 0, 0);

    const lastStart = new Date(lastPeriodStart);
    lastStart.setHours(0, 0, 0, 0);

    const diff = differenceInDays(ref, lastStart);
    // Handle historical dates (if ref is before lastStart)
    const normalizedDiff = ((diff % cycleLength) + cycleLength) % cycleLength;
    const dayOfCycle = normalizedDiff + 1;

    let phase: CyclePhase = 'PERIOD';
    if (dayOfCycle >= 1 && dayOfCycle <= 5) {
        phase = 'PERIOD';
    } else if (dayOfCycle > 5 && dayOfCycle <= 13) {
        phase = 'FOLLICULAR';
    } else if (dayOfCycle === 14) {
        phase = 'OVULATION';
    } else {
        phase = 'LUTEAL';
    }

    const daysUntilNextPeriod = cycleLength - dayOfCycle + 1;

    return {
        phase,
        dayOfCycle,
        daysUntilNextPeriod,
        phaseInfo: PHASE_METADATA[phase],
    };
}
