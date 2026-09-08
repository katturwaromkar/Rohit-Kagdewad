/**
 * AI Borrower Credit & Default Risk Scoring Engine
 * Analyzes repayment history, overdue frequency, installment timeliness,
 * and borrower stability to generate actionable credit ratings.
 */

export interface BorrowerCreditInput {
  totalLoans: number;
  activeLoans: number;
  totalBorrowerPaid: number;
  totalBorrowerDue: number;
  overdueInstallmentsCount: number;
  closedLoansCount: number;
  monthlyIncome?: number | null;
  totalMonthlyEmi?: number;
}

export interface CreditScoreResult {
  score: number; // 0 - 100
  grade: "A+" | "A" | "B" | "C" | "D";
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  riskLabelMr: string;
  riskLabelEn: string;
  badgeColor: string;
  repaymentRatioPct: number;
  recommendationMr: string;
  recommendationEn: string;
}

export function calculateBorrowerRiskScore(input: BorrowerCreditInput): CreditScoreResult {
  let score = 85; // Base starting score for active borrower

  // Factor 1: Overdue Installments Penalty (-15 per overdue installment)
  if (input.overdueInstallmentsCount > 0) {
    score -= Math.min(input.overdueInstallmentsCount * 18, 55);
  } else {
    score += 5; // Bonus for 0 overdue
  }

  // Factor 2: Closed Loans Success Bonus (+5 per successfully closed loan)
  if (input.closedLoansCount > 0) {
    score += Math.min(input.closedLoansCount * 6, 15);
  }

  // Factor 3: Repayment Volume Ratio
  const repaymentRatio = input.totalBorrowerDue > 0
    ? (input.totalBorrowerPaid / input.totalBorrowerDue)
    : 1;
  const repaymentRatioPct = Math.min(100, Math.round(repaymentRatio * 100));

  if (repaymentRatioPct >= 95) {
    score += 5;
  } else if (repaymentRatioPct < 70) {
    score -= 15;
  } else if (repaymentRatioPct < 50) {
    score -= 30;
  }

  // Factor 4: Income to EMI Debt-to-Income Ratio (DTI)
  if (input.monthlyIncome && input.totalMonthlyEmi && input.monthlyIncome > 0) {
    const dti = (input.totalMonthlyEmi / input.monthlyIncome) * 100;
    if (dti > 60) {
      score -= 12; // Overleveraged
    } else if (dti < 30) {
      score += 5; // Healthy disposable income
    }
  }

  // Clamp score strictly between 15 and 99
  const finalScore = Math.max(15, Math.min(99, Math.round(score)));

  if (finalScore >= 85) {
    return {
      score: finalScore,
      grade: "A+",
      riskLevel: "LOW",
      riskLabelMr: "उत्तम परतफेड (कमी जोखीम)",
      riskLabelEn: "Excellent Standing (Low Risk)",
      badgeColor: "bg-emerald-950/80 text-emerald-400 border-emerald-800",
      repaymentRatioPct,
      recommendationMr: "कर्जदार वेळेवर परतफेड करतो. पुढील कर्जास पात्र.",
      recommendationEn: "Consistent on-time repayments. Eligible for loan top-up.",
    };
  } else if (finalScore >= 70) {
    return {
      score: finalScore,
      grade: "A",
      riskLevel: "LOW",
      riskLabelMr: "सुरक्षित (चांगला इतिहास)",
      riskLabelEn: "Good Standing (Low Risk)",
      badgeColor: "bg-blue-950/80 text-blue-400 border-blue-800",
      repaymentRatioPct,
      recommendationMr: "सामान्य परतफेड इतिहास. वेळेवर हप्ता स्मरणपत्र पाठवावे.",
      recommendationEn: "Stable repayment history. Regular reminders recommended.",
    };
  } else if (finalScore >= 50) {
    return {
      score: finalScore,
      grade: "B",
      riskLevel: "MODERATE",
      riskLabelMr: "मध्यम जोखीम (लक्ष द्यावे)",
      riskLabelEn: "Moderate Risk (Requires Attention)",
      badgeColor: "bg-amber-950/80 text-amber-400 border-amber-800",
      repaymentRatioPct,
      recommendationMr: "अधूनमधून विलंब. देय तारखेच्या २ दिवस आधी व्हाईस मेसेज पाठवा.",
      recommendationEn: "Occasional delays. Send proactive AI voice reminders 2 days prior.",
    };
  } else if (finalScore >= 35) {
    return {
      score: finalScore,
      grade: "C",
      riskLevel: "HIGH",
      riskLabelMr: "उच्च जोखीम (थकबाकी शक्यता)",
      riskLabelEn: "High Risk (Overdue Prone)",
      badgeColor: "bg-orange-950/80 text-orange-400 border-orange-800",
      repaymentRatioPct,
      recommendationMr: "वारंवार हप्ता थकतो. नवीन कर्ज देणे टाळावे व वसुली करावी.",
      recommendationEn: "Frequent missed dues. Restrict further lending and intensify follow-up.",
    };
  } else {
    return {
      score: finalScore,
      grade: "D",
      riskLevel: "CRITICAL",
      riskLabelMr: "अति-धोकादायक (डिफॉल्ट शक्यता)",
      riskLabelEn: "Critical Default Risk",
      badgeColor: "bg-red-950/80 text-red-400 border-red-800",
      repaymentRatioPct,
      recommendationMr: "तात्काळ कायदेशीर सूचना आणि वैयक्तिक वसुली भेट आवश्यक.",
      recommendationEn: "Urgent recovery visit and legal overdue notice required immediately.",
    };
  }
}
