"use client";

import React, { useState, useRef } from "react";
import {
  X,
  User,
  Plus,
  Copy,
  Mail,
  Edit,
  Check,
  Phone,
  Trash2,
  Upload,
  FileText,
  Download,
  AlertCircle,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

interface VCardContact {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  organization: string;
  title: string;
  phones: { type: string; number: string }[];
  emails: { type: string; address: string }[];
  addresses: {
    type: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }[];
  urls: { type: string; url: string }[];
  birthday: string;
  notes: string;
}

export default function VCFTool() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [vcfContent, setVcfContent] = useState("");
  const [parsedContacts, setParsedContacts] = useState<VCardContact[]>([]);
  const [generatedVCF, setGeneratedVCF] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [currentContact, setCurrentContact] = useState<VCardContact>({
    id: "1",
    firstName: "",
    lastName: "",
    fullName: "",
    organization: "",
    title: "",
    phones: [{ type: "CELL", number: "" }],
    emails: [{ type: "WORK", address: "" }],
    addresses: [
      {
        type: "HOME",
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
    ],
    urls: [{ type: "WORK", url: "" }],
    birthday: "",
    notes: "",
  });
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = async (text: string, item: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const parseVCF = (vcfText: string): VCardContact[] => {
    const contacts: VCardContact[] = [];
    const errors: string[] = [];

    try {
      const vcards = vcfText
        .split(/BEGIN:VCARD/i)
        .filter((card) => card.trim());

      vcards.forEach((cardText, index) => {
        if (!cardText.includes("END:VCARD")) {
          errors.push(`Contact ${index + 1}: Missing END:VCARD`);
          return;
        }

        const lines = cardText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line);
        const contact: VCardContact = {
          id: `parsed-${index}`,
          firstName: "",
          lastName: "",
          fullName: "",
          organization: "",
          title: "",
          phones: [],
          emails: [],
          addresses: [],
          urls: [],
          birthday: "",
          notes: "",
        };

        lines.forEach((line) => {
          try {
            if (line.startsWith("FN:")) {
              contact.fullName = line.substring(3);
            } else if (line.startsWith("N:")) {
              const nameParts = line.substring(2).split(";");
              contact.lastName = nameParts[0] || "";
              contact.firstName = nameParts[1] || "";
            } else if (line.startsWith("ORG:")) {
              contact.organization = line.substring(4);
            } else if (line.startsWith("TITLE:")) {
              contact.title = line.substring(6);
            } else if (line.startsWith("TEL")) {
              const phoneMatch =
                line.match(/TEL;TYPE=([^:]+):(.+)/i) || line.match(/TEL:(.+)/);
              if (phoneMatch) {
                const type = phoneMatch.length > 2 ? phoneMatch[1] : "VOICE";
                const number =
                  phoneMatch.length > 2 ? phoneMatch[2] : phoneMatch[1];
                contact.phones.push({ type, number });
              }
            } else if (line.startsWith("EMAIL")) {
              const emailMatch =
                line.match(/EMAIL;TYPE=([^:]+):(.+)/i) ||
                line.match(/EMAIL:(.+)/);
              if (emailMatch) {
                const type = emailMatch.length > 2 ? emailMatch[1] : "WORK";
                const address =
                  emailMatch.length > 2 ? emailMatch[2] : emailMatch[1];
                contact.emails.push({ type, address });
              }
            } else if (line.startsWith("ADR")) {
              const adrMatch =
                line.match(/ADR;TYPE=([^:]+):(.+)/i) || line.match(/ADR:(.+)/);
              if (adrMatch) {
                const type = adrMatch.length > 2 ? adrMatch[1] : "HOME";
                const addressParts = (
                  adrMatch.length > 2 ? adrMatch[2] : adrMatch[1]
                ).split(";");
                contact.addresses.push({
                  type,
                  street: addressParts[2] || "",
                  city: addressParts[3] || "",
                  state: addressParts[4] || "",
                  postalCode: addressParts[5] || "",
                  country: addressParts[6] || "",
                });
              }
            } else if (line.startsWith("URL")) {
              const urlMatch =
                line.match(/URL;TYPE=([^:]+):(.+)/i) || line.match(/URL:(.+)/);
              if (urlMatch) {
                const type = urlMatch.length > 2 ? urlMatch[1] : "WORK";
                const url = urlMatch.length > 2 ? urlMatch[2] : urlMatch[1];
                contact.urls.push({ type, url });
              }
            } else if (line.startsWith("BDAY:")) {
              contact.birthday = line.substring(5);
            } else if (line.startsWith("NOTE:")) {
              contact.notes = line.substring(5);
            }
          } catch (err) {
            console.error(`Error parsing line "${line}":`, err);
            errors.push(`Contact ${index + 1}: Error parsing line "${line}"`);
          }
        });

        if (!contact.fullName && (contact.firstName || contact.lastName)) {
          contact.fullName = `${contact.firstName} ${contact.lastName}`.trim();
        }

        contacts.push(contact);
      });
    } catch (error) {
      errors.push(`General parsing error: ${error}`);
    }

    setParseErrors(errors);
    return contacts;
  };

  const generateVCF = (contacts: VCardContact[]): string => {
    return contacts
      .map((contact) => {
        let vcf = "BEGIN:VCARD\nVERSION:3.0\n";

        if (contact.fullName) vcf += `FN:${contact.fullName}\n`;
        if (contact.firstName || contact.lastName) {
          vcf += `N:${contact.lastName};${contact.firstName};;;\n`;
        }
        if (contact.organization) vcf += `ORG:${contact.organization}\n`;
        if (contact.title) vcf += `TITLE:${contact.title}\n`;

        contact.phones.forEach((phone) => {
          if (phone.number) vcf += `TEL;TYPE=${phone.type}:${phone.number}\n`;
        });

        contact.emails.forEach((email) => {
          if (email.address)
            vcf += `EMAIL;TYPE=${email.type}:${email.address}\n`;
        });

        contact.addresses.forEach((address) => {
          const addressComponents = [
            "", // PO Box
            "", // Extended address
            address.street,
            address.city,
            address.state,
            address.postalCode,
            address.country,
          ].join(";");
          if (addressComponents !== ";;;;;;") {
            vcf += `ADR;TYPE=${address.type}:${addressComponents}\n`;
          }
        });

        contact.urls.forEach((url) => {
          if (url.url) vcf += `URL;TYPE=${url.type}:${url.url}\n`;
        });

        if (contact.birthday) vcf += `BDAY:${contact.birthday}\n`;
        if (contact.notes) vcf += `NOTE:${contact.notes}\n`;

        vcf += "END:VCARD";
        return vcf;
      })
      .join("\n\n");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setVcfContent(content);
        const parsed = parseVCF(content);
        setParsedContacts(parsed);
      };
      reader.readAsText(file);
    }
  };

  const handleParseVCF = () => {
    if (!vcfContent.trim()) return;
    const parsed = parseVCF(vcfContent);
    setParsedContacts(parsed);
  };

  const handleGenerateVCF = () => {
    const vcf = generateVCF([currentContact]);
    setGeneratedVCF(vcf);
  };

  const downloadVCF = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addArrayField = (field: string) => {
    setCurrentContact((prev) => {
      const newContact = { ...prev };
      switch (field) {
        case "phones":
          newContact.phones.push({ type: "CELL", number: "" });
          break;
        case "emails":
          newContact.emails.push({ type: "WORK", address: "" });
          break;
        case "addresses":
          newContact.addresses.push({
            type: "HOME",
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
          });
          break;
        case "urls":
          newContact.urls.push({ type: "WORK", url: "" });
          break;
      }
      return newContact;
    });
  };

  const removeArrayField = (field: string, index: number) => {
    setCurrentContact((prev) => {
      const newContact = { ...prev };
      switch (field) {
        case "phones":
          newContact.phones.splice(index, 1);
          break;
        case "emails":
          newContact.emails.splice(index, 1);
          break;
        case "addresses":
          newContact.addresses.splice(index, 1);
          break;
        case "urls":
          newContact.urls.splice(index, 1);
          break;
      }
      return newContact;
    });
  };

  const updateArrayField = (
    field: string,
    index: number,
    key: string,
    value: string,
  ) => {
    setCurrentContact((prev) => {
      const newContact = { ...prev };
      switch (field) {
        case "phones":
          if (key === "type" || key === "number") {
            (newContact.phones[index] as { type: string; number: string })[
              key as keyof { type: string; number: string }
            ] = value;
          }
          break;
        case "emails":
          if (key === "type" || key === "address") {
            (newContact.emails[index] as { type: string; address: string })[
              key as keyof { type: string; address: string }
            ] = value;
          }
          break;
        case "addresses":
          if (
            [
              "type",
              "street",
              "city",
              "state",
              "postalCode",
              "country",
            ].includes(key)
          ) {
            (newContact.addresses[index] as VCardContact["addresses"][0])[
              key as keyof VCardContact["addresses"][0]
            ] = value;
          }
          break;
        case "urls":
          if (key === "type" || key === "url") {
            (newContact.urls[index] as { type: string; url: string })[
              key as keyof { type: string; url: string }
            ] = value;
          }
          break;
      }
      return newContact;
    });
  };

  const saveEditedContact = () => {
    if (!editingContact) return;

    const updatedContacts = parsedContacts.map((contact) =>
      contact.id === editingContact ? currentContact : contact,
    );
    setParsedContacts(updatedContacts);
    setEditingContact(null);

    // Reset to empty contact for generator tab
    setCurrentContact({
      id: Date.now().toString(),
      firstName: "",
      lastName: "",
      fullName: "",
      organization: "",
      title: "",
      phones: [{ type: "CELL", number: "" }],
      emails: [{ type: "WORK", address: "" }],
      addresses: [
        {
          type: "HOME",
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        },
      ],
      urls: [{ type: "WORK", url: "" }],
      birthday: "",
      notes: "",
    });
  };

  const cancelEdit = () => {
    setEditingContact(null);
    setCurrentContact({
      id: Date.now().toString(),
      firstName: "",
      lastName: "",
      fullName: "",
      organization: "",
      title: "",
      phones: [{ type: "CELL", number: "" }],
      emails: [{ type: "WORK", address: "" }],
      addresses: [
        {
          type: "HOME",
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        },
      ],
      urls: [{ type: "WORK", url: "" }],
      birthday: "",
      notes: "",
    });
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">VCF (vCard File) Reader & Writer</h1>
        <p className="text-muted-foreground">
          Parse, create, edit, and manage vCard contact files with advanced
          features
        </p>
      </div>

      <Tabs defaultValue="parser" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="parser">VCF Parser</TabsTrigger>
          <TabsTrigger value="generator">VCF Generator</TabsTrigger>
          <TabsTrigger value="editor">Contact Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="parser" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Parse VCF File
              </CardTitle>
              <CardDescription>
                Upload or paste VCF content to parse contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload VCF File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".vcf,.vcard"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button onClick={handleParseVCF} className="w-full">
                  Parse VCF
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vcf-content">VCF Content</Label>
                <Textarea
                  id="vcf-content"
                  placeholder="Paste VCF content here...&#10;BEGIN:VCARD&#10;VERSION:3.0&#10;FN:John Doe&#10;N:Doe;John;;;&#10;TEL;TYPE=CELL:+1-555-123-4567&#10;EMAIL:john@example.com&#10;END:VCARD"
                  value={vcfContent}
                  onChange={(e) => setVcfContent(e.target.value)}
                  rows={8}
                  className="font-mono"
                />
              </div>

              {parseErrors.length > 0 && (
                <Alert>
                  <AlertDescription className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <div className="space-y-1">
                      <div className="font-medium">Parsing Errors:</div>
                      {parseErrors.map((error, index) => (
                        <div key={index} className="text-sm">
                          {error}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {parsedContacts.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-semibold">
                      Parsed Contacts ({parsedContacts.length})
                    </h3>
                    <Button
                      onClick={() =>
                        downloadVCF(generateVCF(parsedContacts), "contacts.vcf")
                      }
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download All
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {parsedContacts.map((contact, index) => (
                      <Card key={contact.id} className="relative">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <h4 className="text-lg font-medium">
                                {contact.fullName || "Unnamed Contact"}
                              </h4>
                              {contact.organization && (
                                <p className="text-sm text-muted-foreground">
                                  {contact.organization}
                                </p>
                              )}
                              {contact.title && (
                                <p className="text-sm text-muted-foreground">
                                  {contact.title}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              {contact.phones.map((phone, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <Phone className="h-4 w-4" />
                                  <span className="font-medium">
                                    {phone.type}:
                                  </span>
                                  <span>{phone.number}</span>
                                </div>
                              ))}
                              {contact.emails.map((email, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <Mail className="h-4 w-4" />
                                  <span className="font-medium">
                                    {email.type}:
                                  </span>
                                  <span>{email.address}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  generateVCF([contact]),
                                  `contact-${index}`,
                                )
                              }
                              className="w-full sm:w-auto"
                            >
                              {copiedItem === `contact-${index}` ? (
                                <Check className="mr-2 h-4 w-4" />
                              ) : (
                                <Copy className="mr-2 h-4 w-4" />
                              )}
                              Copy VCF
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                downloadVCF(
                                  generateVCF([contact]),
                                  `${contact.fullName || "contact"}.vcf`,
                                )
                              }
                              className="w-full sm:w-auto"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {editingContact ? "Edit Contact" : "Generate VCF Contact"}
              </CardTitle>
              <CardDescription>
                {editingContact
                  ? "Edit the selected contact information"
                  : "Create a new vCard contact with detailed information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={currentContact.firstName}
                    onChange={(e) =>
                      setCurrentContact((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={currentContact.lastName}
                    onChange={(e) =>
                      setCurrentContact((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name (Display Name)</Label>
                <Input
                  id="fullName"
                  value={currentContact.fullName}
                  onChange={(e) =>
                    setCurrentContact((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  placeholder="John Doe"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    value={currentContact.organization}
                    onChange={(e) =>
                      setCurrentContact((prev) => ({
                        ...prev,
                        organization: e.target.value,
                      }))
                    }
                    placeholder="Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={currentContact.title}
                    onChange={(e) =>
                      setCurrentContact((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Software Engineer"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Phone Numbers
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayField("phones")}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {currentContact.phones.map((phone, index) => (
                  <div key={index} className="flex flex-col gap-2 sm:flex-row">
                    <Select
                      value={phone.type}
                      onValueChange={(value) =>
                        updateArrayField("phones", index, "type", value)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CELL">Mobile</SelectItem>
                        <SelectItem value="WORK">Work</SelectItem>
                        <SelectItem value="HOME">Home</SelectItem>
                        <SelectItem value="FAX">Fax</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={phone.number}
                      onChange={(e) =>
                        updateArrayField(
                          "phones",
                          index,
                          "number",
                          e.target.value,
                        )
                      }
                      placeholder="+1-555-123-4567"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayField("phones", index)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Email Addresses
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayField("emails")}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {currentContact.emails.map((email, index) => (
                  <div key={index} className="flex flex-col gap-2 sm:flex-row">
                    <Select
                      value={email.type}
                      onValueChange={(value) =>
                        updateArrayField("emails", index, "type", value)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WORK">Work</SelectItem>
                        <SelectItem value="HOME">Personal</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={email.address}
                      onChange={(e) =>
                        updateArrayField(
                          "emails",
                          index,
                          "address",
                          e.target.value,
                        )
                      }
                      placeholder="john@example.com"
                      type="email"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayField("emails", index)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Addresses</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayField("addresses")}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {currentContact.addresses.map((address, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Select
                          value={address.type}
                          onValueChange={(value) =>
                            updateArrayField("addresses", index, "type", value)
                          }
                        >
                          <SelectTrigger className="w-full sm:w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HOME">Home</SelectItem>
                            <SelectItem value="WORK">Work</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayField("addresses", index)}
                          className="w-full sm:w-auto"
                        >
                          <X className="mr-2 h-4 w-4 sm:mr-0" />
                          <span className="sm:hidden">Remove Address</span>
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <Input
                          value={address.street}
                          onChange={(e) =>
                            updateArrayField(
                              "addresses",
                              index,
                              "street",
                              e.target.value,
                            )
                          }
                          placeholder="123 Main St"
                        />
                        <Input
                          value={address.city}
                          onChange={(e) =>
                            updateArrayField(
                              "addresses",
                              index,
                              "city",
                              e.target.value,
                            )
                          }
                          placeholder="New York"
                        />
                        <Input
                          value={address.state}
                          onChange={(e) =>
                            updateArrayField(
                              "addresses",
                              index,
                              "state",
                              e.target.value,
                            )
                          }
                          placeholder="NY"
                        />
                        <Input
                          value={address.postalCode}
                          onChange={(e) =>
                            updateArrayField(
                              "addresses",
                              index,
                              "postalCode",
                              e.target.value,
                            )
                          }
                          placeholder="10001"
                        />
                        <Input
                          value={address.country}
                          onChange={(e) =>
                            updateArrayField(
                              "addresses",
                              index,
                              "country",
                              e.target.value,
                            )
                          }
                          placeholder="USA"
                          className="md:col-span-2"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Websites</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayField("urls")}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {currentContact.urls.map((url, index) => (
                  <div key={index} className="flex flex-col gap-2 sm:flex-row">
                    <Select
                      value={url.type}
                      onValueChange={(value) =>
                        updateArrayField("urls", index, "type", value)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WORK">Work</SelectItem>
                        <SelectItem value="HOME">Personal</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={url.url}
                      onChange={(e) =>
                        updateArrayField("urls", index, "url", e.target.value)
                      }
                      placeholder="https://example.com"
                      type="url"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayField("urls", index)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={currentContact.birthday}
                  onChange={(e) =>
                    setCurrentContact((prev) => ({
                      ...prev,
                      birthday: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={currentContact.notes}
                  onChange={(e) =>
                    setCurrentContact((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Additional notes about this contact..."
                  rows={3}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {editingContact ? (
                  <>
                    <Button onClick={saveEditedContact} className="flex-1">
                      Save Changes
                    </Button>
                    <Button
                      onClick={cancelEdit}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleGenerateVCF} className="w-full">
                    Generate VCF
                  </Button>
                )}
              </div>

              {generatedVCF && !editingContact && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">Generated VCF</h3>
                  <div className="space-y-2">
                    <Textarea
                      value={generatedVCF}
                      readOnly
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(generatedVCF, "generated-vcf")
                        }
                        className="w-full sm:w-auto"
                      >
                        {copiedItem === "generated-vcf" ? (
                          <Check className="mr-2 h-4 w-4" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        Copy VCF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          downloadVCF(
                            generatedVCF,
                            `${currentContact.fullName || currentContact.firstName || "contact"}.vcf`,
                          )
                        }
                        className="w-full sm:w-auto"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Contact Editor
              </CardTitle>
              <CardDescription>
                Edit existing contacts from parsed VCF files
              </CardDescription>
            </CardHeader>
            <CardContent>
              {parsedContacts.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {parsedContacts.map((contact) => (
                      <Card
                        key={contact.id}
                        className="cursor-pointer transition-shadow hover:shadow-md"
                      >
                        <CardContent className="pt-4">
                          <h4 className="font-medium">
                            {contact.fullName || "Unnamed Contact"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {contact.organization}
                          </p>
                          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCurrentContact(contact);
                                setEditingContact(contact.id);
                                // Switch to generator tab for editing
                                const generatorTab = document.querySelector(
                                  '[value="generator"]',
                                ) as HTMLElement;
                                generatorTab?.click();
                              }}
                              className="w-full sm:w-auto"
                            >
                              <Edit className="mr-2 h-4 w-4 sm:mr-0" />
                              <span className="sm:hidden">Edit Contact</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updatedContacts = parsedContacts.filter(
                                  (c) => c.id !== contact.id,
                                );
                                setParsedContacts(updatedContacts);
                              }}
                              className="w-full sm:w-auto"
                            >
                              <Trash2 className="mr-2 h-4 w-4 sm:mr-0" />
                              <span className="sm:hidden">Delete Contact</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    No contacts available for editing. Please parse a VCF file
                    first in the Parser tab.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>VCF Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Supported Fields</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>FN:</strong> Full Name (Display Name)
                </div>
                <div>
                  <strong>N:</strong> Structured Name
                  (Last;First;Middle;Prefix;Suffix)
                </div>
                <div>
                  <strong>ORG:</strong> Organization/Company
                </div>
                <div>
                  <strong>TITLE:</strong> Job Title
                </div>
                <div>
                  <strong>TEL:</strong> Phone Numbers (with TYPE)
                </div>
                <div>
                  <strong>EMAIL:</strong> Email Addresses (with TYPE)
                </div>
                <div>
                  <strong>ADR:</strong> Addresses (with TYPE)
                </div>
                <div>
                  <strong>URL:</strong> Website URLs
                </div>
                <div>
                  <strong>BDAY:</strong> Birthday
                </div>
                <div>
                  <strong>NOTE:</strong> Notes
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Features</h4>
              <div className="space-y-2 text-sm">
                <div>✓ Parse multiple contacts from single VCF file</div>
                <div>✓ Generate individual or batch VCF files</div>
                <div>
                  ✓ Support for multiple phone numbers, emails, addresses
                </div>
                <div>✓ Contact validation and error reporting</div>
                <div>✓ Copy to clipboard and download functionality</div>
                <div>✓ VCF 3.0 format compliance</div>
                <div>✓ Import/Export contact collections</div>
                <div>✓ Contact editing and management</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
