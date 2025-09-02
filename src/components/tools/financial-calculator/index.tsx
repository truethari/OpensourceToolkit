"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Copy,
  Check,
  Target,
  Wallet,
  Download,
  Landmark,
  BarChart3,
  PiggyBank,
  Calculator,
  TrendingUp,
  DollarSign,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

interface MonthlyBreakdown {
  period: number;
  amount: number;
  interest: number;
}

interface LadderBreakdown {
  cd: number;
  amount: number;
  rate: number;
  maturity: number;
  years: number;
}

interface CalculationResult {
  type: string;
  principal: number;
  rate: number;
  time: number;
  compoundFrequency?: number;
  futureValue: number;
  totalInterest: number;
  monthlyPayment?: number;
  totalPayments?: number;
  schedule?: PaymentScheduleItem[];
  monthlyBreakdown?: MonthlyBreakdown[];
  ladderBreakdown?: LadderBreakdown[];
}

interface PaymentScheduleItem {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface ILadderBreakdown {
  cd: number;
  amount: number;
  rate: number;
  maturity: number;
  years: number;
}

export default function FinancialCalculator() {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [results, setResults] = useState<CalculationResult[]>([]);

  // Individual result states for each calculator
  const [fdResult, setFdResult] = useState<CalculationResult | null>(null);
  const [savingsResult, setSavingsResult] = useState<CalculationResult | null>(
    null,
  );
  const [cdLadderResult, setCdLadderResult] =
    useState<CalculationResult | null>(null);

  // Compound Interest States
  const [principal, setPrincipal] = useState("10000");
  const [annualRate, setAnnualRate] = useState("5");
  const [timeYears, setTimeYears] = useState("10");
  const [compoundFrequency, setCompoundFrequency] = useState("12");

  // Loan Calculator States
  const [loanAmount, setLoanAmount] = useState("250000");
  const [loanRate, setLoanRate] = useState("4.5");
  const [loanTermYears, setLoanTermYears] = useState("30");

  // Investment Calculator States
  const [initialInvestment, setInitialInvestment] = useState("5000");
  const [monthlyContribution, setMonthlyContribution] = useState("500");
  const [investmentRate, setInvestmentRate] = useState("7");
  const [investmentYears, setInvestmentYears] = useState("20");

  // APR/APY Calculator States
  const [nominalRate, setNominalRate] = useState("5");
  const [aprCompoundFreq, setAprCompoundFreq] = useState("12");

  // Fixed Deposit Calculator States
  const [fdAmount, setFdAmount] = useState("50000");
  const [fdRate, setFdRate] = useState("6.5");
  const [fdTenure, setFdTenure] = useState("12");
  const [fdTenureType, setFdTenureType] = useState("months");
  const [fdCompounding, setFdCompounding] = useState("quarterly");

  // Savings Account Calculator States
  const [savingsInitial, setSavingsInitial] = useState("10000");
  const [savingsMonthly, setSavingsMonthly] = useState("2000");
  const [savingsRate, setSavingsRate] = useState("4");
  const [savingsYears, setSavingsYears] = useState("5");

  // CD Ladder Calculator States
  const [cdTotalAmount, setCdTotalAmount] = useState("100000");
  const [cdLadderYears, setCdLadderYears] = useState("5");
  const [cdRateStart, setCdRateStart] = useState("4");
  const [cdRateEnd, setCdRateEnd] = useState("6");

  const calculateCompoundInterest = useCallback(() => {
    const P = parseFloat(principal) || 0;
    const r = (parseFloat(annualRate) || 0) / 100;
    const t = parseFloat(timeYears) || 0;
    const n = parseFloat(compoundFrequency) || 1;

    if (P <= 0 || r < 0 || t <= 0 || n <= 0) return;

    // A = P(1 + r/n)^(nt)
    const futureValue = P * Math.pow(1 + r / n, n * t);
    const totalInterest = futureValue - P;

    const result: CalculationResult = {
      type: "Compound Interest",
      principal: P,
      rate: r * 100,
      time: t,
      compoundFrequency: n,
      futureValue,
      totalInterest,
    };

    setResults((prev) => [result, ...prev.slice(0, 4)]);
  }, [principal, annualRate, timeYears, compoundFrequency]);

  const calculateLoan = useCallback(() => {
    const P = parseFloat(loanAmount) || 0;
    const r = (parseFloat(loanRate) || 0) / 100 / 12; // Monthly rate
    const n = (parseFloat(loanTermYears) || 0) * 12; // Total months

    if (P <= 0 || r < 0 || n <= 0) return;

    // M = P * [r(1 + r)^n] / [(1 + r)^n - 1]
    const monthlyPayment =
      (P * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
    const totalPayments = monthlyPayment * n;
    const totalInterest = totalPayments - P;

    // Generate payment schedule (first 12 months)
    const schedule: PaymentScheduleItem[] = [];
    let balance = P;

    for (let month = 1; month <= Math.min(12, n); month++) {
      const interestPayment = balance * r;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance,
      });
    }

    const result: CalculationResult = {
      type: "Loan Payment",
      principal: P,
      rate: parseFloat(loanRate),
      time: parseFloat(loanTermYears),
      futureValue: totalPayments,
      totalInterest,
      monthlyPayment,
      totalPayments,
      schedule,
    };

    setResults((prev) => [result, ...prev.slice(0, 4)]);
  }, [loanAmount, loanRate, loanTermYears]);

