-- Create papers table for Research Paper Manager
CREATE TABLE public.papers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  authors TEXT[] DEFAULT '{}',
  publication_year INTEGER,
  url TEXT,
  status TEXT DEFAULT 'to_read' CHECK (status IN ('to_read', 'reading', 'completed')),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for papers
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own papers" ON public.papers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own papers" ON public.papers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own papers" ON public.papers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own papers" ON public.papers FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_papers_updated_at
BEFORE UPDATE ON public.papers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create course_assignments table for Grade Calculator
CREATE TABLE public.course_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight DOUBLE PRECISION NOT NULL, -- e.g. 0.3 for 30%
  score DOUBLE PRECISION, -- e.g. 85.0
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for course_assignments
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assignments" ON public.course_assignments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own assignments" ON public.course_assignments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assignments" ON public.course_assignments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assignments" ON public.course_assignments FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_course_assignments_updated_at
BEFORE UPDATE ON public.course_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
