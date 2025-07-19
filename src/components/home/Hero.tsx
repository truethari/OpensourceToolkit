import { ToolCase, Users, Github } from "lucide-react";

import { tools } from "@/config";

export default function Hero() {
  return (
    <div className="border-b">
      <div className="mx-auto mb-4 max-w-7xl px-6 pb-8 pt-4">
        <div className="space-y-4 text-center md:space-y-6">
          <div className="mb-4 flex flex-col items-center justify-center gap-2 space-x-2 md:flex-row">
            <div className="rounded-2xl border bg-slate-700 p-3">
              <ToolCase className="h-8 w-8 text-white" />
            </div>
            <h1 className="animated-gradient-text text-4xl font-bold md:text-5xl">
              OpenSource Toolkit
            </h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Open source collection of useful daily utilities. Built by the
            community for developers and users. Contribute your own tools and
            components.
          </p>

          {/* Live Stats */}
          <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            {/* Github link */}
            <a
              href="https://github.com/truethari/OpensourceToolkit"
              className="flex items-center space-x-2"
              target="_blank"
            >
              <Github className="h-4 w-4" />
              <span>View on GitHub</span>
            </a>

            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{tools.length} Tools Available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