  const calculateInvestment = useCallback(() => {
    const P = parseFloat(initialInvestment) || 0;
    const PMT = parseFloat(monthlyContribution) || 0;
    const r = (parseFloat(investmentRate) || 0) / 100 / 12; // Monthly rate
    const t = (parseFloat(investmentYears) || 0) * 12; // Total months

    if (P < 0 || PMT < 0 || r < 0 || t <= 0) return;

    // Future value of initial investment: P(1 + r)^t
    const futureValueInitial = P * Math.pow(1 + r, t);

    // Future value of monthly contributions: PMT * [((1 + r)^t - 1) / r]
    const futureValueContributions = PMT * ((Math.pow(1 + r, t) - 1) / r);

    const totalFutureValue = futureValueInitial + futureValueContributions;
    const totalContributed = P + PMT * t;
    const totalInterest = totalFutureValue - totalContributed;

    const result: CalculationResult = {
      type: "Investment Growth",
      principal: totalContributed,
      rate: parseFloat(investmentRate),
      time: parseFloat(investmentYears),
      futureValue: totalFutureValue,
      totalInterest,
    };

    setResults((prev) => [result, ...prev.slice(0, 4)]);
  }, [initialInvestment, monthlyContribution, investmentRate, investmentYears]);

  const calculateAPY = useMemo(() => {
    const r = (parseFloat(nominalRate) || 0) / 100;
    const n = parseFloat(aprCompoundFreq) || 1;

    if (r <= 0 || n <= 0) return { apr: 0, apy: 0 };

    // APY = (1 + r/n)^n - 1
    const apy = Math.pow(1 + r / n, n) - 1;

    return {
      apr: r * 100,
      apy: apy * 100,
    };
  }, [nominalRate, aprCompoundFreq]);

  const calculateFixedDeposit = useCallback(() => {
    const P = parseFloat(fdAmount) || 0;
    const r = (parseFloat(fdRate) || 0) / 100;
    const t =
      fdTenureType === "months"
        ? (parseFloat(fdTenure) || 0) / 12
        : parseFloat(fdTenure) || 0;

    const compoundMap: { [key: string]: number } = {
      annually: 1,
      "semi-annually": 2,
      quarterly: 4,
      monthly: 12,
      daily: 365,
    };
    const n = compoundMap[fdCompounding] || 4;

    if (P <= 0 || r < 0 || t <= 0) return;

    // Compound Interest: A = P(1 + r/n)^(nt)
    const maturityAmount = P * Math.pow(1 + r / n, n * t);
    const interestEarned = maturityAmount - P;

    // Calculate monthly breakdown if tenure is more than 1 year
    const monthlyBreakdown = [];
    if (t >= 1) {
      for (let month = 3; month <= t * 12; month += 3) {
        const quarterlyTime = month / 12;
        const quarterlyAmount = P * Math.pow(1 + r / n, n * quarterlyTime);
        const quarterlyInterest = quarterlyAmount - P;
        monthlyBreakdown.push({
          period: month,
          amount: quarterlyAmount,
          interest: quarterlyInterest,
        });
      }
    }

    const result: CalculationResult = {
      type: "Fixed Deposit",
      principal: P,
      rate: r * 100,
      time: t,
      compoundFrequency: n,
      futureValue: maturityAmount,
      totalInterest: interestEarned,
      monthlyBreakdown,
    };

    setFdResult(result);
    setResults((prev) => [result, ...prev.slice(0, 4)]);
  }, [fdAmount, fdRate, fdTenure, fdTenureType, fdCompounding]);

