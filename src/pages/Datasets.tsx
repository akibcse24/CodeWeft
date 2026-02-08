import { Plus, Database, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function Datasets() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Datasets & Models</h1>
          <p className="text-muted-foreground">Track your ML experiments</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Dataset
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search datasets and models..." className="pl-10" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No datasets logged</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Track datasets and models you're working with
            </p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" /> Add Dataset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
