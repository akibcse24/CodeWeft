import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, GraduationCap, Loader2, Trash2, Edit, BookOpen, Calculator, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useCourses } from "@/hooks/useCourses";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const courseColors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function Courses() {
  const { courses, isLoading, createCourse, updateCourse, deleteCourse } = useCourses();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [newCourse, setNewCourse] = useState({ name: "", code: "", semester: "", credits: "", color: courseColors[0], notes: "" });

  const handleCreateCourse = async () => {
    if (!newCourse.name.trim()) {
      toast({ title: "Please enter a course name", variant: "destructive" });
      return;
    }
    await createCourse.mutateAsync({
      title: newCourse.name,
      name: newCourse.name,
      code: newCourse.code || null,
      semester: newCourse.semester || null,
      credits: newCourse.credits ? parseFloat(newCourse.credits) : null,
      color: newCourse.color,
      notes: newCourse.notes || null,
    });
    setNewCourse({ name: "", code: "", semester: "", credits: "", color: courseColors[0], notes: "" });
    setIsDialogOpen(false);
    toast({ title: "Course added successfully" });
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;
    await updateCourse.mutateAsync({ id: editingCourse.id, ...editingCourse });
    setEditingCourse(null);
    toast({ title: "Course updated" });
  };

  const handleDeleteCourse = async (id: string) => {
    await deleteCourse.mutateAsync(id);
    toast({ title: "Course deleted" });
  };

  const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);
  const avgProgress = courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + (c.progress || 0), 0) / courses.length) : 0;

  // Grade Calculator Logic (Mock for now, normally would be connected to assignments table)
  // In a real app, you would fetch assignments related to the course.

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">Track your academic progress & grades</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Course</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Course</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Course Name</Label>
                <Input placeholder="Data Structures" value={newCourse.name} onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Course Code</Label>
                  <Input placeholder="CS201" value={newCourse.code} onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Credits</Label>
                  <Input type="number" placeholder="3" value={newCourse.credits} onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Input placeholder="Fall 2024" value={newCourse.semester} onChange={(e) => setNewCourse({ ...newCourse, semester: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {courseColors.map(color => (
                    <button key={color} onClick={() => setNewCourse({ ...newCourse, color })} className={cn("h-8 w-8 rounded-full", newCourse.color === color && "ring-2 ring-offset-2 ring-primary")} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateCourse} disabled={createCourse.isPending}>
                {createCourse.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Add Course
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{courses.length}</div><p className="text-xs text-muted-foreground">Total Courses</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{totalCredits}</div><p className="text-xs text-muted-foreground">Total Credits</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{avgProgress}%</div><p className="text-xs text-muted-foreground">Avg Progress</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{courses.filter(c => c.progress === 100).length}</div><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.length === 0 ? (
          <Card className="col-span-full"><CardContent className="pt-6 flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4"><GraduationCap className="h-8 w-8 text-muted-foreground" /></div>
            <h3 className="font-semibold text-lg">No courses yet</h3>
            <p className="text-muted-foreground mt-1">Add your first course to get started</p>
          </CardContent></Card>
        ) : (
          <AnimatePresence>
            {courses.map(course => (
              <motion.div key={course.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="group overflow-hidden flex flex-col h-full">
                  <div className="h-2" style={{ backgroundColor: course.color || "#3b82f6" }} />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                        <CardDescription>{course.code && <span className="mr-2">{course.code}</span>}{course.semester && <span>• {course.semester}</span>}</CardDescription>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => setEditingCourse(course)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCourse(course.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    <div>
                      <div className="flex justify-between text-sm mb-2"><span>Progress</span><span className="text-muted-foreground">{course.progress || 0}%</span></div>
                      <Progress value={course.progress || 0} />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      {course.credits && <span className="flex items-center gap-1"><BookOpen className="h-4 w-4 text-muted-foreground" />{course.credits} credits</span>}
                      {course.grade && <span className="font-semibold bg-accent px-2 py-0.5 rounded">Grade: {course.grade}%</span>}
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <Dialog open={!!editingCourse} onOpenChange={() => setEditingCourse(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Course & Grades</DialogTitle></DialogHeader>
          {editingCourse && (
            <div className="grid gap-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Course Name</Label><Input value={editingCourse.name} onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Progress (%)</Label><Input type="number" min="0" max="100" value={editingCourse.progress || 0} onChange={(e) => setEditingCourse({ ...editingCourse, progress: parseInt(e.target.value) || 0 })} /></div>
              </div>

              <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><Calculator className="h-4 w-4" /> Grade Calculator</h3>
                  <Badge variant="outline">Current: {editingCourse.grade || 0}%</Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Assignments (Weights must add up to 100%)</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assignment</TableHead>
                        <TableHead className="w-[80px]">Weight</TableHead>
                        <TableHead className="w-[80px]">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground italic text-xs">
                          No assignments added yet. Add one to start calculating your grade.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <Button variant="secondary" size="sm" className="w-full mt-2" disabled><Plus className="h-3 w-3 mr-2" /> Add Assignment</Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Notes</Label>
                <Textarea value={editingCourse.notes || ""} onChange={(e) => setEditingCourse({ ...editingCourse, notes: e.target.value })} />
              </div>

            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCourse(null)}>Cancel</Button>
            <Button onClick={handleUpdateCourse} disabled={updateCourse.isPending}>
              {updateCourse.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