  const calculateSavingsGrowth = useCallback(() => {
    const P = parseFloat(savingsInitial) || 0;
    const PMT = parseFloat(savingsMonthly) || 0;
    const r = (parseFloat(savingsRate) || 0) / 100 / 12; // Monthly rate
    const t = (parseFloat(savingsYears) || 0) * 12; // Total months

    if (P < 0 || PMT < 0 || r < 0 || t <= 0) return;

    // Future value of initial amount: P(1 + r)^t
    const futureValueInitial = P * Math.pow(1 + r, t);

    // Future value of monthly deposits: PMT * [((1 + r)^t - 1) / r]
    const futureValueDeposits =
      r > 0 ? PMT * ((Math.pow(1 + r, t) - 1) / r) : PMT * t;

    const totalFutureValue = futureValueInitial + futureValueDeposits;
    const totalDeposited = P + PMT * t;
    const totalInterest = totalFutureValue - totalDeposited;

    const result: CalculationResult = {
      type: "Savings Account Growth",
      principal: totalDeposited,
      rate: parseFloat(savingsRate),
      time: parseFloat(savingsYears),
      futureValue: totalFutureValue,
      totalInterest,
    };

    setSavingsResult(result);
    setResults((prev) => [result, ...prev.slice(0, 4)]);
  }, [savingsInitial, savingsMonthly, savingsRate, savingsYears]);

  const calculateCDLadder = useCallback(() => {
    const totalAmount = parseFloat(cdTotalAmount) || 0;
    const years = parseInt(cdLadderYears) || 5;
    const startRate = (parseFloat(cdRateStart) || 0) / 100;
    const endRate = (parseFloat(cdRateEnd) || 0) / 100;

    if (totalAmount <= 0 || years <= 0 || startRate < 0 || endRate < 0) return;

    const cdAmount = totalAmount / years;
    const rateIncrement = (endRate - startRate) / (years - 1);

    const ladderBreakdown: ILadderBreakdown[] = [];
    let totalMaturity = 0;

    for (let i = 0; i < years; i++) {
      const rate = startRate + rateIncrement * i;
      const maturity = cdAmount * Math.pow(1 + rate, years);
      totalMaturity += maturity;

      ladderBreakdown.push({
        cd: i + 1,
        amount: cdAmount,
        rate: rate * 100,
        maturity: maturity,
        years: years,
      });
    }

    const totalInterest = totalMaturity - totalAmount;

    const result: CalculationResult = {
      type: "CD Ladder Strategy",
      principal: totalAmount,
      rate: ((startRate + endRate) / 2) * 100,
      time: years,
      futureValue: totalMaturity,
      totalInterest,
      ladderBreakdown,
    };

    setCdLadderResult(result);
    setResults((prev) => [result, ...prev.slice(0, 4)]);
  }, [cdTotalAmount, cdLadderYears, cdRateStart, cdRateEnd]);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(key);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (rate: number) => {
    return `${rate.toFixed(2)}%`;
  };

