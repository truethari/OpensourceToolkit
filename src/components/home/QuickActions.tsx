"use client";

import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  quickActions: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    action: () => void;
  }[];
}

export default function QuickActions({ quickActions }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Quick Actions</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {quickActions.map((action, index) => (
          <Card
            key={index}
            className="cursor-pointer border transition-all duration-300 hover:border-slate-600 hover:bg-slate-900 hover:shadow-md"
            onClick={action.action}
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center space-x-4">
                <div className={`rounded-xl ${action.iconColor} border p-3`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{action.title}</h3>
                  <p className="md:text-md text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
