import { Router, Response, Request } from 'express';
import { supabase } from '../server';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/', async (req: Request & { userId?: string }, res: Response) => {
  try {
    const { parent_id, workspace_id, limit = '20', offset = '0' } = req.query;

    let query = supabase
      .from('pages')
      .select('*')
      .eq('user_id', req.userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(parseInt(limit as string, 10))
      .range(parseInt(offset as string, 10), parseInt(offset as string, 10) + parseInt(limit as string, 10) - 1);

    if (parent_id) {
      query = query.eq('parent_id', parent_id);
    }

    if (workspace_id) {
      query = query.eq('workspace_id', workspace_id);
    }

    const { data: pages, error } = await query;

    if (error) {
      throw error;
    }

    res.status(200).json({
      data: pages || [],
      pagination: {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10)
      }
    });
  } catch (err) {
    console.error('List pages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/:id', async (req: Request & { userId?: string }, res: Response) => {
  try {
    const { id } = req.params;

    const { data: page, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .is('deleted_at', null)
      .single();

    if (error || !page) {
      res.status(404).json({ error: 'Not found', message: 'Page not found' });
      return;
    }

    res.status(200).json({ data: page });
  } catch (err) {
    console.error('Get page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/', async (req: Request & { userId?: string }, res: Response) => {
  try {
    const { title, content, workspace_id, parent_id } = req.body;

    if (!title || !workspace_id) {
      res.status(400).json({ error: 'Bad request', message: 'Title and workspace_id are required' });
      return;
    }

    const { data: page, error } = await supabase
      .from('pages')
      .insert({
        title,
        content: content || {},
        workspace_id,
        parent_id: parent_id || null,
        user_id: req.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ data: page });
  } catch (err) {
    console.error('Create page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.patch('/:id', async (req: Request & { userId?: string }, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, parent_id } = req.body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (parent_id !== undefined) updateData.parent_id = parent_id;

    const { data: existingPage, error: checkError } = await supabase
      .from('pages')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .is('deleted_at', null)
      .single();

    if (checkError || !existingPage) {
      res.status(404).json({ error: 'Not found', message: 'Page not found' });
      return;
    }

    const { data: page, error } = await supabase
      .from('pages')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({ data: page });
  } catch (err) {
    console.error('Update page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.delete('/:id', async (req: Request & { userId?: string }, res: Response) => {
  try {
    const { id } = req.params;

    const { data: existingPage, error: checkError } = await supabase
      .from('pages')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .is('deleted_at', null)
      .single();

    if (checkError || !existingPage) {
      res.status(404).json({ error: 'Not found', message: 'Page not found' });
      return;
    }

    const { error } = await supabase
      .from('pages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) {
      throw error;
    }

    res.status(204).send();
  } catch (err) {
    console.error('Delete page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
