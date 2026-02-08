-- Link paper drafts to system notes (pages)
ALTER TABLE public.paper_drafts 
ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_paper_drafts_page_id ON public.paper_drafts(page_id);
