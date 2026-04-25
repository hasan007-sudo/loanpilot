type EligibilityResult = {
  eligible: boolean;
  reason: string;
  maxAmount: number;
  status: "eligible" | "ineligible" | "review_needed";
};

const RULES: Record<string, { minIncome: number; maxRatio: number; employment: string[] }> = {
  home:     { minIncome: 40000, maxRatio: 80, employment: ["salaried", "self_employed"] },
  personal: { minIncome: 25000, maxRatio: 20, employment: ["salaried", "self_employed", "business_owner"] },
  business: { minIncome: 50000, maxRatio: 30, employment: ["business_owner", "self_employed"] },
  auto:     { minIncome: 20000, maxRatio: 15, employment: ["salaried", "self_employed", "business_owner"] },
};

export function checkEligibility(
  loanType: string | null,
  loanAmount: number | null,
  monthlyIncome: number | null,
  employmentType: string | null
): EligibilityResult {
  if (!loanType || !RULES[loanType]) {
    return { eligible: false, reason: `Unknown loan type: ${loanType}`, maxAmount: 0, status: "ineligible" };
  }
  if (monthlyIncome === null || loanAmount === null) {
    return { eligible: false, reason: "Missing income or loan amount", maxAmount: 0, status: "review_needed" };
  }

  const rule = RULES[loanType];
  const maxAmount = monthlyIncome * rule.maxRatio;

  if (employmentType && !rule.employment.includes(employmentType)) {
    return {
      eligible: false,
      reason: `Employment type '${employmentType}' not eligible for ${loanType} loan`,
      maxAmount,
      status: "ineligible",
    };
  }

  if (monthlyIncome < rule.minIncome) {
    if (monthlyIncome >= rule.minIncome * 0.8) {
      return {
        eligible: false,
        reason: `Income ₹${monthlyIncome.toLocaleString("en-IN")} close to but below ₹${rule.minIncome.toLocaleString("en-IN")} threshold — manual review`,
        maxAmount,
        status: "review_needed",
      };
    }
    return {
      eligible: false,
      reason: `Monthly income ₹${monthlyIncome.toLocaleString("en-IN")} below ₹${rule.minIncome.toLocaleString("en-IN")} minimum`,
      maxAmount,
      status: "ineligible",
    };
  }

  if (loanAmount > maxAmount) {
    if (loanAmount <= maxAmount * 1.2) {
      return {
        eligible: false,
        reason: `Requested ₹${loanAmount.toLocaleString("en-IN")} exceeds ${rule.maxRatio}x cap but within 20% — manual review`,
        maxAmount,
        status: "review_needed",
      };
    }
    return {
      eligible: false,
      reason: `Requested ₹${loanAmount.toLocaleString("en-IN")} exceeds max ₹${maxAmount.toLocaleString("en-IN")}`,
      maxAmount,
      status: "ineligible",
    };
  }

  return {
    eligible: true,
    reason: `Income meets ${rule.maxRatio}x criteria for ${loanType} loan`,
    maxAmount,
    status: "eligible",
  };
}