  const ResultCard = ({
    result,
    resultType,
  }: {
    result: CalculationResult | null;
    resultType: string;
  }) => {
    if (!result) return null;

    return (
      <div className="mt-4 rounded-lg border bg-muted/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold text-green-600 dark:text-green-400">
            {result.type} Result
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              copyToClipboard(
                `${result.type}: Future Value: ${formatCurrency(result.futureValue)}, Interest: ${formatCurrency(result.totalInterest)}`,
                `${resultType}-result`,
              )
            }
          >
            {copiedIndex === `${resultType}-result` ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <div className="text-sm text-muted-foreground">Principal</div>
            <div className="font-medium">
              {formatCurrency(result.principal)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Rate</div>
            <div className="font-medium">{formatPercent(result.rate)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Time</div>
            <div className="font-medium">{result.time} years</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Future Value</div>
            <div className="font-medium text-green-600 dark:text-green-400">
              {formatCurrency(result.futureValue)}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div>
            <div className="text-sm text-muted-foreground">
              Total Interest Earned
            </div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(result.totalInterest)}
            </div>
          </div>
        </div>

        {/* Fixed Deposit breakdown */}
        {result.monthlyBreakdown && result.monthlyBreakdown.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-sm font-medium">
              Growth Timeline (Quarterly)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left">Quarter</th>
                    <th className="text-right">Months</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Interest</th>
                  </tr>
                </thead>
                <tbody>
                  {result.monthlyBreakdown
                    .slice(0, 6)
                    .map((breakdown: MonthlyBreakdown, idx: number) => (
                      <tr key={idx} className="border-b">
                        <td>Q{Math.ceil(breakdown.period / 3)}</td>
                        <td className="text-right">{breakdown.period}</td>
                        <td className="text-right">
                          {formatCurrency(breakdown.amount)}
                        </td>
                        <td className="text-right text-green-600 dark:text-green-400">
                          {formatCurrency(breakdown.interest)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CD Ladder breakdown */}
        {result.ladderBreakdown && result.ladderBreakdown.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-sm font-medium">CD Ladder Breakdown</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left">CD #</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Rate</th>
                    <th className="text-right">Term</th>
                    <th className="text-right">Maturity Value</th>
                  </tr>
                </thead>
                <tbody>
                  {result.ladderBreakdown.map((cd: LadderBreakdown) => (
                    <tr key={cd.cd} className="border-b">
                      <td>CD {cd.cd}</td>
                      <td className="text-right">
                        {formatCurrency(cd.amount)}
                      </td>
                      <td className="text-right">{formatPercent(cd.rate)}</td>
                      <td className="text-right">{cd.years} years</td>
                      <td className="text-right text-green-600 dark:text-green-400">
                        {formatCurrency(cd.maturity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const exportResults = useCallback(() => {
    if (results.length === 0) return;

    const csvContent = results
      .map((result) => {
        const baseData = [
          result.type,
          result.principal.toFixed(2),
          result.rate.toFixed(2),
          result.time.toString(),
          result.futureValue.toFixed(2),
          result.totalInterest.toFixed(2),
        ];

        if (result.monthlyPayment) {
          baseData.push(result.monthlyPayment.toFixed(2));
        }

        return baseData.join(",");
      })
      .join("\n");

    const headers =
      "Type,Principal,Rate (%),Time (Years),Future Value,Total Interest,Monthly Payment\n";
    const blob = new Blob([headers + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "financial_calculations.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Financial Calculator</h1>
        <p className="text-muted-foreground">
          Calculate compound interest, loans, investments, and other financial
          metrics
        </p>
      </div>

      <Tabs defaultValue="compound" className="w-full">
        <div className="flex flex-col gap-2">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="compound">Compound Interest</TabsTrigger>
            <TabsTrigger value="loan">Loan Calculator</TabsTrigger>
            <TabsTrigger value="investment" className="hidden md:block">
              Investment
            </TabsTrigger>
            <TabsTrigger value="deposits" className="hidden md:block">
              Deposits & Savings
            </TabsTrigger>
          </TabsList>

          <TabsList className="grid w-full grid-cols-2 md:hidden">
            <TabsTrigger value="investment">Investment</TabsTrigger>
            <TabsTrigger value="deposits">Deposits & Savings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="compound">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Compound Interest Calculator
              </CardTitle>
              <CardDescription>
                Calculate the future value of an investment with compound
                interest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="principal">Principal Amount ($)</Label>
                  <Input
                    id="principal"
                    type="number"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    placeholder="Initial investment"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Annual Interest Rate (%)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(e.target.value)}
                    placeholder="Interest rate"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time Period (Years)</Label>
                  <Input
                    id="time"
                    type="number"
                    value={timeYears}
                    onChange={(e) => setTimeYears(e.target.value)}
                    placeholder="Investment period"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compound">Compound Frequency</Label>
                  <Select
                    value={compoundFrequency}
                    onValueChange={setCompoundFrequency}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Annually</SelectItem>
                      <SelectItem value="2">Semi-annually</SelectItem>
                      <SelectItem value="4">Quarterly</SelectItem>
                      <SelectItem value="12">Monthly</SelectItem>
                      <SelectItem value="365">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={calculateCompoundInterest} className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Compound Interest
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loan">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Loan & Mortgage Calculator
              </CardTitle>
              <CardDescription>
                Calculate monthly payments and total interest for loans
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="loanAmount">Loan Amount ($)</Label>
                  <Input
                    id="loanAmount"
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="Loan principal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loanRate">Annual Interest Rate (%)</Label>
                  <Input
                    id="loanRate"
                    type="number"
                    step="0.01"
                    value={loanRate}
                    onChange={(e) => setLoanRate(e.target.value)}
                    placeholder="Interest rate"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loanTerm">Loan Term (Years)</Label>
                  <Input
                    id="loanTerm"
                    type="number"
                    value={loanTermYears}
                    onChange={(e) => setLoanTermYears(e.target.value)}
                    placeholder="Loan period"
                  />
                </div>
              </div>
              <Button onClick={calculateLoan} className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Loan Payment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Investment Growth Calculator
              </CardTitle>
              <CardDescription>
                Calculate future value with regular contributions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="initialInvestment">
                    Initial Investment ($)
                  </Label>
                  <Input
                    id="initialInvestment"
                    type="number"
                    value={initialInvestment}
                    onChange={(e) => setInitialInvestment(e.target.value)}
                    placeholder="Starting amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyContribution">
                    Monthly Contribution ($)
                  </Label>
                  <Input
                    id="monthlyContribution"
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    placeholder="Regular contribution"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investmentRate">Annual Return Rate (%)</Label>
                  <Input
                    id="investmentRate"
                    type="number"
                    step="0.01"
                    value={investmentRate}
                    onChange={(e) => setInvestmentRate(e.target.value)}
                    placeholder="Expected return"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investmentYears">
                    Investment Period (Years)
                  </Label>
                  <Input
                    id="investmentYears"
                    type="number"
                    value={investmentYears}
                    onChange={(e) => setInvestmentYears(e.target.value)}
                    placeholder="Time horizon"
                  />
                </div>
              </div>
              <Button onClick={calculateInvestment} className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Investment Growth
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits">
          <div className="space-y-6">
            {/* Fixed Deposit Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="h-5 w-5" />
                  Fixed Deposit Calculator
                </CardTitle>
                <CardDescription>
                  Calculate maturity amount and interest for fixed deposits
                  (FD/CDs)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="fdAmount">Deposit Amount ($)</Label>
                    <Input
                      id="fdAmount"
                      type="number"
                      value={fdAmount}
                      onChange={(e) => setFdAmount(e.target.value)}
                      placeholder="Principal amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fdRate">Annual Interest Rate (%)</Label>
                    <Input
                      id="fdRate"
                      type="number"
                      step="0.01"
                      value={fdRate}
                      onChange={(e) => setFdRate(e.target.value)}
                      placeholder="Interest rate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fdCompounding">Compounding</Label>
                    <Select
                      value={fdCompounding}
                      onValueChange={setFdCompounding}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annually">Annually</SelectItem>
                        <SelectItem value="semi-annually">
                          Semi-annually
                        </SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fdTenure">Tenure</Label>
                    <Input
                      id="fdTenure"
                      type="number"
                      value={fdTenure}
                      onChange={(e) => setFdTenure(e.target.value)}
                      placeholder="Time period"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fdTenureType">Tenure Type</Label>
                    <Select
                      value={fdTenureType}
                      onValueChange={setFdTenureType}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={calculateFixedDeposit} className="w-full">
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate Fixed Deposit Maturity
                </Button>
                <ResultCard result={fdResult} resultType="fd" />
              </CardContent>
            </Card>

            {/* Savings Account Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Savings Account Growth
                </CardTitle>
                <CardDescription>
                  Calculate savings growth with regular monthly deposits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="savingsInitial">Initial Balance ($)</Label>
                    <Input
                      id="savingsInitial"
                      type="number"
                      value={savingsInitial}
                      onChange={(e) => setSavingsInitial(e.target.value)}
                      placeholder="Starting amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="savingsMonthly">Monthly Deposit ($)</Label>
                    <Input
                      id="savingsMonthly"
                      type="number"
                      value={savingsMonthly}
                      onChange={(e) => setSavingsMonthly(e.target.value)}
                      placeholder="Regular monthly deposit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="savingsRate">
                      Annual Interest Rate (%)
                    </Label>
                    <Input
                      id="savingsRate"
                      type="number"
                      step="0.01"
                      value={savingsRate}
                      onChange={(e) => setSavingsRate(e.target.value)}
                      placeholder="Interest rate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="savingsYears">Time Period (Years)</Label>
                    <Input
                      id="savingsYears"
                      type="number"
                      value={savingsYears}
                      onChange={(e) => setSavingsYears(e.target.value)}
                      placeholder="Savings period"
                    />
                  </div>
                </div>
                <Button onClick={calculateSavingsGrowth} className="w-full">
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate Savings Growth
                </Button>
                <ResultCard result={savingsResult} resultType="savings" />
              </CardContent>
            </Card>

            {/* CD Ladder Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  CD Ladder Strategy
                </CardTitle>
                <CardDescription>
                  Calculate returns from a Certificate of Deposit ladder
                  strategy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cdTotalAmount">Total Investment ($)</Label>
                    <Input
                      id="cdTotalAmount"
                      type="number"
                      value={cdTotalAmount}
                      onChange={(e) => setCdTotalAmount(e.target.value)}
                      placeholder="Total amount to invest"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cdLadderYears">Ladder Length (Years)</Label>
                    <Input
                      id="cdLadderYears"
                      type="number"
                      value={cdLadderYears}
                      onChange={(e) => setCdLadderYears(e.target.value)}
                      placeholder="Number of CDs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cdRateStart">Starting Rate (%)</Label>
                    <Input
                      id="cdRateStart"
                      type="number"
                      step="0.01"
                      value={cdRateStart}
                      onChange={(e) => setCdRateStart(e.target.value)}
                      placeholder="Short-term rate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cdRateEnd">Ending Rate (%)</Label>
                    <Input
                      id="cdRateEnd"
                      type="number"
                      step="0.01"
                      value={cdRateEnd}
                      onChange={(e) => setCdRateEnd(e.target.value)}
                      placeholder="Long-term rate"
                    />
                  </div>
                </div>
                <Button onClick={calculateCDLadder} className="w-full">
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate CD Ladder Returns
                </Button>
                <ResultCard result={cdLadderResult} resultType="cdladder" />
              </CardContent>
            </Card>

            {/* APR/APY Converter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  APR to APY Converter
                </CardTitle>
                <CardDescription>
                  Compare quoted rates with effective annual yield
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nominalRate">Nominal Rate (APR) (%)</Label>
                    <Input
                      id="nominalRate"
                      type="number"
                      step="0.01"
                      value={nominalRate}
                      onChange={(e) => setNominalRate(e.target.value)}
                      placeholder="Quoted interest rate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aprCompoundFreq">
                      Compounding Frequency
                    </Label>
                    <Select
                      value={aprCompoundFreq}
                      onValueChange={setAprCompoundFreq}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Annually</SelectItem>
                        <SelectItem value="2">Semi-annually</SelectItem>
                        <SelectItem value="4">Quarterly</SelectItem>
                        <SelectItem value="12">Monthly</SelectItem>
                        <SelectItem value="365">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-muted p-4">
                    <div className="text-sm text-muted-foreground">
                      APR (Nominal Rate)
                    </div>
                    <div className="text-2xl font-bold">
                      {formatPercent(calculateAPY.apr)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Quoted rate before compounding
                    </div>
                  </div>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                    <div className="text-sm text-muted-foreground">
                      APY (Effective Rate)
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatPercent(calculateAPY.apy)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Actual annual return with compounding
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {results.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>📊 Session Summary</CardTitle>
              <CardDescription>
                {results.length} calculation{results.length > 1 ? "s" : ""}{" "}
                performed this session
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportResults}>
              <Download className="mr-2 h-4 w-4" />
              Export All Results
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">{result.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(result.principal)} →{" "}
                      {formatCurrency(result.futureValue)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                    +{formatCurrency(result.totalInterest)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Financial Calculation Formulas & Tips</CardTitle>
          <CardDescription>
            Understanding the math behind your financial calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-semibold">
                <PiggyBank className="h-4 w-4" />
                Compound Interest
              </h4>
              <p className="text-sm text-muted-foreground">
                A = P(1 + r/n)^(nt)
                <br />
                Where A = final amount, P = principal, r = annual rate, n =
                compound frequency, t = time
              </p>
            </div>
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-semibold">
                <DollarSign className="h-4 w-4" />
                Loan Payment
              </h4>
              <p className="text-sm text-muted-foreground">
                M = P × [r(1 + r)^n] / [(1 + r)^n - 1]
                <br />
                Where M = monthly payment, P = principal, r = monthly rate, n =
                total payments
              </p>
            </div>
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-semibold">
                <Target className="h-4 w-4" />
                APY Conversion
              </h4>
              <p className="text-sm text-muted-foreground">
                APY = (1 + r/n)^n - 1<br />
                Where r = nominal rate, n = compounding periods per year
              </p>
            </div>
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-semibold">
                <TrendingUp className="h-4 w-4" />
                Investment Growth
              </h4>
              <p className="text-sm text-muted-foreground">
                FV = PV(1+r)^t + PMT×[((1+r)^t-1)/r]
                <br />
                Where FV = future value, PV = present value, PMT = payment, r =
                rate, t = time
              </p>
            </div>
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-semibold">
                <Landmark className="h-4 w-4" />
                Fixed Deposits
              </h4>
              <p className="text-sm text-muted-foreground">
                Same as compound interest but typically with fixed terms and
                rates.
                <br />
                Consider tax implications and early withdrawal penalties.
              </p>
            </div>
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-semibold">
                <BarChart3 className="h-4 w-4" />
                CD Laddering
              </h4>
              <p className="text-sm text-muted-foreground">
                Strategy to maximize returns while maintaining liquidity.
                <br />
                Divide investment across multiple CDs with staggered maturity
                dates.
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="mb-3 font-semibold">💡 Financial Tips</h4>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
                <h5 className="font-medium text-blue-900 dark:text-blue-100">
                  Compare APY, not APR
                </h5>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  APY shows the real return including compounding effects.
                  Always compare APY when choosing savings accounts or CDs.
                </p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                <h5 className="font-medium text-green-900 dark:text-green-100">
                  Emergency Fund First
                </h5>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Keep 3-6 months of expenses in a high-yield savings account
                  before investing in longer-term products.
                </p>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950">
                <h5 className="font-medium text-purple-900 dark:text-purple-100">
                  Ladder Strategy Benefits
                </h5>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  CD laddering provides regular liquidity while potentially
                  earning higher rates than short-term CDs.
                </p>
              </div>
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950">
                <h5 className="font-medium text-orange-900 dark:text-orange-100">
                  Inflation Consideration
                </h5>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Ensure your returns exceed inflation rate to maintain
                  purchasing power over time.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
