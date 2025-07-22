"use client";

import React, { useState, useCallback } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Key,
  Zap,
  Copy,
  Info,
  Lock,
  Check,
  Dice6,
  EyeOff,
  History,
  Shuffle,
  Shield,
  XCircle,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
  customCharset: string;
  useCustomCharset: boolean;
  minUppercase: number;
  minLowercase: number;
  minNumbers: number;
  minSymbols: number;
}

interface GeneratedPassword {
  password: string;
  strength: number;
  strengthLabel: string;
  entropy: number;
  crackTime: string;
  timestamp: number;
}

interface PassphraseOptions {
  wordCount: number;
  separator: string;
  capitalize: boolean;
  includeNumbers: boolean;
  customSeparator: string;
}

// Common word list for passphrases (subset for demo)
const COMMON_WORDS = [
  "apple",
  "beach",
  "cloud",
  "dance",
  "earth",
  "flame",
  "green",
  "happy",
  "island",
  "jazz",
  "kite",
  "light",
  "music",
  "night",
  "ocean",
  "peace",
  "quick",
  "river",
  "stone",
  "tree",
  "unity",
  "voice",
  "water",
  "youth",
  "zebra",
  "brave",
  "chair",
  "dream",
  "eagle",
  "forest",
  "giant",
  "house",
  "image",
  "jump",
  "kind",
  "lemon",
  "magic",
  "noble",
  "orbit",
  "paper",
  "queen",
  "radio",
  "space",
  "tiger",
  "urban",
  "value",
  "world",
  "extra",
];

