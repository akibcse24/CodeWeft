-- Migration: Core Notion-like Features - Part 2: Databases
-- Description: Adds database properties, relations, and rollups
-- Created: 2026-02-08

-- ============================================
-- DATABASE PROPERTIES (Schema for databases)
-- ============================================
CREATE TABLE IF NOT EXISTS public.database_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN (
    'text', 'number', 'select', 'multi_select', 'date', 
    'checkbox', 'url', 'email', 'phone', 'relation',
    'rollup', 'created_time', 'created_by', 'last_edited_time', 'last_edited_by',
    'files', 'rich_text'
  )),
  options JSONB DEFAULT '{}',
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  default_value TEXT,
  order_index INTEGER DEFAULT 0,
  width INTEGER DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_database_properties_page ON public.database_properties(page_id, order_index);

-- Enable RLS
ALTER TABLE public.database_properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own database properties" 
ON public.database_properties FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage own database properties" 
ON public.database_properties FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND user_id = auth.uid())
);

-- ============================================
-- SELECT/MULTI-SELECT OPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.database_property_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.database_properties(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  color TEXT DEFAULT 'gray',
  icon TEXT,
  order_index INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_db_prop_options_property ON public.database_property_options(property_id, order_index);

-- Enable RLS
ALTER TABLE public.database_property_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own property options" 
ON public.database_property_options FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.database_properties dp
    WHERE dp.id = property_id 
    AND EXISTS (SELECT 1 FROM public.pages WHERE id = dp.page_id AND user_id = auth.uid())
  )
);

CREATE POLICY "Users can manage own property options" 
ON public.database_property_options FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.database_properties dp
    WHERE dp.id = property_id 
    AND EXISTS (SELECT 1 FROM public.pages WHERE id = dp.page_id AND user_id = auth.uid())
  )
);

-- ============================================
-- DATABASE ROWS (Individual database entries)
-- ============================================
CREATE TABLE IF NOT EXISTS public.database_rows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  row_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_database_rows_page ON public.database_rows(page_id, row_order);

-- Enable RLS
ALTER TABLE public.database_rows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own database rows" 
ON public.database_rows FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage own database rows" 
ON public.database_rows FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND user_id = auth.uid())
);

-- ============================================
-- DATABASE CELL VALUES (Property values per row)
-- ============================================
CREATE TABLE IF NOT EXISTS public.database_cells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  row_id UUID NOT NULL REFERENCES public.database_rows(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.database_properties(id) ON DELETE CASCADE,
  value TEXT,
  values_array TEXT[],
  relation_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(row_id, property_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_database_cells_row ON public.database_cells(row_id);
CREATE INDEX IF NOT EXISTS idx_database_cells_property ON public.database_cells(property_id);

-- Enable RLS
ALTER TABLE public.database_cells ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own database cells" 
ON public.database_cells FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.database_rows dr
    WHERE dr.id = row_id
    AND EXISTS (SELECT 1 FROM public.pages WHERE id = dr.page_id AND user_id = auth.uid())
  )
);

CREATE POLICY "Users can manage own database cells" 
ON public.database_cells FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.database_rows dr
    WHERE dr.id = row_id
    AND EXISTS (SELECT 1 FROM public.pages WHERE id = dr.page_id AND user_id = auth.uid())
  )
);

-- ============================================
-- DATABASE RELATIONS (Links between databases)
-- ============================================
CREATE TABLE IF NOT EXISTS public.database_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_property_id UUID NOT NULL REFERENCES public.database_properties(id) ON DELETE CASCADE,
  target_page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_property_id, target_page_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_db_relations_source ON public.database_relations(source_property_id);

-- Enable RLS
ALTER TABLE public.database_relations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own database relations" 
ON public.database_relations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.database_properties dp
    WHERE dp.id = source_property_id
    AND EXISTS (SELECT 1 FROM public.pages WHERE id = dp.page_id AND user_id = auth.uid())
  )
);

