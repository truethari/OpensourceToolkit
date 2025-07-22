"use client";

import React, { useState, useCallback } from "react";
import {
  Copy,
  RefreshCw,
  Check,
  Download,
  User,
  Mail,
  Home,
} from "lucide-react";
import {
  faker,
  fakerEN,
  fakerES,
  fakerFR,
  fakerDE,
  fakerIT,
  fakerJA,
  fakerKO,
  fakerZH_CN,
} from "@faker-js/faker";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  jobTitle: string;
  company: string;
  avatar: string;
}

interface IAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

interface IEmail {
  id: string;
  email: string;
  domain: string;
  provider: string;
  displayName: string;
}

export default function MockDataGenerator() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [emails, setEmails] = useState<IEmail[]>([]);
  const [count, setCount] = useState("5");
  const [copiedData, setCopiedData] = useState<string | null>(null);
  const [locale, setLocale] = useState("en");
  const [includeAvatars, setIncludeAvatars] = useState(true);

  const getFakerInstance = (selectedLocale: string) => {
    switch (selectedLocale) {
      case "en":
        return fakerEN;
      case "es":
        return fakerES;
      case "fr":
        return fakerFR;
      case "de":
        return fakerDE;
      case "it":
        return fakerIT;
      case "ja":
        return fakerJA;
      case "ko":
        return fakerKO;
      case "zh":
        return fakerZH_CN;
      default:
        return faker;
    }
  };

  const generateUsers = useCallback(
    (num: number) => {
      const fakerInstance = getFakerInstance(locale);
      const generatedUsers: IUser[] = [];

      for (let i = 0; i < num; i++) {
        const firstName = fakerInstance.person.firstName();
        const lastName = fakerInstance.person.lastName();
        const user: IUser = {
          id: fakerInstance.string.uuid(),
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`,
          email: fakerInstance.internet.email({ firstName, lastName }),
          phone: fakerInstance.phone.number(),
          dateOfBirth: fakerInstance.date
            .birthdate()
            .toISOString()
            .split("T")[0],
          age: fakerInstance.number.int({ min: 18, max: 80 }),
          gender: fakerInstance.person.sex(),
          jobTitle: fakerInstance.person.jobTitle(),
          company: fakerInstance.company.name(),
          avatar: includeAvatars ? fakerInstance.image.avatar() : "",
        };
        generatedUsers.push(user);
      }

      setUsers(generatedUsers);
    },
    [locale, includeAvatars],
  );

  const generateAddresses = useCallback(
    (num: number) => {
      const fakerInstance = getFakerInstance(locale);
      const generatedAddresses: IAddress[] = [];

      for (let i = 0; i < num; i++) {
        const street = fakerInstance.location.streetAddress();
        const city = fakerInstance.location.city();
        const state = fakerInstance.location.state();
        const zipCode = fakerInstance.location.zipCode();
        const country = fakerInstance.location.country();

        const address: IAddress = {
          id: fakerInstance.string.uuid(),
          street,
          city,
          state,
          zipCode,
          country,
          fullAddress: `${street}, ${city}, ${state} ${zipCode}, ${country}`,
          latitude: parseFloat(fakerInstance.location.latitude().toString()),
          longitude: parseFloat(fakerInstance.location.longitude().toString()),
        };
        generatedAddresses.push(address);
      }

      setAddresses(generatedAddresses);
    },
    [locale],
  );

  const generateEmails = useCallback(
    (num: number) => {
      const fakerInstance = getFakerInstance(locale);
      const generatedEmails: IEmail[] = [];

      for (let i = 0; i < num; i++) {
        const email = fakerInstance.internet.email();
        const domain = email.split("@")[1];
        const emailData: IEmail = {
          id: fakerInstance.string.uuid(),
          email,
          domain,
          provider: domain.split(".")[0],
          displayName: fakerInstance.person.fullName(),
        };
        generatedEmails.push(emailData);
      }

      setEmails(generatedEmails);
    },
    [locale],
  );

  const handleGenerate = (type: string) => {
    const num = Math.min(Math.max(1, parseInt(count) || 1), 100);

    switch (type) {
      case "users":
        generateUsers(num);
        break;
      case "addresses":
        generateAddresses(num);
        break;
      case "emails":
        generateEmails(num);
        break;
    }
    setCopiedData(null);
  };

  const copyToClipboard = async (data: string, key: string) => {
    try {
      await navigator.clipboard.writeText(data);
      setCopiedData(key);
      setTimeout(() => setCopiedData(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const downloadData = (data: unknown[], filename: string) => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDataForCopy = (data: unknown[]) => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Mock Data Generator</h1>
        <p className="text-muted-foreground">
          Generate realistic fake data for testing and development using
          Faker.js
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Configure data generation settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 md:space-y-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="count">Count</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder="Number of records"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locale">Locale</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger>
                  <SelectValue placeholder="Select locale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (en)</SelectItem>
                  <SelectItem value="es">Spanish (es)</SelectItem>
                  <SelectItem value="fr">French (fr)</SelectItem>
                  <SelectItem value="de">German (de)</SelectItem>
                  <SelectItem value="it">Italian (it)</SelectItem>
                  <SelectItem value="ja">Japanese (ja)</SelectItem>
                  <SelectItem value="ko">Korean (ko)</SelectItem>
                  <SelectItem value="zh">Chinese (zh)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              Generated data is completely fake and for testing purposes only.
              Maximum of 100 records per generation.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Addresses
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Emails
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex flex-col justify-between md:flex-row md:items-center">
            <h3 className="text-lg font-semibold">User Data</h3>

            <div className="flex items-center gap-2 space-x-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="avatars"
                  checked={includeAvatars}
                  onCheckedChange={(checked) =>
                    setIncludeAvatars(checked as boolean)
                  }
                />
                <Label htmlFor="avatars" className="text-sm">
                  Include Avatars
                </Label>
              </div>

              <Button onClick={() => handleGenerate("users")}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate Users
              </Button>
            </div>
          </div>

          {users.length > 0 && (
            <Card>
              <CardHeader className="flex flex-col justify-between md:flex-row md:items-center">
                <div>
                  <CardTitle>Generated Users</CardTitle>
                  <CardDescription>
                    {users.length} users generated
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(formatDataForCopy(users), "users")
                    }
                  >
                    {copiedData === "users" ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy JSON
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadData(users, "mock-users")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="space-y-2 rounded-lg bg-muted p-4"
                    >
                      <div className="flex items-center gap-3">
                        {user.avatar && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="h-10 w-10 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-semibold">{user.fullName}</div>
                          <div className="text-xs text-muted-foreground md:text-sm">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                        <div>
                          <span className="font-medium">Phone:</span>{" "}
                          {user.phone}
                        </div>
                        <div>
                          <span className="font-medium">Age:</span> {user.age}
                        </div>
                        <div>
                          <span className="font-medium">Job:</span>{" "}
                          {user.jobTitle}
                        </div>
                        <div>
                          <span className="font-medium">Company:</span>{" "}
                          {user.company}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="addresses" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Address Data</h3>
            <Button onClick={() => handleGenerate("addresses")}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Addresses
            </Button>
          </div>

          {addresses.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Generated Addresses</CardTitle>
                  <CardDescription>
                    {addresses.length} addresses generated
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(formatDataForCopy(addresses), "addresses")
                    }
                  >
                    {copiedData === "addresses" ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy JSON
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadData(addresses, "mock-addresses")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="space-y-2 rounded-lg bg-muted p-4"
                    >
                      <div className="font-semibold">{address.fullAddress}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Latitude:</span>{" "}
                          {address.latitude}
                        </div>
                        <div>
                          <span className="font-medium">Longitude:</span>{" "}
                          {address.longitude}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="emails" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Email Data</h3>
            <Button onClick={() => handleGenerate("emails")}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Emails
            </Button>
          </div>

          {emails.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Generated Emails</CardTitle>
                  <CardDescription>
                    {emails.length} emails generated
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(formatDataForCopy(emails), "emails")
                    }
                  >
                    {copiedData === "emails" ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy JSON
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadData(emails, "mock-emails")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {emails.map((email) => (
                    <div
                      key={email.id}
                      className="space-y-2 rounded-lg bg-muted p-4"
                    >
                      <div className="font-semibold">{email.email}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Display Name:</span>{" "}
                          {email.displayName}
                        </div>
                        <div>
                          <span className="font-medium">Provider:</span>{" "}
                          {email.provider}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>About Mock Data Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <h4 className="mb-2 font-semibold">User Data</h4>
              <p className="text-sm text-muted-foreground">
                Generate realistic user profiles with names, emails, phone
                numbers, job information, and optional avatars.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Address Data</h4>
              <p className="text-sm text-muted-foreground">
                Create fake addresses with street addresses, cities, states,
                postal codes, and geographic coordinates.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Email Data</h4>
              <p className="text-sm text-muted-foreground">
                Generate email addresses with various domains and providers,
                including display names and domain information.
              </p>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              All data is generated using Faker.js and is completely fictional.
              Perfect for testing, development, and prototyping purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