export default function PasswordGenerator() {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
    customCharset: "",
    useCustomCharset: false,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  });

  const [passphraseOptions, setPassphraseOptions] = useState<PassphraseOptions>(
    {
      wordCount: 4,
      separator: "-",
      capitalize: false,
      includeNumbers: false,
      customSeparator: "",
    },
  );

  const [generatedPasswords, setGeneratedPasswords] = useState<
    GeneratedPassword[]
  >([]);
  const [batchCount, setBatchCount] = useState(5);
  const [showPasswords, setShowPasswords] = useState<
    Record<string | number, boolean>
  >({});
  const [copiedIndex, setCopiedIndex] = useState<string | number | null>(null);
  const [passwordHistory, setPasswordHistory] = useState<GeneratedPassword[]>(
    [],
  );
  const [selectedPreset, setSelectedPreset] = useState("custom");
  const [pin, setPin] = useState("");
  const [pinLength, setPinLength] = useState(6);

  const presets = {
    web: {
      length: 12,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false,
    },
    secure: {
      length: 20,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    },
    wifi: {
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false,
    },
    database: {
      length: 24,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    },
    simple: {
      length: 8,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false,
    },
    maximum: {
      length: 32,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    },
  };

  const getCharacterSet = useCallback(() => {
    if (options.useCustomCharset && options.customCharset) {
      return options.customCharset;
    }

    let charset = "";
    if (options.includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (options.includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (options.includeNumbers) charset += "0123456789";
    if (options.includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (options.excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, "");
    }
    if (options.excludeAmbiguous) {
      charset = charset.replace(/[{}[\]()\/\\'"~,;<>.]/g, "");
    }

    return charset;
  }, [options]);

  const calculatePasswordStrength = (
    password: string,
  ): {
    strength: number;
    label: string;
    entropy: number;
    crackTime: string;
  } => {
    let score = 0;
    let entropy = 0;

    // Character set size
    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

    entropy = Math.log2(Math.pow(charsetSize, password.length));

    // Length scoring
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (password.length >= 20) score += 1;

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    // Pattern penalties
    if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
    if (/012|123|234|345|456|567|678|789|890/.test(password)) score -= 1; // Sequential numbers
    if (
      /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/.test(
        password.toLowerCase(),
      )
    )
      score -= 1; // Sequential letters

    const strength = Math.max(0, Math.min(5, score));

    const labels = [
      "Very Weak",
      "Weak",
      "Fair",
      "Good",
      "Strong",
      "Very Strong",
    ];
    const label = labels[strength];

    // Crack time estimation (simplified)
    const guessesPerSecond = 1000000000; // 1 billion guesses per second
    const totalCombinations = Math.pow(charsetSize, password.length);
    const secondsToCrack = totalCombinations / (2 * guessesPerSecond);

    let crackTime = "";
    if (secondsToCrack < 60) crackTime = "< 1 minute";
    else if (secondsToCrack < 3600)
      crackTime = `${Math.round(secondsToCrack / 60)} minutes`;
    else if (secondsToCrack < 86400)
      crackTime = `${Math.round(secondsToCrack / 3600)} hours`;
    else if (secondsToCrack < 31536000)
      crackTime = `${Math.round(secondsToCrack / 86400)} days`;
    else if (secondsToCrack < 31536000000)
      crackTime = `${Math.round(secondsToCrack / 31536000)} years`;
    else crackTime = "Centuries";

    return { strength, label, entropy: Math.round(entropy), crackTime };
  };

  const generatePassword = useCallback((): string => {
    const charset = getCharacterSet();
    if (!charset) return "";

    let password = "";
    const crypto =
      window.crypto ||
      (window as typeof window & { msCrypto: Crypto }).msCrypto;

    // Generate password ensuring minimum requirements
    const requirements = [];
    if (options.includeUppercase && options.minUppercase > 0) {
      requirements.push({
        chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        min: options.minUppercase,
      });
    }
    if (options.includeLowercase && options.minLowercase > 0) {
      requirements.push({
        chars: "abcdefghijklmnopqrstuvwxyz",
        min: options.minLowercase,
      });
    }
    if (options.includeNumbers && options.minNumbers > 0) {
      requirements.push({ chars: "0123456789", min: options.minNumbers });
    }
    if (options.includeSymbols && options.minSymbols > 0) {
      requirements.push({
        chars: "!@#$%^&*()_+-=[]{}|;:,.<>?",
        min: options.minSymbols,
      });
    }

    // Add minimum required characters
    for (const req of requirements) {
      for (let i = 0; i < req.min; i++) {
        const array = new Uint8Array(1);
        crypto.getRandomValues(array);
        password += req.chars[array[0] % req.chars.length];
      }
    }

    // Fill remaining length with random characters from full charset
    for (let i = password.length; i < options.length; i++) {
      const array = new Uint8Array(1);
      crypto.getRandomValues(array);
      password += charset[array[0] % charset.length];
    }

    // Shuffle the password
    const passwordArray = password.split("");
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const array = new Uint8Array(1);
      crypto.getRandomValues(array);
      const j = array[0] % (i + 1);
      [passwordArray[i], passwordArray[j]] = [
        passwordArray[j],
        passwordArray[i],
      ];
    }

    return passwordArray.join("");
  }, [options, getCharacterSet]);

  const generatePassphrase = useCallback((): string => {
    const selectedWords = [];
    const crypto =
      window.crypto ||
      (window as typeof window & { msCrypto: Crypto }).msCrypto;

    for (let i = 0; i < passphraseOptions.wordCount; i++) {
      const array = new Uint8Array(1);
      crypto.getRandomValues(array);
      let word = COMMON_WORDS[array[0] % COMMON_WORDS.length];

      if (passphraseOptions.capitalize) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }

      if (passphraseOptions.includeNumbers) {
        const numArray = new Uint8Array(1);
        crypto.getRandomValues(numArray);
        word += (numArray[0] % 10).toString();
      }

      selectedWords.push(word);
    }

    let separator = "";
    if (passphraseOptions.separator === "custom") {
      separator = passphraseOptions.customSeparator;
    } else if (passphraseOptions.separator === "space") {
      separator = " ";
    } else if (passphraseOptions.separator === "none") {
      separator = "";
    } else {
      separator = passphraseOptions.separator;
    }

    return selectedWords.join(separator);
  }, [passphraseOptions]);

  const generatePIN = useCallback((): string => {
    const crypto =
      window.crypto ||
      (window as typeof window & { msCrypto: Crypto }).msCrypto;
    let pin = "";

    for (let i = 0; i < pinLength; i++) {
      const array = new Uint8Array(1);
      crypto.getRandomValues(array);
      pin += (array[0] % 10).toString();
    }

    return pin;
  }, [pinLength]);

  const handleGenerate = (
    type: "password" | "passphrase" | "pin" = "password",
  ) => {
    const newPasswords: GeneratedPassword[] = [];

    for (let i = 0; i < (type === "password" ? batchCount : 1); i++) {
      let passwordText = "";

      switch (type) {
        case "password":
          passwordText = generatePassword();
          break;
        case "passphrase":
          passwordText = generatePassphrase();
          break;
        case "pin":
          passwordText = generatePIN();
          break;
      }

      const analysis = calculatePasswordStrength(passwordText);

      const newPassword: GeneratedPassword = {
        password: passwordText,
        strength: analysis.strength,
        strengthLabel: analysis.label,
        entropy: analysis.entropy,
        crackTime: analysis.crackTime,
        timestamp: Date.now(),
      };

      newPasswords.push(newPassword);
    }

    if (type === "password") {
      setGeneratedPasswords(newPasswords);
    } else if (type === "passphrase") {
      setGeneratedPasswords([newPasswords[0]]);
    } else if (type === "pin") {
      setPin(newPasswords[0].password);
    }

    // Add to history
    setPasswordHistory((prev) => [...newPasswords, ...prev].slice(0, 50));
  };

  const copyToClipboard = async (text: string, index: string | number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const togglePasswordVisibility = (index: string | number) => {
    setShowPasswords((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const applyPreset = (presetName: string) => {
    if (presetName === "custom") return;

    const preset = presets[presetName as keyof typeof presets];
    setOptions((prev) => ({
      ...prev,
      ...preset,
      excludeSimilar: false,
      excludeAmbiguous: false,
      useCustomCharset: false,
      minUppercase: 1,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: preset.includeSymbols ? 1 : 0,
    }));
  };

  const exportPasswords = () => {
    const data = generatedPasswords.map((p) => ({
      password: p.password,
      strength: p.strengthLabel,
      entropy: p.entropy,
      crackTime: p.crackTime,
      generated: new Date(p.timestamp).toISOString(),
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-passwords.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStrengthColor = (strength: number) => {
    const colors = [
      "text-red-500",
      "text-orange-500",
      "text-yellow-500",
      "text-blue-500",
      "text-green-500",
      "text-emerald-500",
    ];
    return colors[strength] || "text-gray-500";
  };

  const getStrengthIcon = (strength: number) => {
    if (strength <= 1) return <XCircle className="h-4 w-4" />;
    if (strength <= 2) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Advanced Password Generator</h1>
        <p className="text-muted-foreground">
          Generate secure passwords, passphrases, and PINs with advanced
          customization and security analysis
        </p>
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <div className="flex flex-col gap-2">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
            <TabsTrigger value="generator">Generator</TabsTrigger>
            <TabsTrigger value="passphrase">Passphrase</TabsTrigger>
            <TabsTrigger value="pin">PIN/Code</TabsTrigger>
            <TabsTrigger value="batch" className="hidden md:block">
              Batch
            </TabsTrigger>
            <TabsTrigger value="history" className="hidden md:block">
              History
            </TabsTrigger>
          </TabsList>

          <TabsList className="grid w-full grid-cols-2 md:hidden">
            <TabsTrigger value="batch">Batch</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="generator" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Password Generator
                  </CardTitle>
                  <CardDescription>
                    Customize your password requirements and generate secure
                    passwords
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Security Presets</Label>
                      <Select
                        value={selectedPreset}
                        onValueChange={(value) => {
                          setSelectedPreset(value);
                          applyPreset(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom</SelectItem>
                          <SelectItem value="simple">
                            Simple (8 chars)
                          </SelectItem>
                          <SelectItem value="web">
                            Web Account (12 chars)
                          </SelectItem>
                          <SelectItem value="wifi">
                            WiFi Network (16 chars)
                          </SelectItem>
                          <SelectItem value="secure">
                            High Security (20 chars)
                          </SelectItem>
                          <SelectItem value="database">
                            Database (24 chars)
                          </SelectItem>
                          <SelectItem value="maximum">
                            Maximum Security (32 chars)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Password Length: {options.length}</Label>
                      <Slider
                        value={[options.length]}
                        onValueChange={(value) =>
                          setOptions((prev) => ({ ...prev, length: value[0] }))
                        }
                        min={4}
                        max={128}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="uppercase"
                          checked={options.includeUppercase}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              includeUppercase: !!checked,
                            }))
                          }
                        />
                        <Label htmlFor="uppercase">Uppercase (A-Z)</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="lowercase"
                          checked={options.includeLowercase}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              includeLowercase: !!checked,
                            }))
                          }
                        />
                        <Label htmlFor="lowercase">Lowercase (a-z)</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="numbers"
                          checked={options.includeNumbers}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              includeNumbers: !!checked,
                            }))
                          }
                        />
                        <Label htmlFor="numbers">Numbers (0-9)</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="symbols"
                          checked={options.includeSymbols}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              includeSymbols: !!checked,
                            }))
                          }
                        />
                        <Label htmlFor="symbols">Symbols (!@#$)</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="exclude-similar"
                          checked={options.excludeSimilar}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              excludeSimilar: !!checked,
                            }))
                          }
                        />
                        <Label htmlFor="exclude-similar">
                          Exclude Similar (il1Lo0O)
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="exclude-ambiguous"
                          checked={options.excludeAmbiguous}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              excludeAmbiguous: !!checked,
                            }))
                          }
                        />
                        <Label htmlFor="exclude-ambiguous">
                          Exclude Ambiguous
                        </Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Min Uppercase</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={options.minUppercase}
                          onChange={(e) =>
                            setOptions((prev) => ({
                              ...prev,
                              minUppercase: parseInt(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Min Lowercase</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={options.minLowercase}
                          onChange={(e) =>
                            setOptions((prev) => ({
                              ...prev,
                              minLowercase: parseInt(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Min Numbers</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={options.minNumbers}
                          onChange={(e) =>
                            setOptions((prev) => ({
                              ...prev,
                              minNumbers: parseInt(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Min Symbols</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={options.minSymbols}
                          onChange={(e) =>
                            setOptions((prev) => ({
                              ...prev,
                              minSymbols: parseInt(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="custom-charset"
                          checked={options.useCustomCharset}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              useCustomCharset: !!checked,
                            }))
                          }
                        />
                        <Label htmlFor="custom-charset">
                          Use Custom Character Set
                        </Label>
                      </div>
                      {options.useCustomCharset && (
                        <Input
                          placeholder="Enter custom characters..."
                          value={options.customCharset}
                          onChange={(e) =>
                            setOptions((prev) => ({
                              ...prev,
                              customCharset: e.target.value,
                            }))
                          }
                        />
                      )}
                    </div>

                    <Button
                      onClick={() => handleGenerate("password")}
                      className="w-full"
                    >
                      <Dice6 className="mr-2 h-4 w-4" />
                      Generate Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Generated Password
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedPasswords.length > 0 && (
                    <div className="space-y-4">
                      {generatedPasswords.slice(0, 1).map((pwd, index) => (
                        <div key={index} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Input
                              value={pwd.password}
                              type={showPasswords[index] ? "text" : "password"}
                              readOnly
                              className="font-mono"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePasswordVisibility(index)}
                            >
                              {showPasswords[index] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(pwd.password, index)
                              }
                            >
                              {copiedIndex === index ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Strength:</span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-medium ${getStrengthColor(pwd.strength)}`}
                                >
                                  {pwd.strengthLabel}
                                </span>
                                <span
                                  className={getStrengthColor(pwd.strength)}
                                >
                                  {getStrengthIcon(pwd.strength)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm">Entropy:</span>
                              <span className="text-sm font-medium">
                                {pwd.entropy} bits
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm">Crack Time:</span>
                              <span className="text-sm font-medium">
                                {pwd.crackTime}
                              </span>
                            </div>
                          </div>

                          <div className="h-2 w-full rounded-full bg-gray-200">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                pwd.strength <= 1
                                  ? "bg-red-500"
                                  : pwd.strength <= 2
                                    ? "bg-orange-500"
                                    : pwd.strength <= 3
                                      ? "bg-yellow-500"
                                      : pwd.strength <= 4
                                        ? "bg-blue-500"
                                        : "bg-green-500"
                              }`}
                              style={{ width: `${(pwd.strength / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="passphrase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                Passphrase Generator
              </CardTitle>
              <CardDescription>
                Generate memorable passphrases using random words
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Number of Words: {passphraseOptions.wordCount}</Label>
                  <Slider
                    value={[passphraseOptions.wordCount]}
                    onValueChange={(value) =>
                      setPassphraseOptions((prev) => ({
                        ...prev,
                        wordCount: value[0],
                      }))
                    }
                    min={2}
                    max={8}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Word Separator</Label>
                  <Select
                    value={passphraseOptions.separator}
                    onValueChange={(value) =>
                      setPassphraseOptions((prev) => ({
                        ...prev,
                        separator: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">Hyphen (-)</SelectItem>
                      <SelectItem value="_">Underscore (_)</SelectItem>
                      <SelectItem value="space">Space ( )</SelectItem>
                      <SelectItem value=".">Dot (.)</SelectItem>
                      <SelectItem value="none">No Separator</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {passphraseOptions.separator === "custom" && (
                    <Input
                      placeholder="Enter custom separator..."
                      value={passphraseOptions.customSeparator}
                      onChange={(e) =>
                        setPassphraseOptions((prev) => ({
                          ...prev,
                          customSeparator: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="capitalize-words"
                      checked={passphraseOptions.capitalize}
                      onCheckedChange={(checked) =>
                        setPassphraseOptions((prev) => ({
                          ...prev,
                          capitalize: !!checked,
                        }))
                      }
                    />
                    <Label htmlFor="capitalize-words">Capitalize Words</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-numbers-passphrase"
                      checked={passphraseOptions.includeNumbers}
                      onCheckedChange={(checked) =>
                        setPassphraseOptions((prev) => ({
                          ...prev,
                          includeNumbers: !!checked,
                        }))
                      }
                    />
                    <Label htmlFor="include-numbers-passphrase">
                      Add Numbers to Words
                    </Label>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleGenerate("passphrase")}
                className="w-full"
              >
                <Shuffle className="mr-2 h-4 w-4" />
                Generate Passphrase
              </Button>

              {generatedPasswords.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold">Generated Passphrase</h4>
                  {generatedPasswords.slice(0, 1).map((pwd, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={pwd.password}
                          type={showPasswords[index] ? "text" : "password"}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(index)}
                        >
                          {showPasswords[index] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(pwd.password, index)}
                        >
                          {copiedIndex === index ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span>Length:</span>
                          <span>{pwd.password.length} characters</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Words:</span>
                          <span>{passphraseOptions.wordCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Strength:</span>
                          <span className={getStrengthColor(pwd.strength)}>
                            {pwd.strengthLabel}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Entropy:</span>
                          <span>{pwd.entropy} bits</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Alert>
                <AlertDescription className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Passphrases are easier to remember and type while maintaining
                  good security. Consider using them for accounts you access
                  frequently.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                PIN & Code Generator
              </CardTitle>
              <CardDescription>
                Generate secure PINs and numeric codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>PIN Length: {pinLength}</Label>
                  <Slider
                    value={[pinLength]}
                    onValueChange={(value) => setPinLength(value[0])}
                    min={4}
                    max={16}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Security Level</Label>
                  <div className="text-sm text-muted-foreground">
                    {pinLength <= 4 && "Basic Security"}
                    {pinLength > 4 && pinLength <= 6 && "Standard Security"}
                    {pinLength > 6 && pinLength <= 8 && "High Security"}
                    {pinLength > 8 && "Maximum Security"}
                  </div>
                </div>
              </div>

              <Button onClick={() => handleGenerate("pin")} className="w-full">
                <Dice6 className="mr-2 h-4 w-4" />
                Generate PIN
              </Button>

              {pin && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold">Generated PIN</h4>
                  <div className="flex items-center gap-2">
                    <Input
                      value={pin}
                      readOnly
                      className="text-center font-mono text-2xl tracking-widest"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(pin, -1)}
                    >
                      {copiedIndex === -1 ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Length:</span>
                      <span>{pin.length} digits</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Combinations:</span>
                      <span>{Math.pow(10, pin.length).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <Alert>
                <AlertDescription className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Use longer PINs for better security. Avoid sequential numbers,
                  repeated digits, or personally significant dates.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Batch Password Generation
              </CardTitle>
              <CardDescription>
                Generate multiple passwords at once for different accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Number of Passwords: {batchCount}</Label>
                <Slider
                  value={[batchCount]}
                  onValueChange={(value) => setBatchCount(value[0])}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>

              <Button
                onClick={() => handleGenerate("password")}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate {batchCount} Passwords
              </Button>

              {generatedPasswords.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">
                      Generated Passwords ({generatedPasswords.length})
                    </h4>
                    <Button
                      onClick={exportPasswords}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export JSON
                    </Button>
                  </div>

                  <div className="max-h-96 space-y-3 overflow-y-auto">
                    {generatedPasswords.map((pwd, index) => (
                      <div key={index} className="rounded-lg border p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Input
                            value={pwd.password}
                            type={showPasswords[index] ? "text" : "password"}
                            readOnly
                            className="font-mono"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePasswordVisibility(index)}
                          >
                            {showPasswords[index] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(pwd.password, index)}
                          >
                            {copiedIndex === index ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span className={getStrengthColor(pwd.strength)}>
                              {getStrengthIcon(pwd.strength)}
                            </span>
                            <span>{pwd.strengthLabel}</span>
                          </div>
                          <div>{pwd.entropy} bits entropy</div>
                          <div>Crack: {pwd.crackTime}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Password History
              </CardTitle>
              <CardDescription>
                View previously generated passwords (stored locally only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordHistory.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {passwordHistory.length} passwords in history
                    </div>
                    <Button
                      onClick={() => setPasswordHistory([])}
                      variant="outline"
                      size="sm"
                    >
                      Clear History
                    </Button>
                  </div>

                  <div className="max-h-96 space-y-3 overflow-y-auto">
                    {passwordHistory.map((pwd, index) => (
                      <div key={index} className="rounded-lg border p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <Input
                            value={pwd.password}
                            type={
                              showPasswords[`history-${index}`]
                                ? "text"
                                : "password"
                            }
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              togglePasswordVisibility(`history-${index}`)
                            }
                          >
                            {showPasswords[`history-${index}`] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(pwd.password, `history-${index}`)
                            }
                          >
                            {copiedIndex === `history-${index}` ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground md:grid-cols-4">
                          <div className="flex items-center gap-1">
                            <span className={getStrengthColor(pwd.strength)}>
                              {getStrengthIcon(pwd.strength)}
                            </span>
                            <span>{pwd.strengthLabel}</span>
                          </div>
                          <div>{pwd.entropy} bits</div>
                          <div>{pwd.crackTime}</div>
                          <div>{new Date(pwd.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No passwords in history. Generate some passwords to see them
                  here.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Password Guidelines</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Use at least 12 characters for strong passwords</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>
                    Include uppercase, lowercase, numbers, and symbols
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Use unique passwords for each account</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Store passwords in a secure password manager</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Security Features</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Strength Analysis:</strong> Real-time password
                  strength evaluation
                </div>
                <div>
                  <strong>Entropy Calculation:</strong> Measure of password
                  randomness
                </div>
                <div>
                  <strong>Crack Time Estimation:</strong> Time to break password
                </div>
                <div>
                  <strong>Local Generation:</strong> All passwords generated in
                  your browser
                </div>
                <div>
                  <strong>No Storage:</strong> Passwords are not saved on our
                  servers
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