CREATE POLICY "Users can manage own database relations" 
ON public.database_relations FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.database_properties dp
    WHERE dp.id = source_property_id
    AND EXISTS (SELECT 1 FROM public.pages WHERE id = dp.page_id AND user_id = auth.uid())
  )
);

-- ============================================
-- DATABASE ROLLUPS (Aggregated data from relations)
-- ============================================
CREATE TABLE IF NOT EXISTS public.database_rollups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.database_properties(id) ON DELETE CASCADE,
  rollup_type TEXT NOT NULL CHECK (rollup_type IN (
    'count', 'count_all', 'count_unique', 'sum', 'average',
    'min', 'max', 'show_original', 'show_unique'
  )),
  target_property_id UUID,
  target_relation_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_database_rollups_property ON public.database_rollups(property_id);

-- Enable RLS
ALTER TABLE public.database_rollups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own database rollups" 
ON public.database_rollups FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.database_properties dp
    WHERE dp.id = property_id
    AND EXISTS (SELECT 1 FROM public.pages WHERE id = dp.page_id AND user_id = auth.uid())
  )
);

CREATE POLICY "Users can manage own database rollups" 
ON public.database_rollups FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.database_properties dp
    WHERE dp.id = property_id
    AND EXISTS (SELECT 1 FROM public.pages WHERE id = dp.page_id AND user_id = auth.uid())
  )
);

-- ============================================
-- DATABASE VIEWS (Different view configurations)
-- ============================================
CREATE TABLE IF NOT EXISTS public.database_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  view_type TEXT NOT NULL CHECK (view_type IN ('table', 'board', 'gallery', 'calendar', 'timeline', 'list')),
  filter_config JSONB DEFAULT '[]',
  sort_config JSONB DEFAULT '[]',
  group_by_property_id UUID,
  visible_properties UUID[] DEFAULT '{}',
  column_widths JSONB DEFAULT '{}',
  view_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_database_views_page ON public.database_views(page_id, view_order);

-- Enable RLS
ALTER TABLE public.database_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own database views" 
ON public.database_views FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage own database views" 
ON public.database_views FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND user_id = auth.uid())
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get database row count
CREATE OR REPLACE FUNCTION get_database_row_count(page_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.database_rows WHERE page_id = $1);
END;
$$ LANGUAGE plpgsql;

-- Function to update database row order
CREATE OR REPLACE FUNCTION update_database_row_order()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.database_rows 
    SET row_order = (SELECT COALESCE(MAX(row_order), 0) + 1 FROM public.database_rows WHERE page_id = NEW.page_id)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_row_order ON public.database_rows;
CREATE TRIGGER trigger_update_row_order
  AFTER INSERT ON public.database_rows
  FOR EACH ROW
  EXECUTE FUNCTION update_database_row_order();

-- Apply updated_at trigger to all new tables
DROP TRIGGER IF EXISTS update_db_properties_updated_at ON public.database_properties;
CREATE TRIGGER update_db_properties_updated_at
  BEFORE UPDATE ON public.database_properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_db_rows_updated_at ON public.database_rows;
CREATE TRIGGER update_db_rows_updated_at
  BEFORE UPDATE ON public.database_rows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_db_cells_updated_at ON public.database_cells;
CREATE TRIGGER update_db_cells_updated_at
  BEFORE UPDATE ON public.database_cells
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_db_rollups_updated_at ON public.database_rollups;
CREATE TRIGGER update_db_rollups_updated_at
  BEFORE UPDATE ON public.database_rollups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_db_views_updated_at ON public.database_views;
CREATE TRIGGER update_db_views_updated_at
  BEFORE UPDATE ON public.database_views
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database features (Part 2) migration completed successfully!';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - database_properties: Schema for database columns';
  RAISE NOTICE '  - database_property_options: Select/multi-select options';
  RAISE NOTICE '  - database_rows: Individual database entries';
  RAISE NOTICE '  - database_cells: Property values per row';
  RAISE NOTICE '  - database_relations: Links between databases';
  RAISE NOTICE '  - database_rollups: Aggregated data';
  RAISE NOTICE '  - database_views: Different view configurations';
END $$;
