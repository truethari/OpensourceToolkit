"use client";

import React, { useState, useCallback } from "react";
import {
  Shield,
  Copy,
  Check,
  Download,
  RefreshCw,
  Settings,
  FileText,
  Building,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

interface CompanyInfo {
  name: string;
  email: string;
  website: string;
  address: string;
  country: string;
  customCountry: string;
  lastUpdated: string;
}

interface PolicyOptions {
  collectsPersonalData: boolean;
  usesCookies: boolean;
  usesAnalytics: boolean;
  usesThirdPartyServices: boolean;
  collectsEmails: boolean;
  sharesData: boolean;
  sellsData: boolean;
  retainsData: boolean;
  allowsDataDeletion: boolean;
  providesDataExport: boolean;
  usesEncryption: boolean;
  hasMinimumAge: boolean;
  minimumAge: number;
  gdprCompliant: boolean;
  ccpaCompliant: boolean;
}

export default function PrivacyPolicyGenerator() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "",
    email: "",
    website: "",
    address: "",
    country: "",
    customCountry: "",
    lastUpdated: new Date().toISOString().split("T")[0],
  });

  const [policyOptions, setPolicyOptions] = useState<PolicyOptions>({
    collectsPersonalData: true,
    usesCookies: true,
    usesAnalytics: false,
    usesThirdPartyServices: false,
    collectsEmails: true,
    sharesData: false,
    sellsData: false,
    retainsData: true,
    allowsDataDeletion: true,
    providesDataExport: false,
    usesEncryption: true,
    hasMinimumAge: true,
    minimumAge: 13,
    gdprCompliant: false,
    ccpaCompliant: false,
  });

  const [generatedPolicy, setGeneratedPolicy] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("company");

  const generatePolicy = useCallback(() => {
    const sections: string[] = [];

    // Helper function to clean up sections
    const addSection = (content: string) => {
      if (content.trim()) {
        sections.push(content.trim());
      }
    };

    // Header
    addSection(`# Privacy Policy for ${companyInfo.name || "[Company Name]"}

**Last updated:** ${companyInfo.lastUpdated}

## Introduction

${companyInfo.name || "[Company Name]"} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates ${companyInfo.website || "[website URL]"} (the &quot;Service&quot;). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.`);

    // Information Collection Section
    let infoSection = "## Information We Collect\n\n";

    if (policyOptions.collectsPersonalData) {
      infoSection +=
        "### Personal Information\nWe may collect personally identifiable information that you provide to us, such as:\n";
      if (policyOptions.collectsEmails) {
        infoSection += "- Email addresses\n";
      }
      infoSection +=
        "- Name and contact information\n- Account information and preferences";
    } else {
      infoSection +=
        "We do not collect personal information from users of our Service.";
    }

    if (policyOptions.usesCookies) {
      infoSection +=
        "\n\n### Cookies and Tracking Data\nWe use cookies and similar tracking technologies to track activity on our Service and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.";
    }

    if (policyOptions.usesAnalytics) {
      infoSection +=
        "\n\n### Analytics Data\nWe may use third-party analytics services to monitor and analyze the use of our Service. This helps us understand how users interact with our platform.";
    }

    addSection(infoSection);

    // Usage Section
    let usageSection =
      "## How We Use Your Information\n\nWe use the collected data for various purposes:\n- To provide and maintain our Service\n- To notify you about changes to our Service";
    if (policyOptions.collectsEmails) {
      usageSection += "\n- To provide customer support";
    }
    usageSection +=
      "\n- To monitor the usage of our Service\n- To detect, prevent and address technical issues";
    addSection(usageSection);

    // Third-Party Services
    if (policyOptions.usesThirdPartyServices) {
      addSection(`## Third-Party Services

We may employ third-party companies and individuals to facilitate our Service, provide the Service on our behalf, perform Service-related services, or assist us in analyzing how our Service is used. These third parties have access to your personal data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.`);
    }

    // Data Sharing
    let sharingSection = "## Data Sharing and Disclosure\n\n";
    if (policyOptions.sharesData) {
      sharingSection +=
        "We may share your personal information in certain circumstances:\n- With service providers who assist in operating our Service\n- When required by law or to protect our rights\n- With your consent or at your direction";
    } else {
      sharingSection +=
        "We do not share your personal data with third parties except as described in this policy.";
    }

    if (policyOptions.sellsData) {
      sharingSection +=
        "\n\n**Note:** We may sell aggregated, non-personal data to third parties for business purposes.";
    } else {
      sharingSection +=
        "\n\n**We do not sell your personal data to third parties.**";
    }

    addSection(sharingSection);

    // Data Retention
    addSection(`## Data Retention

${
  policyOptions.retainsData
    ? "We retain your personal information only for as long as necessary for the purposes set out in this Privacy Policy. We will retain and use your information to comply with our legal obligations, resolve disputes, and enforce our policies."
    : "We do not retain personal information longer than necessary for the operation of our Service."
}`);

    // User Rights
    let rightsSection =
      "## Your Data Rights\n\nYou have certain rights regarding your personal data:\n\n";
    if (policyOptions.allowsDataDeletion) {
      rightsSection +=
        "- **Right to Delete:** You can request deletion of your personal data\n";
    }
    rightsSection +=
      "- **Right to Access:** You can request copies of your personal data\n- **Right to Rectification:** You can request correction of inaccurate data";
    if (policyOptions.providesDataExport) {
      rightsSection +=
        "\n- **Right to Data Portability:** You can request transfer of your data";
    }
    rightsSection +=
      "\n- **Right to Object:** You can object to our processing of your data\n\nTo exercise these rights, please contact us at " +
      (companyInfo.email || "[contact email]") +
      ".";
    addSection(rightsSection);

    // GDPR Compliance
    if (policyOptions.gdprCompliant) {
      addSection(`## GDPR Compliance

If you are a resident of the European Economic Area (EEA), you have certain data protection rights. We aim to take reasonable steps to allow you to correct, amend, delete, or limit the use of your personal data.`);
    }

    // CCPA Compliance
    if (policyOptions.ccpaCompliant) {
      addSection(`## CCPA Compliance

If you are a California resident, you have certain rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, the right to delete personal information, and the right to opt-out of the sale of personal information.`);
    }

    // Security
    addSection(`## Security

${
  policyOptions.usesEncryption
    ? "The security of your data is important to us. We implement appropriate technical and organizational security measures, including encryption, to protect your personal information."
    : "We strive to protect your personal information, but please note that no method of transmission over the internet is 100% secure."
}`);

    // Children's Privacy
    if (policyOptions.hasMinimumAge) {
      addSection(`## Children's Privacy

Our Service is not intended for use by children under the age of ${policyOptions.minimumAge}. We do not knowingly collect personally identifiable information from children under ${policyOptions.minimumAge}. If you are a parent or guardian and you are aware that your child has provided us with personal data, please contact us.`);
    }

    // Changes to Policy
    addSection(`## Changes to This Privacy Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.`);

    // Contact Information
    let contactSection = `## Contact Information

If you have any questions about this Privacy Policy, please contact us:

- **Email:** ${companyInfo.email || "[contact email]"}
- **Website:** ${companyInfo.website || "[website URL]"}`;

    if (companyInfo.address) {
      contactSection += `\n- **Address:** ${companyInfo.address}`;
    }

    addSection(contactSection);

    // Footer
    addSection(`---

*This privacy policy was generated using OpensourceToolkit Privacy Policy Generator. Please review and customize it according to your specific needs and consult with legal professionals to ensure compliance with applicable laws.*`);

    const policy = sections.join("\n\n");
    setGeneratedPolicy(policy);
  }, [companyInfo, policyOptions]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPolicy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const downloadPolicy = () => {
    const blob = new Blob([generatedPolicy], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `privacy-policy-${companyInfo.name.toLowerCase().replace(/\s+/g, "-") || "generated"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateCompanyInfo = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo((prev) => {
      // Clear custom country when switching away from "other"
      if (field === "country" && value !== "other") {
        return { ...prev, [field]: value, customCountry: "" };
      }
      return { ...prev, [field]: value };
    });
  };

  const updatePolicyOption = (
    field: keyof PolicyOptions,
    value: boolean | number,
  ) => {
    setPolicyOptions((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Privacy Policy Generator</h1>
        <p className="text-muted-foreground">
          Generate comprehensive privacy policies for your website or
          application with GDPR and CCPA compliance options
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Configuration Section */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Privacy Policy Configuration
              </CardTitle>
              <CardDescription>
                Customize your privacy policy based on your data practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger
                    value="company"
                    className="flex items-center gap-2"
                  >
                    <Building className="h-4 w-4" />
                    Company
                  </TabsTrigger>
                  <TabsTrigger value="data" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Data Practices
                  </TabsTrigger>
                  <TabsTrigger
                    value="compliance"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Compliance
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="company" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name *</Label>
                      <Input
                        id="company-name"
                        placeholder="Your Company Name"
                        value={companyInfo.name}
                        onChange={(e) =>
                          updateCompanyInfo("name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-email">Contact Email *</Label>
                      <Input
                        id="company-email"
                        type="email"
                        placeholder="contact@company.com"
                        value={companyInfo.email}
                        onChange={(e) =>
                          updateCompanyInfo("email", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website URL</Label>
                      <Input
                        id="website"
                        placeholder="https://company.com"
                        value={companyInfo.website}
                        onChange={(e) =>
                          updateCompanyInfo("website", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={companyInfo.country}
                        onValueChange={(value) =>
                          updateCompanyInfo("country", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="SL">Sri Lanka</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {companyInfo.country === "other" && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-country">Custom Country</Label>
                      <Input
                        id="custom-country"
                        placeholder="Enter your country"
                        value={companyInfo.customCountry}
                        onChange={(e) =>
                          updateCompanyInfo("customCountry", e.target.value)
                        }
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address (Optional)</Label>
                    <Textarea
                      id="address"
                      placeholder="123 Business St, City, State, ZIP"
                      value={companyInfo.address}
                      onChange={(e) =>
                        updateCompanyInfo("address", e.target.value)
                      }
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last-updated">Last Updated Date</Label>
                    <Input
                      id="last-updated"
                      type="date"
                      value={companyInfo.lastUpdated}
                      onChange={(e) =>
                        updateCompanyInfo("lastUpdated", e.target.value)
                      }
                    />
                  </div>
                </TabsContent>

                <TabsContent value="data" className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Data Collection</h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="personal-data"
                          checked={policyOptions.collectsPersonalData}
                          onCheckedChange={(checked) =>
                            updatePolicyOption(
                              "collectsPersonalData",
                              checked as boolean,
                            )
                          }
                        />
                        <Label htmlFor="personal-data">
                          Collect personal data
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="emails"
                          checked={policyOptions.collectsEmails}
                          onCheckedChange={(checked) =>
                            updatePolicyOption(
                              "collectsEmails",
                              checked as boolean,
                            )
                          }
                        />
                        <Label htmlFor="emails">Collect email addresses</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="cookies"
                          checked={policyOptions.usesCookies}
                          onCheckedChange={(checked) =>
                            updatePolicyOption(
                              "usesCookies",
                              checked as boolean,
                            )
                          }
                        />
                        <Label htmlFor="cookies">Use cookies</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="analytics"
                          checked={policyOptions.usesAnalytics}
                          onCheckedChange={(checked) =>
                            updatePolicyOption(
                              "usesAnalytics",
                              checked as boolean,
                            )
                          }
                        />
                        <Label htmlFor="analytics">
                          Use analytics services
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Data Practices</h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="third-party"
                          checked={policyOptions.usesThirdPartyServices}
                          onCheckedChange={(checked) =>
                            updatePolicyOption(
                              "usesThirdPartyServices",
                              checked as boolean,
                            )
                          }
                        />
                        <Label htmlFor="third-party">
                          Use third-party services
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="share-data"
                          checked={policyOptions.sharesData}
                          onCheckedChange={(checked) =>
                            updatePolicyOption("sharesData", checked as boolean)
                          }
                        />
                        <Label htmlFor="share-data">
                          Share data with partners
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sell-data"
                          checked={policyOptions.sellsData}
                          onCheckedChange={(checked) =>
                            updatePolicyOption("sellsData", checked as boolean)
                          }
                        />
                        <Label htmlFor="sell-data">Sell user data</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="retain-data"
                          checked={policyOptions.retainsData}
                          onCheckedChange={(checked) =>
                            updatePolicyOption(
                              "retainsData",
                              checked as boolean,
                            )
                          }
                        />
                        <Label htmlFor="retain-data">Retain user data</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">User Rights</h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="data-deletion"
                          checked={policyOptions.allowsDataDeletion}
                          onCheckedChange={(checked) =>
                            updatePolicyOption(
                              "allowsDataDeletion",
                              checked as boolean,
                            )
                          }
                        />
                        <Label htmlFor="data-deletion">
                          Allow data deletion
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="data-export"
                          checked={policyOptions.providesDataExport}
                          onCheckedChange={(checked) =>
                            updatePolicyOption(
                              "providesDataExport",
                              checked as boolean,
                            )
                          }
                        />
                        <Label htmlFor="data-export">Provide data export</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="encryption"
                          checked={policyOptions.usesEncryption}
                          onCheckedChange={(checked) =>
                            updatePolicyOption(
                              "usesEncryption",
                              checked as boolean,
                            )
                          }
                        />
                        <Label htmlFor="encryption">Use data encryption</Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="compliance" className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Age Restrictions</h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="minimum-age"
                        checked={policyOptions.hasMinimumAge}
                        onCheckedChange={(checked) =>
                          updatePolicyOption(
                            "hasMinimumAge",
                            checked as boolean,
                          )
                        }
                      />
                      <Label htmlFor="minimum-age">
                        Has minimum age requirement
                      </Label>
                    </div>
                    {policyOptions.hasMinimumAge && (
                      <div className="space-y-2">
                        <Label htmlFor="age-limit">Minimum Age</Label>
                        <Select
                          value={policyOptions.minimumAge.toString()}
                          onValueChange={(value) =>
                            updatePolicyOption("minimumAge", parseInt(value))
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="13">13 years</SelectItem>
                            <SelectItem value="16">16 years</SelectItem>
                            <SelectItem value="18">18 years</SelectItem>
                            <SelectItem value="21">21 years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Legal Compliance</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="gdpr"
                          checked={policyOptions.gdprCompliant}
                          onCheckedChange={(checked) =>
                            updatePolicyOption(
                              "gdprCompliant",
                              checked as boolean,
                            )
                          }
                        />
                        <Label htmlFor="gdpr">GDPR Compliant (EU)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="ccpa"
                          checked={policyOptions.ccpaCompliant}
                          onCheckedChange={(checked) =>
                            updatePolicyOption(
                              "ccpaCompliant",
                              checked as boolean,
                            )
                          }
                        />
                        <Label htmlFor="ccpa">
                          CCPA Compliant (California)
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription>
                      <strong>Legal Disclaimer:</strong> This generator provides
                      a basic privacy policy template. Always consult with legal
                      professionals to ensure compliance with applicable laws
                      and regulations.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>

              <div className="mt-6">
                <Button onClick={generatePolicy} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate Privacy Policy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Policy</CardTitle>
              <CardDescription>
                Your privacy policy will appear here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedPolicy ? (
                <>
                  <div className="flex flex-col gap-2">
                    <Button onClick={copyToClipboard} variant="outline">
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Policy
                        </>
                      )}
                    </Button>
                    <Button onClick={downloadPolicy}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Markdown
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-y-auto rounded-lg border bg-muted p-4">
                    <pre className="whitespace-pre-wrap text-sm">
                      {generatedPolicy}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  Configure your settings and click &quot;Generate Privacy
                  Policy&quot; to create your custom policy.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About Privacy Policy Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <h4 className="mb-2 font-semibold">Comprehensive Coverage</h4>
              <p className="text-sm text-muted-foreground">
                Covers data collection, usage, sharing, retention, and user
                rights with customizable options for your specific business
                needs.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Legal Compliance</h4>
              <p className="text-sm text-muted-foreground">
                Includes GDPR and CCPA compliance sections, age restrictions,
                and standard legal protections for modern web applications.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Easy Customization</h4>
              <p className="text-sm text-muted-foreground">
                Simple checkboxes and form fields allow you to customize the
                policy without legal expertise, with clear explanations.
              </p>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              <strong>Important:</strong> This tool generates basic privacy
              policy templates. Always consult with legal professionals to
              ensure compliance with applicable laws and regulations in your
              jurisdiction.
            </p>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
