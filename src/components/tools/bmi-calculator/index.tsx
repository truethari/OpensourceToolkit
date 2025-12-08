"use client";

import { toast } from "sonner";
import React, { useState, useCallback, useMemo } from "react";
import {
  Copy,
  Download,
  Activity,
  TrendingUp,
  Heart,
  Scale,
  Target,
  Info,
  Trash2,
  Calculator,
  Ruler,
} from "lucide-react";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

interface BMIResult {
  bmi: number;
  category: string;
  categoryColor: string;
  healthRisk: string;
  idealWeightMin: number;
  idealWeightMax: number;
  weightToLose: number;
  weightToGain: number;
}

interface BMRResult {
  bmr: number;
  tdee: {
    sedentary: number;
    light: number;
    moderate: number;
    active: number;
    veryActive: number;
  };
}

interface BodyComposition {
  bodyFatPercentage: number;
  leanBodyMass: number;
  fatMass: number;
  waistToHipRatio?: number;
  waistToHeightRatio?: number;
}

interface BMIHistory {
  date: string;
  bmi: number;
  weight: number;
  height: number;
}

type UnitSystem = "metric" | "imperial";
type Gender = "male" | "female";
type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "veryActive";

export default function BMICalculator() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState(30);

  // Metric units
  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(170);
  const [waistCm, setWaistCm] = useState(85);
  const [hipCm, setHipCm] = useState(95);
  const [neckCm, setNeckCm] = useState(37);

  // Imperial units
  const [weightLbs, setWeightLbs] = useState(154);
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(7);
  const [waistIn, setWaistIn] = useState(33);
  const [hipIn, setHipIn] = useState(37);
  const [neckIn, setNeckIn] = useState(15);

  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [targetWeight, setTargetWeight] = useState(65);
  const [history, setHistory] = useState<BMIHistory[]>([]);

  // Conversion helpers
  const lbsToKg = (lbs: number) => lbs * 0.453592;
  const kgToLbs = (kg: number) => kg / 0.453592;
  const inchesToCm = (inches: number) => inches * 2.54;
  const cmToInches = (cm: number) => cm / 2.54;

  // Get weight and height in metric units
  const weightInKg = useMemo(() => {
    return unitSystem === "metric" ? weightKg : lbsToKg(weightLbs);
  }, [unitSystem, weightKg, weightLbs]);

  const heightInCm = useMemo(() => {
    return unitSystem === "metric"
      ? heightCm
      : inchesToCm(heightFt * 12 + heightIn);
  }, [unitSystem, heightCm, heightFt, heightIn]);

  const waistInCm = useMemo(() => {
    return unitSystem === "metric" ? waistCm : inchesToCm(waistIn);
  }, [unitSystem, waistCm, waistIn]);

  const hipInCm = useMemo(() => {
    return unitSystem === "metric" ? hipCm : inchesToCm(hipIn);
  }, [unitSystem, hipCm, hipIn]);

  const neckInCm = useMemo(() => {
    return unitSystem === "metric" ? neckCm : inchesToCm(neckIn);
  }, [unitSystem, neckCm, neckIn]);

  // Calculate BMI
  const calculateBMI = useCallback((): BMIResult | null => {
    if (weightInKg <= 0 || heightInCm <= 0) return null;

    const heightInM = heightInCm / 100;
    const bmi = weightInKg / (heightInM * heightInM);

    let category = "";
    let categoryColor = "";
    let healthRisk = "";

    if (bmi < 16) {
      category = "Severe Underweight";
      categoryColor = "bg-red-600";
      healthRisk = "Very High - Severe malnutrition risk";
    } else if (bmi < 17) {
      category = "Moderate Underweight";
      categoryColor = "bg-red-500";
      healthRisk = "High - Malnutrition risk";
    } else if (bmi < 18.5) {
      category = "Mild Underweight";
      categoryColor = "bg-orange-500";
      healthRisk = "Moderate - Minor health risks";
    } else if (bmi < 25) {
      category = "Normal Weight";
      categoryColor = "bg-green-500";
      healthRisk = "Low - Healthy range";
    } else if (bmi < 30) {
      category = "Overweight";
      categoryColor = "bg-yellow-500";
      healthRisk = "Moderate - Pre-obesity";
    } else if (bmi < 35) {
      category = "Obese Class I";
      categoryColor = "bg-orange-600";
      healthRisk = "High - Obesity-related diseases";
    } else if (bmi < 40) {
      category = "Obese Class II";
      categoryColor = "bg-red-600";
      healthRisk = "Very High - Severe obesity";
    } else {
      category = "Obese Class III";
      categoryColor = "bg-red-700";
      healthRisk = "Extremely High - Morbid obesity";
    }

    // Calculate ideal weight range (BMI 18.5-24.9)
    const idealWeightMin = 18.5 * heightInM * heightInM;
    const idealWeightMax = 24.9 * heightInM * heightInM;

    const weightToLose = Math.max(0, weightInKg - idealWeightMax);
    const weightToGain = Math.max(0, idealWeightMin - weightInKg);

    return {
      bmi,
      category,
      categoryColor,
      healthRisk,
      idealWeightMin,
      idealWeightMax,
      weightToLose,
      weightToGain,
    };
  }, [weightInKg, heightInCm]);

  // Calculate BMR using Mifflin-St Jeor Equation
  const calculateBMR = useCallback((): BMRResult | null => {
    if (weightInKg <= 0 || heightInCm <= 0 || age <= 0) return null;

    // Mifflin-St Jeor Equation
    let bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age;
    if (gender === "male") {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    // Calculate TDEE based on activity levels
    const activityMultipliers = {
      sedentary: 1.2, // Little or no exercise
      light: 1.375, // Light exercise 1-3 days/week
      moderate: 1.55, // Moderate exercise 3-5 days/week
      active: 1.725, // Hard exercise 6-7 days/week
      veryActive: 1.9, // Very hard exercise, physical job
    };

    const tdee = {
      sedentary: bmr * activityMultipliers.sedentary,
      light: bmr * activityMultipliers.light,
      moderate: bmr * activityMultipliers.moderate,
      active: bmr * activityMultipliers.active,
      veryActive: bmr * activityMultipliers.veryActive,
    };

    return { bmr, tdee };
  }, [weightInKg, heightInCm, age, gender]);

  // Estimate body fat percentage using Navy Method (simplified)
  const calculateBodyComposition = useCallback((): BodyComposition | null => {
    if (heightInCm <= 0 || waistInCm <= 0) return null;

    let bodyFatPercentage = 0;

    if (gender === "male" && neckInCm > 0) {
      // Navy Method for men
      bodyFatPercentage =
        495 /
          (1.0324 -
            0.19077 * Math.log10(waistInCm - neckInCm) +
            0.15456 * Math.log10(heightInCm)) -
        450;
    } else if (gender === "female" && neckInCm > 0 && hipInCm > 0) {
      // Navy Method for women
      bodyFatPercentage =
        495 /
          (1.29579 -
            0.35004 * Math.log10(waistInCm + hipInCm - neckInCm) +
            0.221 * Math.log10(heightInCm)) -
        450;
    } else {
      // Simplified estimation if measurements are missing
      const bmiResult = calculateBMI();
      if (!bmiResult) return null;

      // Very rough estimation based on BMI and gender
      if (gender === "male") {
        bodyFatPercentage = 1.2 * bmiResult.bmi + 0.23 * age - 16.2;
      } else {
        bodyFatPercentage = 1.2 * bmiResult.bmi + 0.23 * age - 5.4;
      }
    }

    bodyFatPercentage = Math.max(0, Math.min(100, bodyFatPercentage));

    const fatMass = weightInKg * (bodyFatPercentage / 100);
    const leanBodyMass = weightInKg - fatMass;

    const waistToHipRatio = hipInCm > 0 ? waistInCm / hipInCm : undefined;
    const waistToHeightRatio = waistInCm / heightInCm;

    return {
      bodyFatPercentage,
      leanBodyMass,
      fatMass,
      waistToHipRatio,
      waistToHeightRatio,
    };
  }, [
    heightInCm,
    waistInCm,
    hipInCm,
    neckInCm,
    gender,
    weightInKg,
    age,
    calculateBMI,
  ]);

  // Calculate ideal weight using multiple formulas
  const calculateIdealWeightFormulas = useCallback(() => {
    if (heightInCm <= 0) return null;

    const heightInInches = cmToInches(heightInCm);
    const baseHeight = 60; // 5 feet

    let devine = 0;
    let hamwi = 0;
    let robinson = 0;
    let miller = 0;

    if (gender === "male") {
      devine = 50 + 2.3 * (heightInInches - baseHeight);
      hamwi = 48 + 2.7 * (heightInInches - baseHeight);
      robinson = 52 + 1.9 * (heightInInches - baseHeight);
      miller = 56.2 + 1.41 * (heightInInches - baseHeight);
    } else {
      devine = 45.5 + 2.3 * (heightInInches - baseHeight);
      hamwi = 45.5 + 2.2 * (heightInInches - baseHeight);
      robinson = 49 + 1.7 * (heightInInches - baseHeight);
      miller = 53.1 + 1.36 * (heightInInches - baseHeight);
    }

    return { devine, hamwi, robinson, miller };
  }, [heightInCm, gender]);

  // Calculate weight goals
  const calculateWeightGoals = useCallback(() => {
    if (weightInKg <= 0 || targetWeight <= 0) return null;

    const difference = weightInKg - targetWeight;
    const isLosing = difference > 0;

    // Safe weight change rates (kg per week)
    const conservativeRate = 0.25; // ~0.5 lbs
    const moderateRate = 0.5; // ~1 lb
    const aggressiveRate = 1; // ~2 lbs

    const weeksConservative = Math.abs(difference) / conservativeRate;
    const weeksModerate = Math.abs(difference) / moderateRate;
    const weeksAggressive = Math.abs(difference) / aggressiveRate;

    // Calculate calorie deficit/surplus needed
    const caloriesPerKg = 7700; // Approximate calories in 1 kg of body fat
    const totalCalories = Math.abs(difference) * caloriesPerKg;

    const dailyCaloriesConservative = (conservativeRate * caloriesPerKg) / 7;
    const dailyCaloriesModerate = (moderateRate * caloriesPerKg) / 7;
    const dailyCaloriesAggressive = (aggressiveRate * caloriesPerKg) / 7;

    return {
      difference,
      isLosing,
      totalCalories,
      conservative: {
        weeks: weeksConservative,
        months: weeksConservative / 4.33,
        dailyCalories: dailyCaloriesConservative,
      },
      moderate: {
        weeks: weeksModerate,
        months: weeksModerate / 4.33,
        dailyCalories: dailyCaloriesModerate,
      },
      aggressive: {
        weeks: weeksAggressive,
        months: weeksAggressive / 4.33,
        dailyCalories: dailyCaloriesAggressive,
      },
    };
  }, [weightInKg, targetWeight]);

  const bmiResult = calculateBMI();
  const bmrResult = calculateBMR();
  const bodyComposition = calculateBodyComposition();
  const idealWeightFormulas = calculateIdealWeightFormulas();
  const weightGoals = calculateWeightGoals();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy to clipboard");
    }
  };

  const addToHistory = () => {
    if (!bmiResult) {
      toast.error("Calculate BMI first");
      return;
    }

    const entry: BMIHistory = {
      date: new Date().toISOString(),
      bmi: bmiResult.bmi,
      weight: weightInKg,
      height: heightInCm,
    };

    setHistory([entry, ...history]);
    toast.success("Added to history");
  };

  const clearHistory = () => {
    setHistory([]);
    toast.success("History cleared");
  };

  const exportResults = () => {
    const data = {
      personal: {
        age,
        gender,
        unitSystem,
      },
      measurements: {
        weight: weightInKg,
        height: heightInCm,
        waist: waistInCm,
        hip: hipInCm,
        neck: neckInCm,
      },
      bmi: bmiResult,
      bmr: bmrResult,
      bodyComposition,
      idealWeightFormulas,
      weightGoals,
      activityLevel,
      history,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bmi-calculator-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported successfully");
  };

  const getActivityLevelDescription = (level: ActivityLevel) => {
    const descriptions = {
      sedentary: "Little or no exercise",
      light: "Light exercise 1-3 days/week",
      moderate: "Moderate exercise 3-5 days/week",
      active: "Hard exercise 6-7 days/week",
      veryActive: "Very hard exercise, physical job",
    };
    return descriptions[level];
  };

  const getBMIGaugePosition = (bmi: number) => {
    // Map BMI to percentage position (16-40 range mapped to 0-100%)
    const minBMI = 16;
    const maxBMI = 40;
    const percentage = ((bmi - minBMI) / (maxBMI - minBMI)) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  return (
    <ToolsWrapper>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 text-white">
          <Activity className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
          BMI Calculator
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Comprehensive body metrics, health analysis, and weight goals
        </p>
      </div>

      <div className="mb-6 flex justify-center gap-4">
        <Select
          value={unitSystem}
          onValueChange={(v) => setUnitSystem(v as UnitSystem)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="metric">Metric (kg/cm)</SelectItem>
            <SelectItem value="imperial">Imperial (lbs/ft)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Body Measurements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  value={age || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAge(val === "" ? 0 : parseInt(val));
                  }}
                />
              </div>

              {unitSystem === "metric" ? (
                <>
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="1"
                      step="0.1"
                      value={weightKg || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWeightKg(val === "" ? 0 : parseFloat(val));
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="1"
                      step="0.1"
                      value={heightCm || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHeightCm(val === "" ? 0 : parseFloat(val));
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="waist">Waist (cm) - Optional</Label>
                    <Input
                      id="waist"
                      type="number"
                      min="1"
                      step="0.1"
                      value={waistCm || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWaistCm(val === "" ? 0 : parseFloat(val));
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="hip">Hip (cm) - Optional</Label>
                    <Input
                      id="hip"
                      type="number"
                      min="1"
                      step="0.1"
                      value={hipCm || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHipCm(val === "" ? 0 : parseFloat(val));
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="neck">Neck (cm) - Optional</Label>
                    <Input
                      id="neck"
                      type="number"
                      min="1"
                      step="0.1"
                      value={neckCm || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNeckCm(val === "" ? 0 : parseFloat(val));
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="weight-lbs">Weight (lbs)</Label>
                    <Input
                      id="weight-lbs"
                      type="number"
                      min="1"
                      step="0.1"
                      value={weightLbs || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWeightLbs(val === "" ? 0 : parseFloat(val));
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="height-ft">Height (ft)</Label>
                      <Input
                        id="height-ft"
                        type="number"
                        min="1"
                        max="8"
                        value={heightFt || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHeightFt(val === "" ? 0 : parseInt(val));
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="height-in">Height (in)</Label>
                      <Input
                        id="height-in"
                        type="number"
                        min="0"
                        max="11"
                        value={heightIn === 0 ? "" : heightIn}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHeightIn(val === "" ? 0 : parseInt(val));
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="waist-in">Waist (inches) - Optional</Label>
                    <Input
                      id="waist-in"
                      type="number"
                      min="1"
                      step="0.1"
                      value={waistIn || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWaistIn(val === "" ? 0 : parseFloat(val));
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="hip-in">Hip (inches) - Optional</Label>
                    <Input
                      id="hip-in"
                      type="number"
                      min="1"
                      step="0.1"
                      value={hipIn || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHipIn(val === "" ? 0 : parseFloat(val));
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="neck-in">Neck (inches) - Optional</Label>
                    <Input
                      id="neck-in"
                      type="number"
                      min="1"
                      step="0.1"
                      value={neckIn || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNeckIn(val === "" ? 0 : parseFloat(val));
                      }}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={addToHistory}
                  variant="outline"
                  className="flex-1"
                >
                  Add to History
                </Button>
                <Button onClick={exportResults} variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="bmi" className="w-full">
            <TabsList className="hidden w-full grid-cols-2 md:grid md:grid-cols-5">
              <TabsTrigger value="bmi">BMI</TabsTrigger>
              <TabsTrigger value="metabolism">Metabolism</TabsTrigger>
              <TabsTrigger value="composition">Composition</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <div className="flex flex-col gap-2 md:hidden">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="bmi">BMI</TabsTrigger>
                <TabsTrigger value="metabolism">Metabolism</TabsTrigger>
                <TabsTrigger value="composition">Composition</TabsTrigger>
              </TabsList>

              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="bmi" className="space-y-4">
              {bmiResult ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>BMI Results</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center">
                        <div className="mb-2 text-6xl font-bold text-gray-900 dark:text-white">
                          {bmiResult.bmi.toFixed(1)}
                        </div>
                        <Badge
                          className={`${bmiResult.categoryColor} text-white`}
                        >
                          {bmiResult.category}
                        </Badge>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {bmiResult.healthRisk}
                        </p>
                      </div>

                      {/* BMI Gauge */}
                      <div className="space-y-2">
                        <div className="relative h-8 w-full rounded-lg bg-gradient-to-r from-red-500 via-green-500 via-yellow-500 to-red-500">
                          <div
                            className="absolute top-0 h-full w-1 border-2 border-gray-900 bg-white"
                            style={{
                              left: `${getBMIGaugePosition(bmiResult.bmi)}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>16</span>
                          <span>18.5</span>
                          <span>25</span>
                          <span>30</span>
                          <span>35</span>
                          <span>40</span>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                          <div className="text-sm text-blue-600 dark:text-blue-400">
                            Ideal Weight Range
                          </div>
                          <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                            {unitSystem === "metric"
                              ? `${bmiResult.idealWeightMin.toFixed(1)} - ${bmiResult.idealWeightMax.toFixed(1)} kg`
                              : `${kgToLbs(bmiResult.idealWeightMin).toFixed(1)} - ${kgToLbs(bmiResult.idealWeightMax).toFixed(1)} lbs`}
                          </div>
                        </div>

                        {bmiResult.weightToLose > 0 && (
                          <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
                            <div className="text-sm text-orange-600 dark:text-orange-400">
                              To Reach Ideal Range
                            </div>
                            <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
                              Lose{" "}
                              {unitSystem === "metric"
                                ? `${bmiResult.weightToLose.toFixed(1)} kg`
                                : `${kgToLbs(bmiResult.weightToLose).toFixed(1)} lbs`}
                            </div>
                          </div>
                        )}

                        {bmiResult.weightToGain > 0 && (
                          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                            <div className="text-sm text-green-600 dark:text-green-400">
                              To Reach Ideal Range
                            </div>
                            <div className="text-xl font-bold text-green-700 dark:text-green-300">
                              Gain{" "}
                              {unitSystem === "metric"
                                ? `${bmiResult.weightToGain.toFixed(1)} kg`
                                : `${kgToLbs(bmiResult.weightToGain).toFixed(1)} lbs`}
                            </div>
                          </div>
                        )}
                      </div>

                      {idealWeightFormulas && (
                        <div className="mt-4 space-y-2">
                          <Label>Ideal Weight (Various Formulas)</Label>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="rounded bg-gray-100 p-2 dark:bg-gray-800">
                              <span className="text-gray-600 dark:text-gray-400">
                                Devine:{" "}
                              </span>
                              <span className="font-medium">
                                {unitSystem === "metric"
                                  ? `${idealWeightFormulas.devine.toFixed(1)} kg`
                                  : `${kgToLbs(idealWeightFormulas.devine).toFixed(1)} lbs`}
                              </span>
                            </div>
                            <div className="rounded bg-gray-100 p-2 dark:bg-gray-800">
                              <span className="text-gray-600 dark:text-gray-400">
                                Hamwi:{" "}
                              </span>
                              <span className="font-medium">
                                {unitSystem === "metric"
                                  ? `${idealWeightFormulas.hamwi.toFixed(1)} kg`
                                  : `${kgToLbs(idealWeightFormulas.hamwi).toFixed(1)} lbs`}
                              </span>
                            </div>
                            <div className="rounded bg-gray-100 p-2 dark:bg-gray-800">
                              <span className="text-gray-600 dark:text-gray-400">
                                Robinson:{" "}
                              </span>
                              <span className="font-medium">
                                {unitSystem === "metric"
                                  ? `${idealWeightFormulas.robinson.toFixed(1)} kg`
                                  : `${kgToLbs(idealWeightFormulas.robinson).toFixed(1)} lbs`}
                              </span>
                            </div>
                            <div className="rounded bg-gray-100 p-2 dark:bg-gray-800">
                              <span className="text-gray-600 dark:text-gray-400">
                                Miller:{" "}
                              </span>
                              <span className="font-medium">
                                {unitSystem === "metric"
                                  ? `${idealWeightFormulas.miller.toFixed(1)} kg`
                                  : `${kgToLbs(idealWeightFormulas.miller).toFixed(1)} lbs`}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() =>
                          copyToClipboard(
                            `BMI: ${bmiResult.bmi.toFixed(1)} - ${bmiResult.category}`,
                            "BMI Result",
                          )
                        }
                        variant="outline"
                        className="w-full"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy BMI Result
                      </Button>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-500">
                      Enter your measurements to calculate BMI
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="metabolism" className="space-y-4">
              {bmrResult ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Basal Metabolic Rate (BMR)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                        <div className="text-sm text-purple-600 dark:text-purple-400">
                          Your BMR (Mifflin-St Jeor)
                        </div>
                        <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                          {bmrResult.bmr.toFixed(0)} cal/day
                        </div>
                        <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                          Calories burned at complete rest
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Total Daily Energy Expenditure (TDEE)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Activity Level</Label>
                        <Select
                          value={activityLevel}
                          onValueChange={(v) =>
                            setActivityLevel(v as ActivityLevel)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sedentary">
                              Sedentary -{" "}
                              {getActivityLevelDescription("sedentary")}
                            </SelectItem>
                            <SelectItem value="light">
                              Light - {getActivityLevelDescription("light")}
                            </SelectItem>
                            <SelectItem value="moderate">
                              Moderate -{" "}
                              {getActivityLevelDescription("moderate")}
                            </SelectItem>
                            <SelectItem value="active">
                              Active - {getActivityLevelDescription("active")}
                            </SelectItem>
                            <SelectItem value="veryActive">
                              Very Active -{" "}
                              {getActivityLevelDescription("veryActive")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        {Object.entries(bmrResult.tdee).map(
                          ([level, calories]) => (
                            <div
                              key={level}
                              className={`flex items-center justify-between rounded-lg border p-3 ${
                                level === activityLevel
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                  : ""
                              }`}
                            >
                              <div>
                                <div className="font-medium capitalize">
                                  {level.replace(/([A-Z])/g, " $1")}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {getActivityLevelDescription(
                                    level as ActivityLevel,
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">
                                  {calories.toFixed(0)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  cal/day
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          To maintain weight, consume{" "}
                          {bmrResult.tdee[activityLevel].toFixed(0)}{" "}
                          calories/day. To lose weight, create a deficit. To
                          gain weight, create a surplus.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-500">
                      Enter your measurements to calculate metabolism
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="composition" className="space-y-4">
              {bodyComposition ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Scale className="h-5 w-5" />
                        Body Composition
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                          <div className="text-sm text-blue-600 dark:text-blue-400">
                            Body Fat %
                          </div>
                          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {bodyComposition.bodyFatPercentage.toFixed(1)}%
                          </div>
                        </div>

                        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                          <div className="text-sm text-green-600 dark:text-green-400">
                            Lean Body Mass
                          </div>
                          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {unitSystem === "metric"
                              ? `${bodyComposition.leanBodyMass.toFixed(1)} kg`
                              : `${kgToLbs(bodyComposition.leanBodyMass).toFixed(1)} lbs`}
                          </div>
                        </div>

                        <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
                          <div className="text-sm text-orange-600 dark:text-orange-400">
                            Fat Mass
                          </div>
                          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                            {unitSystem === "metric"
                              ? `${bodyComposition.fatMass.toFixed(1)} kg`
                              : `${kgToLbs(bodyComposition.fatMass).toFixed(1)} lbs`}
                          </div>
                        </div>

                        {bodyComposition.waistToHeightRatio && (
                          <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                            <div className="text-sm text-purple-600 dark:text-purple-400">
                              Waist-to-Height Ratio
                            </div>
                            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                              {bodyComposition.waistToHeightRatio.toFixed(2)}
                            </div>
                            <div className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                              {bodyComposition.waistToHeightRatio < 0.5
                                ? "Healthy"
                                : "Above recommended"}
                            </div>
                          </div>
                        )}

                        {bodyComposition.waistToHipRatio && (
                          <div className="rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/20">
                            <div className="text-sm text-indigo-600 dark:text-indigo-400">
                              Waist-to-Hip Ratio
                            </div>
                            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                              {bodyComposition.waistToHipRatio.toFixed(2)}
                            </div>
                            <div className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                              {gender === "male"
                                ? bodyComposition.waistToHipRatio < 0.9
                                  ? "Low risk"
                                  : "Increased risk"
                                : bodyComposition.waistToHipRatio < 0.85
                                  ? "Low risk"
                                  : "Increased risk"}
                            </div>
                          </div>
                        )}
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Body fat percentage is estimated using the Navy Method
                          and BMI calculations. For more accurate results,
                          consider using specialized equipment like DEXA scans
                          or bioelectrical impedance analysis.
                        </AlertDescription>
                      </Alert>

                      <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                        <div className="mb-2 text-sm font-medium">
                          Healthy Body Fat Ranges:
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {gender === "male" ? (
                            <>
                              <div>• Essential fat: 2-5%</div>
                              <div>• Athletes: 6-13%</div>
                              <div>• Fitness: 14-17%</div>
                              <div>• Average: 18-24%</div>
                              <div>• Obese: 25%+</div>
                            </>
                          ) : (
                            <>
                              <div>• Essential fat: 10-13%</div>
                              <div>• Athletes: 14-20%</div>
                              <div>• Fitness: 21-24%</div>
                              <div>• Average: 25-31%</div>
                              <div>• Obese: 32%+</div>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-500">
                      Enter your measurements to calculate body composition
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Weight Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="target-weight">Target Weight</Label>
                    <Input
                      id="target-weight"
                      type="number"
                      min="1"
                      step="0.1"
                      value={targetWeight || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTargetWeight(val === "" ? 0 : parseFloat(val));
                      }}
                      placeholder={unitSystem === "metric" ? "kg" : "lbs"}
                    />
                  </div>

                  {weightGoals && bmrResult && (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {weightGoals.isLosing
                            ? "Weight to Lose"
                            : "Weight to Gain"}
                        </div>
                        <div className="text-2xl font-bold">
                          {unitSystem === "metric"
                            ? `${Math.abs(weightGoals.difference).toFixed(1)} kg`
                            : `${kgToLbs(Math.abs(weightGoals.difference)).toFixed(1)} lbs`}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Timeline Options:</Label>

                        <div className="rounded-lg border p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <Badge variant="secondary">Conservative</Badge>
                            <span className="text-sm text-gray-500">
                              Safe & Sustainable
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Duration:</span>
                              <span className="font-medium">
                                {weightGoals.conservative.months < 1
                                  ? `${weightGoals.conservative.weeks.toFixed(0)} weeks`
                                  : `${weightGoals.conservative.months.toFixed(1)} months`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Daily Calories:</span>
                              <span className="font-medium">
                                {(
                                  bmrResult.tdee[activityLevel] -
                                  (weightGoals.isLosing ? 1 : -1) *
                                    weightGoals.conservative.dailyCalories
                                ).toFixed(0)}{" "}
                                cal
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>
                                {weightGoals.isLosing ? "Deficit" : "Surplus"}:
                              </span>
                              <span>
                                {weightGoals.conservative.dailyCalories.toFixed(
                                  0,
                                )}{" "}
                                cal/day
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-green-500 bg-green-50 p-4 dark:bg-green-900/20">
                          <div className="mb-2 flex items-center justify-between">
                            <Badge className="bg-green-600">Moderate</Badge>
                            <span className="text-sm text-gray-500">
                              Recommended
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Duration:</span>
                              <span className="font-medium">
                                {weightGoals.moderate.months < 1
                                  ? `${weightGoals.moderate.weeks.toFixed(0)} weeks`
                                  : `${weightGoals.moderate.months.toFixed(1)} months`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Daily Calories:</span>
                              <span className="font-medium">
                                {(
                                  bmrResult.tdee[activityLevel] -
                                  (weightGoals.isLosing ? 1 : -1) *
                                    weightGoals.moderate.dailyCalories
                                ).toFixed(0)}{" "}
                                cal
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>
                                {weightGoals.isLosing ? "Deficit" : "Surplus"}:
                              </span>
                              <span>
                                {weightGoals.moderate.dailyCalories.toFixed(0)}{" "}
                                cal/day
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-orange-500 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <Badge variant="destructive">Aggressive</Badge>
                            <span className="text-sm text-gray-500">
                              Not Recommended
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Duration:</span>
                              <span className="font-medium">
                                {weightGoals.aggressive.months < 1
                                  ? `${weightGoals.aggressive.weeks.toFixed(0)} weeks`
                                  : `${weightGoals.aggressive.months.toFixed(1)} months`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Daily Calories:</span>
                              <span className="font-medium">
                                {(
                                  bmrResult.tdee[activityLevel] -
                                  (weightGoals.isLosing ? 1 : -1) *
                                    weightGoals.aggressive.dailyCalories
                                ).toFixed(0)}{" "}
                                cal
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>
                                {weightGoals.isLosing ? "Deficit" : "Surplus"}:
                              </span>
                              <span>
                                {weightGoals.aggressive.dailyCalories.toFixed(
                                  0,
                                )}{" "}
                                cal/day
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          For sustainable results, aim for{" "}
                          {weightGoals.isLosing
                            ? "0.5-1 kg (1-2 lbs)"
                            : "0.25-0.5 kg (0.5-1 lb)"}{" "}
                          per week. Consult a healthcare professional before
                          starting any weight management program.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    BMI History
                  </CardTitle>
                  {history.length > 0 && (
                    <Button onClick={clearHistory} variant="outline" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {history.length > 0 ? (
                    <div className="space-y-2">
                      {history.map((entry, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <div className="font-medium">
                              BMI: {entry.bmi.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(entry.date).toLocaleDateString()} -{" "}
                              {unitSystem === "metric"
                                ? `${entry.weight.toFixed(1)} kg, ${entry.height.toFixed(0)} cm`
                                : `${kgToLbs(entry.weight).toFixed(1)} lbs, ${cmToInches(entry.height).toFixed(1)} in`}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(
                                `BMI: ${entry.bmi.toFixed(1)} - ${new Date(entry.date).toLocaleDateString()}`,
                                "History Entry",
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-gray-500">
                        No history yet. Add entries to track your progress.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ToolsWrapper>
  );
}
