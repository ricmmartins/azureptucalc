export const PROCESSING_ASSUMPTION = 'Priority share applies equally to input and output token volumes, not request counts. Standard and Priority traffic use the same input/output mix.';
export const PRIORITY_CAVEAT = 'Priority has model-specific latency targets and eligibility conditions, not a guarantee for every request. Ramp limits, peak demand or long context can cause Standard processing and billing. Validate latency with a representative workload.';
export const SPILLOVER_ASSUMPTION = 'Spillover extrapolates P99 overflow across the entered monthly minutes using the resolved input/output mix. It is a planning approximation, not measured monthly overflow or proof that routing is configured.';

export function getPaygoLabel(priorityShare) {
  return priorityShare === 0
    ? 'PAYGO Standard'
    : `PAYGO with Priority Processing (${priorityShare}%)`;
}

export function getProcessingRecommendation({
  monthlyPaygoCost,
  monthlyPtuReservationCost,
  yearlyReservationMonthly,
  hybridTotalCost,
  hybridYearlyTotalCost,
  priorityShare,
  spilloverPriorityShare,
  isLatencyCritical,
  priorityAvailable
}) {
  const candidates = [
    { strategy: 'paygo', label: getPaygoLabel(priorityShare), monthlyCost: monthlyPaygoCost },
    { strategy: 'ptu', label: 'PTU Monthly Reservation', monthlyCost: monthlyPtuReservationCost },
    { strategy: 'ptu', label: 'PTU 1-Year Reservation', monthlyCost: yearlyReservationMonthly }
  ];
  if (hybridTotalCost != null) {
    candidates.push({
      strategy: 'spillover',
      label: spilloverPriorityShare > 0
        ? `PTU (monthly) + Priority spillover (${spilloverPriorityShare}%)`
        : 'PTU (monthly) + Standard spillover',
      monthlyCost: hybridTotalCost
    });
  }
  if (hybridYearlyTotalCost != null) {
    candidates.push({
      strategy: 'spillover',
      label: spilloverPriorityShare > 0
        ? `PTU (1-year) + Priority spillover (${spilloverPriorityShare}%)`
        : 'PTU (1-year) + Standard spillover',
      monthlyCost: hybridYearlyTotalCost
    });
  }
  if (candidates.some(({ monthlyCost }) => !Number.isFinite(monthlyCost) || monthlyCost < 0)) {
    throw new RangeError('Recommendation requires complete, nonnegative scenario costs.');
  }
  const best = candidates.reduce((lowest, option) =>
    option.monthlyCost < lowest.monthlyCost ? option : lowest
  );
  const considerations = [PROCESSING_ASSUMPTION];
  const nextSteps = best.strategy === 'ptu'
    ? ['Confirm capacity availability and validate PTU sizing under load.', 'Choose the reservation term shown in this estimate before committing.']
    : best.strategy === 'spillover'
      ? ['Measure actual overflow volumes and confirm the stated reservation term before committing to base PTUs.', 'Configure and test the overflow deployment and its service tier.']
      : ['Configure Standard and Priority routing to match the selected token share.', 'Monitor actual token usage and service tiers billed.'];
  if (best.strategy === 'spillover') considerations.push(SPILLOVER_ASSUMPTION);
  if (priorityShare > 0 || spilloverPriorityShare > 0 || isLatencyCritical) {
    considerations.push(PRIORITY_CAVEAT);
  }

  const needsPriorityReview = isLatencyCritical && (
    (best.strategy === 'paygo' && priorityShare === 0) ||
    (best.strategy === 'spillover' && spilloverPriorityShare === 0)
  );
  if (needsPriorityReview) {
    return {
      strategy: 'review',
      label: !priorityAvailable ? 'Review latency requirements'
        : best.strategy === 'spillover' ? 'Review spillover latency'
          : 'Evaluate PAYGO with Priority Processing',
      reason: `${best.label} is the lowest modeled cost, but Standard processing has not been qualified for your latency requirement. ${
        priorityAvailable
          ? 'Select the Priority token share for latency-sensitive traffic and recalculate, or evaluate PTU.'
          : 'Priority is not verified for this model and location. Evaluate a supported deployment or PTU and validate latency.'
      }`,
      monthlyCost: null,
      costLeader: best.label,
      requiresReview: true,
      nextSteps: [
        'Define latency targets and identify the traffic that must meet them.',
        priorityAvailable ? 'Set the Priority share for that traffic and compare costs again.' : 'Choose a supported model/location or evaluate PTU.',
        'Validate latency under representative load before selecting a strategy.'
      ],
      considerations
    };
  }
  return {
    ...best,
    reason: `${best.label} has the lowest modeled monthly cost among the selected PAYGO mix, PTU reservation terms and available spillover scenario.${
      best.strategy !== 'paygo' ? ' Reservation pricing assumes the stated commitment term.' : ''
    }${isLatencyCritical
      ? best.strategy === 'ptu'
        ? ' Validate that the provisioned capacity meets your latency targets.'
        : ' Priority applies only to the selected share; validate the latency-sensitive traffic and fallback behavior.'
      : ''}`,
    costLeader: best.label,
    requiresReview: false,
    nextSteps,
    considerations
  };
}
